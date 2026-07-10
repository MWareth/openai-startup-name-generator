'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser, requireStaff, hasAdminAccess, hasStaffAccess, canRouteLeads, STAFF_ROLES } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { writeTolerant } from '@/lib/db';
import { computeCommission } from '@/lib/commission';
import { sendPushToUser } from '@/lib/push';
import { notify, notifyManagement, resolveNotifications } from '@/lib/notify';
import { ACTIVITY_LABELS, STATUS_LABELS, QUAL_LABELS } from '@/lib/format';

// Route a lead update to the right bell:
//  • an agent's update pings all admins (their bell = the team activity feed),
//  • an admin/manager's note pings the lead's assigned agent.
// Agent→admin pings are in-app only (no email) to avoid flooding inboxes.
async function notifyLeadActivity({ supabase, user, profile, leadId, typeLabel, body }) {
  const { data: lead } = await supabase.from('leads').select('name, assigned_agent_id').eq('id', leadId).single();
  const leadName = lead?.name || 'a lead';
  const text = String(body || '').trim();
  const snippet = text.length > 90 ? text.slice(0, 90) + '…' : text;

  if (hasStaffAccess(profile)) {
    if (lead?.assigned_agent_id && lead.assigned_agent_id !== user.id) {
      await notify({
        userId: lead.assigned_agent_id,
        type: 'lead_comment',
        title: `${profile?.full_name || 'Management'} added a note on ${leadName}`,
        body: `${typeLabel}${snippet ? ': ' + snippet : ''}`,
        link: `/leads/${leadId}`,
        leadId,
        cta: 'Open the lead',
      });
    }
    return;
  }
  const adminCli = createAdminClient();
  const { data: mgrs } = await adminCli.from('profiles').select('id').in('role', ['admin', 'director', 'c_suite']);
  for (const m of mgrs || []) {
    if (m.id === user.id) continue;
    await notify({
      userId: m.id,
      type: 'lead_activity',
      title: `${profile?.full_name || 'An agent'} · ${typeLabel} on ${leadName}`,
      body: snippet || typeLabel,
      link: `/leads/${leadId}`,
      leadId,
      email: false,
    });
  }
}

export async function createLead(formData) {
  const { user, profile, supabase } = await requireUser();

  const name = String(formData.get('name') || '').trim();
  if (!name) redirect('/leads/new?error=' + encodeURIComponent('Name is required'));

  // Admin/support may assign to any agent; everyone else keeps it themselves.
  let assignedTo = user.id;
  if (hasStaffAccess(profile)) {
    const picked = emptyToNull(formData.get('assigned_agent_id'));
    if (picked) assignedTo = picked;
  }

  const phone = emptyToNull(formData.get('phone'));
  const email = emptyToNull(formData.get('email'));

  // Reject duplicates. Checks ALL leads (even those owned by other agents) via
  // a security-definer function, and reports who the existing one belongs to.
  if (phone || email) {
    const { data: dupes } = await supabase.rpc('find_duplicate_lead', {
      p_phone: phone,
      p_email: email,
    });
    const dup = Array.isArray(dupes) ? dupes[0] : dupes;
    if (dup) {
      const who = dup.assigned_to || 'Unassigned';
      redirect(
        '/leads/new?error=' +
          encodeURIComponent(
            `Duplicate: this ${dup.match_on} already belongs to lead "${dup.lead_name}", assigned to ${who}. Lead not added.`
          )
      );
    }
  }

  const budgetRaw = String(formData.get('budget') || '').trim();

  // Normalise the cold-call source so the contest counter is reliable.
  let source = emptyToNull(formData.get('source'));
  if (source && source.trim().toLowerCase() === 'cold call') source = 'Cold Call';

  const insert = {
    name,
    phone,
    email,
    source,
    property_interest: emptyToNull(formData.get('property_interest')),
    budget: budgetRaw ? Number(budgetRaw) : null,
    qualification: String(formData.get('qualification') || 'warm'),
    status: String(formData.get('status') || 'new'),
    assigned_agent_id: assignedTo,
    created_by: user.id,
  };
  // Start the response-SLA clock when the lead is created already assigned.
  if (assignedTo) insert.assigned_at = new Date().toISOString();
  // Only include these when chosen, so lead creation still works even before
  // the property_type (0005) / bedrooms (0006) column migrations are applied.
  const ptype = emptyToNull(formData.get('property_type'));
  if (ptype) insert.property_type = ptype;
  const beds = emptyToNull(formData.get('bedrooms'));
  if (beds) insert.bedrooms = beds;
  const community = emptyToNull(formData.get('community'));
  if (community) insert.community = community; // only when set (safe pre-migration 0008)
  if (formData.get('self_sourced')) insert.self_sourced = true; // own referral (safe pre-migration 0009)

  // Tolerant insert: any column this database hasn't migrated yet (community,
  // assigned_at, self_sourced, …) is dropped and the insert retried.
  const { data, error } = await writeTolerant(
    (p) => supabase.from('leads').insert(p).select('id').single(),
    insert
  );
  if (error) redirect('/leads/new?error=' + encodeURIComponent(error.message));

  // Optional opening note (used by the paste-to-create flow) → lead timeline.
  const initialNote = emptyToNull(formData.get('initial_note'));
  if (initialNote) {
    await supabase.from('lead_activities').insert({
      lead_id: data.id,
      agent_id: user.id,
      type: 'note',
      occurred_on: new Date().toISOString().slice(0, 10),
      body: initialNote,
    });
  }

  // Notify the assignee if the lead was handed to someone other than the creator.
  if (assignedTo && assignedTo !== user.id) {
    await sendPushToUser(assignedTo, {
      title: '🆕 New lead assigned',
      body: `${name} was assigned to you.`,
      url: '/leads/' + data.id,
    });
    await notify({
      userId: assignedTo,
      type: 'lead_assigned',
      title: `New lead assigned: ${name}`,
      body: `${profile?.full_name || 'A manager'} assigned you this lead.`,
      link: `/leads/${data.id}`,
      leadId: data.id,
    });
  }

  revalidatePath('/leads');
  redirect('/leads/' + data.id + '?ok=' + encodeURIComponent('Lead created.'));
}

