'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser, hasAdminAccess, hasStaffAccess } from '@/lib/auth';
import { computeCommission } from '@/lib/commission';

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

  const insert = {
    name,
    phone,
    email,
    source: emptyToNull(formData.get('source')),
    property_interest: emptyToNull(formData.get('property_interest')),
    budget: budgetRaw ? Number(budgetRaw) : null,
    qualification: String(formData.get('qualification') || 'warm'),
    status: String(formData.get('status') || 'new'),
    assigned_agent_id: assignedTo,
    created_by: user.id,
  };
  // Only include these when chosen, so lead creation still works even before
  // the property_type (0005) / bedrooms (0006) column migrations are applied.
  const ptype = emptyToNull(formData.get('property_type'));
  if (ptype) insert.property_type = ptype;
  const beds = emptyToNull(formData.get('bedrooms'));
  if (beds) insert.bedrooms = beds;
  const community = emptyToNull(formData.get('community'));
  if (community) insert.community = community; // only when set (safe pre-migration 0008)
  if (formData.get('self_sourced')) insert.self_sourced = true; // own referral (safe pre-migration 0009)

  const { data, error } = await supabase.from('leads').insert(insert).select('id').single();

  if (error) redirect('/leads/new?error=' + encodeURIComponent(error.message));

  revalidatePath('/leads');
  redirect('/leads/' + data.id + '?ok=' + encodeURIComponent('Lead created.'));
}

export async function addActivity(formData) {
  const { user, supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));

  const { error } = await supabase.from('lead_activities').insert({
    lead_id: leadId,
    agent_id: user.id,
    type: String(formData.get('type') || 'note'),
    occurred_on: String(formData.get('occurred_on') || new Date().toISOString().slice(0, 10)),
    body: String(formData.get('body') || '').trim(),
  });

  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));

  // Optionally set the next follow-up date on the lead from the same form.
  const nextFollowUp = emptyToNull(formData.get('next_follow_up'));
  if (nextFollowUp) {
    await supabase.from('leads').update({ next_follow_up: nextFollowUp }).eq('id', leadId);
  }

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/dashboard');
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent('Activity logged.'));
}

export async function setFollowUp(formData) {
  const { supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));
  const { error } = await supabase
    .from('leads')
    .update({ next_follow_up: emptyToNull(formData.get('next_follow_up')) })
    .eq('id', leadId);
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));
  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/dashboard');
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent('Follow-up date updated.'));
}

export async function updateLead(formData) {
  const { supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));

  const patch = {};
  if (formData.get('qualification')) patch.qualification = String(formData.get('qualification'));
  if (formData.get('status')) patch.status = String(formData.get('status'));
  const pType = emptyToNull(formData.get('property_type'));
  if (pType) patch.property_type = pType; // only when chosen (safe pre-migration 0005)
  const beds = emptyToNull(formData.get('bedrooms'));
  if (beds) patch.bedrooms = beds; // only when chosen (safe pre-migration 0006)

  const { error } = await supabase.from('leads').update(patch).eq('id', leadId);
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));
  revalidatePath(`/leads/${leadId}`);
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent('Lead updated.'));
}

export async function suggestReassign(formData) {
  const { profile, supabase } = await requireUser();
  const leadId = String(formData.get('lead_id'));
  const selected = emptyToNull(formData.get('suggested_agent_id'));
  const admin = hasStaffAccess(profile); // admin + support reassign directly

  // Admin/owner reassigns the lead directly; agents can only propose (the DB
  // trigger blocks them from changing assigned_agent_id).
  const patch = admin
    ? { assigned_agent_id: selected, suggested_agent_id: null }
    : { suggested_agent_id: selected };

  const { error } = await supabase.from('leads').update(patch).eq('id', leadId);
  if (error) redirect(`/leads/${leadId}?error=` + encodeURIComponent(error.message));

  revalidatePath(`/leads/${leadId}`);
  revalidatePath('/leads');
  const msg = admin
    ? (selected ? 'Lead reassigned.' : 'Lead moved to the lead pool.')
    : (selected ? 'Reassignment suggestion saved.' : 'Suggestion cleared.');
  redirect(`/leads/${leadId}?ok=` + encodeURIComponent(msg));
}

export async function logDeal(formData) {
  const { user, profile, supabase } = await requireUser();
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
