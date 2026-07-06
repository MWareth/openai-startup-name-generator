'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncProjectsFromSheet } from '@/lib/projectsSync';
import { sendPushToUser } from '@/lib/push';
import { notify } from '@/lib/notify';

const ADMIN = '/admin';
const back = (msg, ok) => redirect(`${ADMIN}?${ok ? 'ok' : 'error'}=` + encodeURIComponent(msg));

export async function createAgent(formData) {
  await requireAdmin();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const full_name = String(formData.get('full_name') || '').trim();
  const role = String(formData.get('role') || 'agent');
  const seniority = String(formData.get('seniority') || 'junior');
  const team = String(formData.get('team') || 'Offplan').trim() || 'Offplan';

  if (!email || !password) back('Email and password are required');

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error) back(error.message);

  // The signup trigger creates the profile; set its role/seniority/name/team.
  // must_change_password forces the user to replace the temp password at first login.
  const { error: pErr } = await admin
    .from('profiles')
    .update({ full_name, role, seniority, team, must_change_password: true })
    .eq('id', data.user.id);
  if (pErr) back(pErr.message);

  revalidatePath(ADMIN);
  back(`Created ${email}`, true);
}

export async function updateAgent(formData) {
  await requireAdmin();
  const id = String(formData.get('agent_id'));
  const email = String(formData.get('email') || '').trim();
  const currentEmail = String(formData.get('current_email') || '').trim();
  const admin = createAdminClient();

  // Email lives in auth.users — update it there only when it actually changed.
  // An admin change is auto-confirmed, so the agent can sign in with the new
  // address immediately.
  if (email && email.toLowerCase() !== currentEmail.toLowerCase()) {
    const { error: eErr } = await admin.auth.admin.updateUserById(id, { email, email_confirm: true });
    if (eErr) back(eErr.message);
  }

  const { error } = await admin
    .from('profiles')
    .update({
      full_name: String(formData.get('full_name') || '').trim(),
      email: email || null,
      role: String(formData.get('role') || 'agent'),
      seniority: String(formData.get('seniority') || 'junior'),
      avatar_url: emptyToNull(formData.get('avatar_url')),
    })
    .eq('id', id);
  if (error) back(error.message);
  revalidatePath(ADMIN);
  back('Agent updated', true);
}

// An agent who left the company: block their login and send their open leads
// to the pool. Won/lost leads stay put to preserve sales history. Reversible.
export async function deactivateAgent(formData) {
  const { supabase } = await requireAdmin();
  const id = String(formData.get('agent_id'));
  const admin = createAdminClient();

  // 1. Move their active-pipeline leads into the pool (assigned_agent_id = null).
  //    Use the admin's session client so the "only an admin reassigns" trigger passes.
  const { error: lErr } = await supabase
    .from('leads')
    .update({ assigned_agent_id: null, suggested_agent_id: null })
    .eq('assigned_agent_id', id)
    .not('status', 'in', '(won,lost)');
  if (lErr) back(lErr.message);

  // 2. Block their login (~100 years). The ban itself IS the deactivation, so
  //    no database column / migration is needed. Reactivate lifts it.
  const { error: bErr } = await admin.auth.admin.updateUserById(id, { ban_duration: '876000h' });
  if (bErr) back(bErr.message);

  revalidatePath(ADMIN);
  revalidatePath('/leads');
  back('Agent deactivated — their open leads moved to the pool', true);
}

// Set a new temporary password for a user. They must change it at next login.
export async function resetAgentPassword(formData) {
  await requireAdmin();
  const id = String(formData.get('agent_id'));
  const password = String(formData.get('password') || '');
  if (password.length < 6) back('Password must be at least 6 characters');

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { password });
  if (error) back(error.message);

  await admin.from('profiles').update({ must_change_password: true }).eq('id', id);

  revalidatePath(ADMIN);
  back('Temporary password set — the user must change it at next login', true);
}