export async function addActivity(formData) {
  const { user, profile, supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));
  const type = String(formData.get('type') || 'note');
  const body = String(formData.get('body') || '').trim();

  const { error } = await supabase.from('lead_activities').insert({
    lead_id: leadId,
    agent_id: user.id,
    type,
    occurred_on: String(formData.get('occurred_on') || new Date().toISOString().slice(0, 10)),
    body,
  });

  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));

  await notifyLeadActivity({ supabase, user, profile, leadId, typeLabel: ACTIVITY_LABELS[type] || 'Update', body });

  // Acting on the lead resolves its action-required notifications for this user
  // (so "new lead not contacted" / SLA / docs reminders drop off the bell), plus
  // any general "update your leads" reminder.
  await resolveNotifications({ userId: user.id, leadId, types: ['lead_assigned', 'lead_sla', 'deal_docs'] });
  await resolveNotifications({ userId: user.id, types: ['update_leads'] });

  // Optionally schedule a follow-up from the same form.
  const nextFollowUp = emptyToNull(formData.get('next_follow_up'));
  if (nextFollowUp) {
    const dueOn = nextFollowUp.slice(0, 10);
    let dueAt = null;
    if (nextFollowUp.includes('T')) {
      const withSecs = nextFollowUp.length === 16 ? nextFollowUp + ':00' : nextFollowUp;
      const d = new Date(withSecs + '+04:00'); // entered in Dubai time
      if (!Number.isNaN(d.getTime())) dueAt = d.toISOString();
    }
    // writeTolerant drops due_at if migration 0024 hasn't been applied yet.
    await writeTolerant(
      (p) => supabase.from('lead_followups').insert(p),
      { lead_id: leadId, due_on: dueOn, due_at: dueAt, note: '', created_by: user.id }
    );
    await syncNextFollowUp(supabase, leadId);
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/dashboard');
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent('Activity logged.'));
}

// Keep leads.next_follow_up pointing at the earliest pending follow-up (or null)
// so the dashboard "Today's to-do" and "Due" badge keep working unchanged.
async function syncNextFollowUp(supabase, leadId) {
  const { data } = await supabase
    .from('lead_followups')
    .select('due_on')
    .eq('lead_id', leadId)
    .eq('done', false)
    .order('due_on', { ascending: true })
    .limit(1);
  const next = data && data.length ? data[0].due_on : null;
  await supabase.from('leads').update({ next_follow_up: next }).eq('id', leadId);
}

export async function addFollowUp(formData) {
  const { user, supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));
  const due_on = emptyToNull(formData.get('due_on'));
  if (!due_on) redirect(`/leads/${leadId}?error=` + encodeURIComponent('Pick a follow-up date.'));
  const note = String(formData.get('note') || '').trim();
  const { error } = await supabase.from('lead_followups').insert({
    lead_id: leadId,
    due_on,
    note,
    created_by: user.id,
  });
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));
  await syncNextFollowUp(supabase, leadId);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/dashboard');
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent('Follow-up added.'));
}

