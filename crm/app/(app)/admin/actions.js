'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncProjectsFromSheet } from '@/lib/projectsSync';

const ADMIN = '/admin';
const back = (msg, ok) => redirect(`${ADMIN}?${ok ? 'ok' : 'error'}=` + encodeURIComponent(msg));

export async function createAgent(formData) {
  await requireAdmin();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const full_name = String(formData.get('full_name') || '').trim();
  const role = String(formData.get('role') || 'agent');
  const seniority = String(formData.get('seniority') || 'junior');

  if (!email || !password) back('Email and password are required');

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error) back(error.message);

  // The signup trigger creates the profile; set its role/seniority/name.
  const { error: pErr } = await admin
    .from('profiles')
    .update({ full_name, role, seniority })
    .eq('id', data.user.id);
  if (pErr) back(pErr.message);

  revalidatePath(ADMIN);
  back(`Created ${email}`, true);
}

export async function updateAgent(formData) {
  await requireAdmin();
  const id = String(formData.get('agent_id'));
  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({
      full_name: String(formData.get('full_name') || '').trim(),
      role: String(formData.get('role') || 'agent'),
      seniority: String(formData.get('seniority') || 'junior'),
      avatar_url: emptyToNull(formData.get('avatar_url')),
    })
    .eq('id', id);
  if (error) back(error.message);
  revalidatePath(ADMIN);
  back('Agent updated', true);
}

export async function reassignLead(formData) {
  await requireAdmin();
  const { supabase } = await requireAdmin();
  const leadId = String(formData.get('lead_id'));
  const agentId = String(formData.get('assigned_agent_id') || '') || null;

  const { error } = await supabase
    .from('leads')
    .update({ assigned_agent_id: agentId, suggested_agent_id: null })
    .eq('id', leadId);
  if (error) back(error.message);
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