export async function reactivateAgent(formData) {
  await requireAdmin();
  const id = String(formData.get('agent_id'));
  const admin = createAdminClient();
  const { error } = await admin.auth.admin.updateUserById(id, { ban_duration: 'none' });
  if (error) back(error.message);
  revalidatePath(ADMIN);
  back('Agent reactivated — they can log in again', true);
}

export async function reassignLead(formData) {
  const { user, supabase } = await requireAdmin();
  const leadId = String(formData.get('lead_id'));
  const agentId = String(formData.get('assigned_agent_id') || '') || null;

  const patch = { assigned_agent_id: agentId, suggested_agent_id: null };
  // Restart the response-SLA clock when (re)assigned to an agent.
  if (agentId) {
    patch.assigned_at = new Date().toISOString();
    patch.sla_alerted_at = null;
    patch.sla_escalated_at = null;
  }
  let { error } = await supabase.from('leads').update(patch).eq('id', leadId);
  // The SLA fields (migration 0023) may not exist yet — retry without them.
  if (error && /assigned_at|sla_/.test(error.message || '')) {
    delete patch.assigned_at; delete patch.sla_alerted_at; delete patch.sla_escalated_at;
    ({ error } = await supabase.from('leads').update(patch).eq('id', leadId));
  }
  if (error) back(error.message);

  if (agentId) {
    const { data: lead } = await supabase.from('leads').select('name').eq('id', leadId).single();
    // Web push (unless you assigned it to yourself) + an in-app notification.
    if (agentId !== user.id) {
      await sendPushToUser(agentId, {
        title: '🔄 Lead assigned to you',
        body: `${lead?.name || 'A lead'} was just assigned to you.`,
        url: `/leads/${leadId}`,
      });
    }
    await notify({
      userId: agentId,
      type: 'lead_assigned',
      title: `Lead assigned to you: ${lead?.name || 'a lead'}`,
      body: 'A manager assigned you this lead.',
      link: `/leads/${leadId}`,
      leadId,
    });
  }

  revalidatePath(ADMIN);
  revalidatePath('/leads');
  back('Lead reassigned', true);
}

export async function createTarget(formData) {
  await requireAdmin();
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('targets').insert({
    agent_id: String(formData.get('agent_id')),
    name: String(formData.get('name') || 'Target').trim(),
    target_amount: Number(formData.get('target_amount') || 0),
    period_start: emptyToNull(formData.get('period_start')),
    period_end: emptyToNull(formData.get('period_end')),
    is_active: true,
  });
  if (error) back(error.message);
  revalidatePath(ADMIN);
  revalidatePath('/targets');
  back('Target created', true);
}

export async function addTier(formData) {
  await requireAdmin();
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('incentive_tiers').insert({
    target_id: String(formData.get('target_id')),
    threshold_amount: Number(formData.get('threshold_amount') || 0),
    reward_label: String(formData.get('reward_label') || '').trim(),
    reward_amount: Number(formData.get('reward_amount') || 0),
  });
  if (error) back(error.message);
  revalidatePath(ADMIN);
  revalidatePath('/targets');
  back('Incentive added', true);
}

export async function deleteTier(formData) {
  await requireAdmin();
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('incentive_tiers').delete().eq('id', String(formData.get('tier_id')));
  if (error) back(error.message);
  revalidatePath(ADMIN);
  back('Incentive removed', true);
}

export async function archiveTarget(formData) {
  await requireAdmin();
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from('targets')
    .update({ is_active: false })
    .eq('id', String(formData.get('target_id')));
  if (error) back(error.message);
  revalidatePath(ADMIN);
  revalidatePath('/targets');
  back('Target archived', true);
}

export async function createLaunch(formData) {
  const { user, supabase } = await requireAdmin();
  const title = String(formData.get('title') || '').trim();
  if (!title) back('Launch title is required');
  const { error } = await supabase.from('launches').insert({
    title,
    developer: emptyToNull(formData.get('developer')),
    note: emptyToNull(formData.get('note')),
    image_url: emptyToNull(formData.get('image_url')),
    created_by: user.id,
  });
  if (error) back(error.message);
  revalidatePath(ADMIN);
  revalidatePath('/dashboard');
  back('Launch posted', true);
}

