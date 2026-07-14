'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser, canRouteLeads } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { contentReady, extractAndWriteScript, writeScriptFromFacts } from '@/lib/content';

// Content Studio actions. Creation/editing/approval is for staff + marketing;
// agents consume approved scripts read-only on the page.

const MAX_TOTAL_BYTES = 15 * 1024 * 1024; // stay well under the 32MB API request cap after base64
const OK_IMAGE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

function fail(path, msg) {
  redirect(`${path}?error=` + encodeURIComponent(msg));
}

async function requireCreator() {
  const ctx = await requireUser();
  if (!canRouteLeads(ctx.profile)) redirect('/content?error=' + encodeURIComponent('Only admin, support or marketing can create content.'));
  return ctx;
}

// Upload brochure/renders (and/or paste notes) → extract facts + first script.
export async function createContentProject(formData) {
  const { user } = await requireCreator();
  if (!contentReady()) fail('/content', 'ANTHROPIC_API_KEY is not set in Vercel yet — see the setup note on this page.');

  const language = String(formData.get('language') || 'English');
  const tone = String(formData.get('tone') || 'Bullish default — short, punchy, direct');
  const durationSec = parseInt(String(formData.get('duration') || '45'), 10) || 45;
  const notes = String(formData.get('notes') || '').trim();

  const uploads = formData.getAll('files').filter((f) => f && typeof f.arrayBuffer === 'function' && f.size > 0);
  if (!uploads.length && !notes) fail('/content', 'Upload a brochure/renders or paste the project details first.');

  let total = 0;
  const files = [];
  for (const f of uploads) {
    total += f.size;
    if (total > MAX_TOTAL_BYTES) fail('/content', 'Files are too big — keep the total under 15 MB (use the main brochure, not the full media kit).');
    const mediaType = f.type === 'application/pdf' ? 'application/pdf' : OK_IMAGE.includes(f.type) ? f.type : null;
    if (!mediaType) fail('/content', `Unsupported file type: ${f.type || f.name}. Use PDF, JPG, PNG or WebP.`);
    const buf = Buffer.from(await f.arrayBuffer());
    files.push({ mediaType, base64: buf.toString('base64') });
  }

  let result;
  try {
    result = await extractAndWriteScript({ files, notes, language, tone, durationSec });
  } catch (e) {
    fail('/content', 'Generation failed: ' + (e?.message || 'unknown error') + ' — nothing was saved, try again.');
  }

  const admin = createAdminClient();
  const facts = {
    project_name: result.project_name,
    developer: result.developer,
    location: result.location,
    handover: result.handover,
    payment_plan: result.payment_plan,
    starting_price: result.starting_price,
    unit_types: result.unit_types,
    usps: result.usps || [],
    notes: notes || undefined,
  };
  const { data: project, error } = await admin
    .from('content_projects')
    .insert({
      name: result.project_name || String(formData.get('name') || 'Untitled project'),
      developer: result.developer || null,
      area: result.location || null,
      facts,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (error) fail('/content', error.message);

  await admin.from('content_scripts').insert({
    project_id: project.id,
    language,
    duration_sec: durationSec,
    tone,
    body: result.script_body,
    created_by: user.id,
  });

  revalidatePath('/content');
  redirect(`/content/${project.id}?ok=` + encodeURIComponent('Script generated — review, edit and approve it below.'));
}

// New script for an existing project (other language / tone / length) — uses
// the stored facts, so no brochure re-upload and it costs a fraction.
export async function generateScript(formData) {
  const { user } = await requireCreator();
  const projectId = String(formData.get('project_id'));
  const back = `/content/${projectId}`;
  if (!contentReady()) fail(back, 'ANTHROPIC_API_KEY is not set in Vercel yet.');

  const language = String(formData.get('language') || 'English');
  const tone = String(formData.get('tone') || 'Bullish default — short, punchy, direct');
  const durationSec = parseInt(String(formData.get('duration') || '45'), 10) || 45;

  const admin = createAdminClient();
  const { data: project } = await admin.from('content_projects').select('facts').eq('id', projectId).single();
  if (!project) fail('/content', 'Project not found.');

  let body;
  try {
    body = await writeScriptFromFacts({ facts: project.facts, language, tone, durationSec });
  } catch (e) {
    fail(back, 'Generation failed: ' + (e?.message || 'unknown error'));
  }

  await admin.from('content_scripts').insert({
    project_id: projectId,
    language,
    duration_sec: durationSec,
    tone,
    body,
    created_by: user.id,
  });

  revalidatePath(back);
  redirect(`${back}?ok=` + encodeURIComponent(`${language} script generated — review and approve.`));
}

export async function updateScript(formData) {
  await requireCreator();
  const id = String(formData.get('script_id'));
  const projectId = String(formData.get('project_id'));
  const body = String(formData.get('body') || '').trim();
  if (!body) fail(`/content/${projectId}`, 'The script cannot be empty.');
  const admin = createAdminClient();
  // Editing an approved script sends it back to draft for re-approval.
  const { error } = await admin.from('content_scripts').update({ body, status: 'draft', approved_by: null, approved_at: null }).eq('id', id);
  if (error) fail(`/content/${projectId}`, error.message);
  revalidatePath(`/content/${projectId}`);
  redirect(`/content/${projectId}?ok=` + encodeURIComponent('Script saved (back to draft — approve it when ready).'));
}

export async function approveScript(formData) {
  const { user } = await requireCreator();
  const id = String(formData.get('script_id'));
  const projectId = String(formData.get('project_id'));
  const admin = createAdminClient();
  const { error } = await admin
    .from('content_scripts')
    .update({ status: 'approved', approved_by: user.id, approved_at: new Date().toISOString() })
    .eq('id', id);
  if (error) fail(`/content/${projectId}`, error.message);
  revalidatePath(`/content/${projectId}`);
  revalidatePath('/content');
  redirect(`/content/${projectId}?ok=` + encodeURIComponent('Approved — agents can now see this script.'));
}

export async function deleteScript(formData) {
  await requireCreator();
  const id = String(formData.get('script_id'));
  const projectId = String(formData.get('project_id'));
  const admin = createAdminClient();
  await admin.from('content_scripts').delete().eq('id', id);
  revalidatePath(`/content/${projectId}`);
  redirect(`/content/${projectId}?ok=` + encodeURIComponent('Script deleted.'));
}

export async function deleteContentProject(formData) {
  await requireCreator();
  const id = String(formData.get('project_id'));
  const admin = createAdminClient();
  await admin.from('content_projects').delete().eq('id', id); // scripts cascade
  revalidatePath('/content');
  redirect('/content?ok=' + encodeURIComponent('Project deleted.'));
}