export async function completeFollowUp(formData) {
  const { supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));
  const id = String(formData.get('followup_id'));
  const { error } = await supabase
    .from('lead_followups')
    .update({ done: true, done_at: new Date().toISOString() })
    .eq('id', id);
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));
  await syncNextFollowUp(supabase, leadId);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/dashboard');
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent('Follow-up marked done.'));
}

export async function deleteFollowUp(formData) {
  const { supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));
  const id = String(formData.get('followup_id'));
  const { error } = await supabase.from('lead_followups').delete().eq('id', id);
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));
  await syncNextFollowUp(supabase, leadId);
  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/dashboard');
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent('Follow-up removed.'));
}

// useFormState action: returns { ok }/{ error } so the confirmation shows inline
// on the form (no redirect) — reliable on iPhone, where the redirect message was
// getting dropped.
export async function updateLead(prevState, formData) {
  const { user, supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));

  const patch = {};
  if (formData.get('qualification')) patch.qualification = String(formData.get('qualification'));
  if (formData.get('status')) patch.status = String(formData.get('status'));
  const pType = emptyToNull(formData.get('property_type'));
  if (pType) patch.property_type = pType; // only when chosen (safe pre-migration 0005)
  const beds = emptyToNull(formData.get('bedrooms'));
  if (beds) patch.bedrooms = beds; // only when chosen (safe pre-migration 0006)

  const { error } = await writeTolerant((p) => supabase.from('leads').update(p).eq('id', leadId), patch);
  if (error) return { error: error.message };

  // Changing status is acting on the lead → clear its action reminders.
  if (patch.status) {
    await resolveNotifications({ userId: user.id, leadId, types: ['lead_assigned', 'lead_sla'] });
  }

  const parts = [];
  if (patch.status) parts.push(`Status → ${STATUS_LABELS[patch.status] || patch.status}`);
  if (patch.qualification) parts.push(`Qualification → ${QUAL_LABELS[patch.qualification] || patch.qualification}`);
  const msg = parts.length ? `Saved · ${parts.join(' · ')}` : 'Lead updated.';

  // No revalidatePath here — the client refreshes via router.refresh() after
  // reading this result, so the action never triggers an inline page re-render.
  return { ok: msg };
}

// Quick-save just the phone number (has its own Save button next to the field).
// Only touches the `phone` column, which always exists, so it can't be blocked
// by a not-yet-applied column migration.
export async function updateLeadPhone(formData) {
  const { supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));
  const phone = emptyToNull(formData.get('phone'));
  const { error } = await supabase.from('leads').update({ phone }).eq('id', leadId);
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));
  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent('Phone number updated.'));
}

// Edit the contact details. Admin/support can change anything. Agents can only
// FILL IN blank fields — they can never overwrite a detail that's already saved
// (enforced here on the server, not just hidden in the UI).
export async function updateLeadDetails(formData) {
  const { profile, supabase } = await requireUser();
  const staff = hasStaffAccess(profile);
  const leadId = String(formData.get('lead_id'));
  const name = String(formData.get('name') || '').trim();

  let source = emptyToNull(formData.get('source'));
  if (source && source.trim().toLowerCase() === 'cold call') source = 'Cold Call';
  const budgetRaw = String(formData.get('budget') || '').trim();

  const desired = {
    name: name || null,
    phone: emptyToNull(formData.get('phone')),
    email: emptyToNull(formData.get('email')),
    source,
    budget: budgetRaw ? Number(budgetRaw) : null,
    community: emptyToNull(formData.get('community')),
    property_interest: emptyToNull(formData.get('property_interest')),
  };

  let patch;
  if (staff) {
    if (!name) redirect(`/leads/${leadId}?error=` + encodeURIComponent('Name is required.'));
    patch = desired;
  } else {
    // Agents: only apply values to fields that are currently blank.
    const { data: cur } = await supabase.from('leads').select('*').eq('id', leadId).single();
    patch = {};
    for (const k of Object.keys(desired)) {
      const curVal = cur ? cur[k] : null;
      const blank = curVal === null || curVal === undefined || String(curVal).trim() === '';
      const val = desired[k];
      const hasNew = val !== null && val !== undefined && String(val).trim() !== '';
      if (blank && hasNew) patch[k] = val;
    }
    if (!Object.keys(patch).length) {
      redirect(`/leads/${leadId}?ok=` + encodeURIComponent('No changes — you can only fill blank fields. Ask an admin to change saved details.'));
    }
  }

  // writeTolerant drops any not-yet-migrated column (e.g. community) and retries.
  const { error } = await writeTolerant((p) => supabase.from('leads').update(p).eq('id', leadId), patch);
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));
  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent('Details updated.'));
}