export async function deleteLaunch(formData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('launches').delete().eq('id', String(formData.get('launch_id')));
  if (error) back(error.message);
  revalidatePath(ADMIN);
  revalidatePath('/dashboard');
  back('Launch removed', true);
}

export async function syncProjects() {
  await requireAdmin();
  const admin = createAdminClient();
  let result;
  try {
    const n = await syncProjectsFromSheet(admin);
    result = { ok: true, msg: `Synced ${n} projects from the Google Sheet.` };
  } catch (e) {
    result = { ok: false, msg: 'Sync failed: ' + e.message };
  }
  revalidatePath(ADMIN);
  revalidatePath('/projects');
  revalidatePath('/proposal');
  back(result.msg, result.ok);
}

export async function createProject(formData) {
  const { user, supabase } = await requireAdmin();
  const name = String(formData.get('name') || '').trim();
  if (!name) back('Project name is required');
  const priceRaw = String(formData.get('starting_price') || '').trim();
  const { error } = await supabase.from('projects').insert({
    name,
    developer: emptyToNull(formData.get('developer')),
    area: emptyToNull(formData.get('area')),
    status: String(formData.get('status') || 'Off-plan'),
    handover: emptyToNull(formData.get('handover')),
    starting_price: priceRaw ? Number(priceRaw) : null,
    payment_plan: emptyToNull(formData.get('payment_plan')),
    description: emptyToNull(formData.get('description')),
    brochure_url: emptyToNull(formData.get('brochure_url')),
    image_url: emptyToNull(formData.get('image_url')),
    created_by: user.id,
  });
  if (error) back(error.message);
  revalidatePath(ADMIN);
  revalidatePath('/projects');
  back('Project added', true);
}

export async function deleteProject(formData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('projects').delete().eq('id', String(formData.get('project_id')));
  if (error) back(error.message);
  revalidatePath(ADMIN);
  revalidatePath('/projects');
  back('Project removed', true);
}

export async function createDeveloper(formData) {
  const { supabase } = await requireAdmin();
  const name = String(formData.get('name') || '').trim();
  if (!name) back('Developer name is required');
  const { error } = await supabase.from('developers').insert({
    name,
    about: emptyToNull(formData.get('about')),
    website: emptyToNull(formData.get('website')),
  });
  if (error) back(error.message);
  revalidatePath(ADMIN);
  revalidatePath('/projects');
  back('Developer added', true);
}

export async function deleteDeveloper(formData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('developers').delete().eq('id', String(formData.get('developer_id')));
  if (error) back(error.message);
  revalidatePath(ADMIN);
  revalidatePath('/projects');
  back('Developer removed', true);
}

export async function createEmbed(formData) {
  const { user, supabase } = await requireAdmin();
  let url = String(formData.get('embed_url') || '').trim();
  // Accept either a raw URL or a full <iframe …src="…"> paste.
  const m = url.match(/src=["']([^"']+)["']/i);
  if (m) url = m[1];
  if (!url) back('Embed link is required');
  const { error } = await supabase.from('data_embeds').insert({
    title: String(formData.get('title') || 'Dataset').trim() || 'Dataset',
    embed_url: url,
    height: Number(formData.get('height') || 900) || 900,
    created_by: user.id,
  });
  if (error) back(error.message);
  revalidatePath(ADMIN);
  revalidatePath('/projects');
  back('Data source added', true);
}

export async function deleteEmbed(formData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('data_embeds').delete().eq('id', String(formData.get('embed_id')));
  if (error) back(error.message);
  revalidatePath(ADMIN);
  revalidatePath('/projects');
  back('Data source removed', true);
}

function emptyToNull(v) {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}