// Permanently delete a lead (and its activities/follow-ups via cascade). Closed
// deals are kept but unlinked. Staff only (admin/support/oversight).
export async function deleteLead(formData) {
  const { profile } = await requireUser();
  if (!hasStaffAccess(profile)) {
    redirect('/leads?error=' + encodeURIComponent('Only admin/support can delete leads.'));
  }
  const leadId = String(formData.get('lead_id'));
  const admin = createAdminClient();
  const { error } = await admin.from('leads').delete().eq('id', leadId);
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));
  revalidatePath('/leads');
  redirect('/leads?ok=' + encodeURIComponent('Lead deleted.'));
}

// Log that a message was sent to the lead (WhatsApp / SMS) as a timeline note.
// Returns { ok } / { error } so the confirmation shows inline (no redirect that
// iPhone could drop). Also pings the admin bell via notifyLeadActivity.
export async function logMessage(prevState, formData) {
  const { user, profile, supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));
  const channel = String(formData.get('channel') || 'whatsapp');
  const label = channel === 'sms' ? '✉️ Sent an SMS' : '📲 Sent a WhatsApp message';
  const today = new Date().toISOString().slice(0, 10);
  const { error } = await supabase.from('lead_activities').insert({
    lead_id: leadId,
    agent_id: user.id,
    type: 'note',
    occurred_on: today,
    body: label,
  });
  if (error) return { error: error.message };
  await notifyLeadActivity({ supabase, user, profile, leadId, typeLabel: 'Message', body: label });
  return { ok: 'Message note added.' };
}

// Flag a lead as fake / spam: move it to Lost and drop a note. Any agent (on
// their own lead), marketing, or admin can do this — RLS governs who can update.
export async function markLeadFake(formData) {
  const { user, supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));
  const { error } = await writeTolerant(
    (p) => supabase.from('leads').update(p).eq('id', leadId),
    { status: 'lost' }
  );
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));
  await supabase.from('lead_activities').insert({
    lead_id: leadId,
    agent_id: user.id,
    type: 'note',
    occurred_on: new Date().toISOString().slice(0, 10),
    body: '🚫 Flagged as fake / spam',
  });
  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent('Flagged as fake — moved to Lost.'));
}

export async function suggestReassign(formData) {
  const { user, profile, supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));
  const selected = emptyToNull(formData.get('suggested_agent_id'));
  const admin = canRouteLeads(profile); // admin + support + marketing reassign directly

  // Admin/marketing reassign the lead directly; agents can only propose (the DB
  // trigger blocks them from changing assigned_agent_id).
  const patch = admin
    ? { assigned_agent_id: selected, suggested_agent_id: null }
    : { suggested_agent_id: selected };
  // Restart the response-SLA clock on a direct (re)assignment to an agent.
  if (admin && selected) {
    patch.assigned_at = new Date().toISOString();
    patch.sla_alerted_at = null;
    patch.sla_escalated_at = null;
  }

  const { error } = await writeTolerant((p) => supabase.from('leads').update(p).eq('id', leadId), patch);
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));

  // Notifications.
  const { data: lead } = await supabase.from('leads').select('name').eq('id', leadId).single();
  const leadName = lead?.name || 'a lead';
  if (admin && selected) {
    // Direct reassignment → web push (unless to yourself) + in-app record.
    if (selected !== profile.id) {
      await sendPushToUser(selected, {
        title: '🔄 Lead assigned to you',
        body: `${leadName} was just reassigned to you.`,
        url: `/leads/${leadId}`,
      });
    }
    await notify({
      userId: selected,
      type: 'lead_assigned',
      title: `Lead assigned to you: ${leadName}`,
      body: `${profile?.full_name || 'A manager'} assigned you this lead.`,
      link: `/leads/${leadId}`,
      leadId,
    });
  } else if (!admin && selected) {
    // Agent proposed a reassignment → tell management.
    await notifyManagement({
      exceptUserId: user.id,
      type: 'reassign_suggested',
      title: `Reassignment suggested: ${leadName}`,
      body: `${profile?.full_name || 'An agent'} suggested reassigning this lead.`,
      link: `/leads/${leadId}`,
      leadId,
    });
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  const msg = admin
    ? (selected ? 'Lead reassigned.' : 'Lead moved to the lead pool.')
    : (selected ? 'Reassignment suggestion saved.' : 'Suggestion cleared.');
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent(msg));
}

// Agent marks the lead won without entering money. Support finalises the deal.
export async function markLeadWon(formData) {
  const { profile, supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));
  const { data: lead } = await supabase.from('leads').select('name').eq('id', leadId).single();

  const { error } = await supabase.from('leads').update({ status: 'won' }).eq('id', leadId);
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));

  // Notify support + management to collect details and record the deal.
  const admin = createAdminClient();
  const { data: staff } = await admin.from('profiles').select('id').in('role', STAFF_ROLES);
  for (const s of staff || []) {
    await notify({
      userId: s.id,
      type: 'deal_pending',
      title: `Deal to finalise: ${lead?.name || 'a lead'}`,
      body: `${profile?.full_name || 'An agent'} marked this lead as closed/won. Please get the deal details from them and record the value & commission.`,
      link: `/leads/${leadId}`,
      leadId,
      cta: 'Open the lead',
    });
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent('Marked as won — support will finalise the deal details.'));
}

// Full deal entry (value, commission split). Support/management only — agents
// mark the lead won via markLeadWon and support records the details.
export async function logDeal(formData) {
  const { user, profile, supabase } = await requireStaff();
  const leadId = String(formData.get('lead_id'));

  // The deal is credited to the lead's assigned agent (fallback: current user).
  const { data: lead } = await supabase
    .from('leads')
    .select('assigned_agent_id')
    .eq('id', leadId)
    .single();

  const agentId = lead?.assigned_agent_id || user.id;

  // Look up that agent's seniority to pick the split.
  let seniority = profile?.seniority || 'junior';
  if (agentId !== user.id) {
    const { data: agent } = await supabase
      .from('profiles')
      .select('seniority')
      .eq('id', agentId)
      .single();
    if (agent?.seniority) seniority = agent.seniority;
  }

  const dealValue = Number(formData.get('deal_value') || 0);
  const gross = Number(formData.get('gross_commission') || 0);
  const referral = Number(formData.get('referral_amount') || 0);
  const selfSourced = !!formData.get('self_sourced'); // own referral -> 60/40
  const split = computeCommission({ grossCommission: gross, referralAmount: referral, seniority, selfSourced });

  const dealRow = {
    lead_id: leadId,
    agent_id: agentId,
    property: emptyToNull(formData.get('property')),
    property_type: emptyToNull(formData.get('property_type')),
    deal_value: dealValue,
    commission_rate: formData.get('commission_rate') ? Number(formData.get('commission_rate')) : null,
    gross_commission: gross,
    referral_party: emptyToNull(formData.get('referral_party')),
    referral_amount: referral,
    agent_split_pct: split.agentSplitPct,
    agent_commission: split.agentCommission,
    company_commission: split.companyCommission,
    closed_on: String(formData.get('closed_on') || new Date().toISOString().slice(0, 10)),
    created_by: user.id,
  };
  if (selfSourced) dealRow.self_sourced = true; // safe pre-migration 0009
  const { error } = await supabase.from('deals').insert(dealRow);

  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));

  // Mark the lead won.
  await supabase.from('leads').update({ status: 'won' }).eq('id', leadId);

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/targets');
  revalidatePath('/dashboard');
  revalidatePath('/leaderboard');
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent('Deal logged and lead marked won.'));
}

// On-demand translation of a note to English using Google Translate's free
// endpoint (no API key, no cost). Auto-detects the source language.
// Returns { text } on success or { error } on failure.
export async function translateToEnglish(text) {
  await requireUser();
  const clean = String(text || '').trim();
  if (!clean) return { text: '' };

  try {
    const url =
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=' +
      encodeURIComponent(clean);
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      cache: 'no-store',
    });
    if (!res.ok) return { error: `Translation unavailable (${res.status}). Try again.` };
    const data = await res.json();
    // Response shape: [[[ "translated chunk", "source chunk", ... ], ...], ...]
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const out = data[0].map((seg) => (seg && seg[0] ? seg[0] : '')).join('').trim();
      if (out) return { text: out };
    }
    return { error: 'Could not translate this note.' };
  } catch (e) {
    return { error: 'Translation request failed. Try again.' };
  }
}

function emptyToNull(v) {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}
