'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser, canRouteLeads } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { contentReady, extractAndWriteScript, writeScriptFromFacts } from '@/lib/content';
import { heygenReady, generateAvatarVideo, getVideoStatus } from '@/lib/heygen';
import { notify } from '@/lib/notify';

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

/* ============================== Video Studio ============================== */

// Agent ticks the likeness-consent box (required before any video).
export async function giveAvatarConsent(formData) {
  const { user } = await requireUser();
  if (!formData.get('consent')) redirect('/profile?error=' + encodeURIComponent('Tick the consent box first.'));
  const admin = createAdminClient();
  const { error } = await admin
    .from('avatar_profiles')
    .upsert({ user_id: user.id, consent_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) redirect('/profile?error=' + encodeURIComponent(error.message));
  revalidatePath('/profile');
  redirect('/profile?ok=' + encodeURIComponent('Consent saved — now record your 2-minute clip and send it to your admin.'));
}

// Admin saves a person's HeyGen avatar/voice IDs (after creating the digital twin).
export async function saveAvatarProfile(formData) {
  await requireCreator();
  const userId = String(formData.get('user_id'));
  const admin = createAdminClient();
  const { error } = await admin.from('avatar_profiles').upsert(
    {
      user_id: userId,
      avatar_id: String(formData.get('avatar_id') || '').trim() || null,
      voice_id: String(formData.get('voice_id') || '').trim() || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );
  if (error) fail('/content/videos', error.message);
  revalidatePath('/content/videos');
  redirect('/content/videos?ok=' + encodeURIComponent('Avatar setup saved.'));
}

// Agent requests a video of an approved script. Costs nothing yet — the render
// only fires when an admin approves.
export async function requestVideo(formData) {
  const { user, profile } = await requireUser();
  const scriptId = String(formData.get('script_id'));
  const projectId = String(formData.get('project_id'));
  const back = `/content/${projectId}`;

  const admin = createAdminClient();
  const { data: script } = await admin
    .from('content_scripts')
    .select('id, body, language, status, project:content_projects(name)')
    .eq('id', scriptId)
    .single();
  if (!script || script.status !== 'approved') fail(back, 'Only approved scripts can be turned into videos.');

  const { data: av } = await admin.from('avatar_profiles').select('*').eq('user_id', user.id).maybeSingle();
  if (!av?.consent_at) fail(back, 'First give likeness consent on your Profile page (🎥 My video avatar).');
  if (!av?.avatar_id || !av?.voice_id) fail(back, 'Your avatar isn’t ready yet — your admin is still setting it up.');

  const { error } = await admin.from('video_requests').insert({
    agent_id: user.id,
    script_id: script.id,
    project_name: script.project?.name || null,
    language: script.language,
    script_body: script.body,
  });
  if (error) fail(back, error.message);

  // Ping management to approve the render (in-app + phone push, no email spam).
  const { data: mgrs } = await admin.from('profiles').select('id').in('role', ['admin', 'director', 'c_suite']);
  for (const m of mgrs || []) {
    if (m.id === user.id) continue;
    await notify({
      userId: m.id,
      type: 'video_request',
      title: `🎥 Video request: ${profile?.full_name || 'An agent'} · ${script.project?.name || 'a project'}`,
      body: `${script.language} script — approve to render.`,
      link: '/content/videos',
      email: false,
    });
  }

  revalidatePath('/content/videos');
  redirect(`${back}?ok=` + encodeURIComponent('Video requested — you’ll get a notification when it’s approved and rendered.'));
}

// Admin approves → the HeyGen render fires (this is the moment credits are spent).
export async function approveVideoRequest(formData) {
  const { user } = await requireCreator();
  const id = String(formData.get('request_id'));
  if (!heygenReady()) fail('/content/videos', 'HEYGEN_API_KEY is not set in Vercel yet — see the setup note on this page.');

  const admin = createAdminClient();
  const { data: req } = await admin.from('video_requests').select('*').eq('id', id).single();
  if (!req || req.status !== 'requested') fail('/content/videos', 'This request is not awaiting approval.');

  const { data: av } = await admin.from('avatar_profiles').select('*').eq('user_id', req.agent_id).maybeSingle();
  if (!av?.avatar_id || !av?.voice_id) fail('/content/videos', 'That agent’s avatar/voice IDs are missing below.');

  let videoId;
  try {
    videoId = await generateAvatarVideo({
      avatarId: av.avatar_id,
      voiceId: av.voice_id,
      text: req.script_body,
      title: `${req.project_name || 'Project'} · ${req.language}`,
    });
  } catch (e) {
    fail('/content/videos', 'HeyGen render failed to start: ' + (e?.message || 'unknown error'));
  }

  await admin
    .from('video_requests')
    .update({ status: 'rendering', heygen_video_id: videoId, approved_by: user.id, approved_at: new Date().toISOString(), error: null })
    .eq('id', id);

  await notify({
    userId: req.agent_id,
    type: 'video_status',
    title: '🎬 Your video is rendering',
    body: `${req.project_name || 'Your project'} (${req.language}) was approved — usually ready in a few minutes.`,
    link: '/content/videos',
    email: false,
  });

  revalidatePath('/content/videos');
  redirect('/content/videos?ok=' + encodeURIComponent('Render started — hit “Check status” in a few minutes.'));
}

export async function rejectVideoRequest(formData) {
  await requireCreator();
  const id = String(formData.get('request_id'));
  const admin = createAdminClient();
  const { data: req } = await admin.from('video_requests').select('agent_id, project_name').eq('id', id).single();
  await admin.from('video_requests').update({ status: 'rejected' }).eq('id', id);
  if (req) {
    await notify({
      userId: req.agent_id,
      type: 'video_status',
      title: 'Video request declined',
      body: `${req.project_name || 'Your request'} wasn’t approved — ask your admin why.`,
      link: '/content/videos',
      email: false,
    });
  }
  revalidatePath('/content/videos');
  redirect('/content/videos?ok=' + encodeURIComponent('Request rejected.'));
}

// Poll HeyGen for the render result and store the download URL when done.
export async function refreshVideoStatus(formData) {
  const { user, profile } = await requireUser();
  const id = String(formData.get('request_id'));
  const admin = createAdminClient();
  const { data: req } = await admin.from('video_requests').select('*').eq('id', id).single();
  if (!req) fail('/content/videos', 'Request not found.');
  if (!canRouteLeads(profile) && req.agent_id !== user.id) fail('/content/videos', 'Not your request.');
  if (!req.heygen_video_id) fail('/content/videos', 'This request hasn’t been rendered yet.');

  let data;
  try {
    data = await getVideoStatus(req.heygen_video_id);
  } catch (e) {
    fail('/content/videos', 'Could not check status: ' + (e?.message || 'unknown error'));
  }

  if (data.status === 'completed' && data.video_url) {
    await admin.from('video_requests').update({ status: 'done', video_url: data.video_url }).eq('id', id);
    await notify({
      userId: req.agent_id,
      type: 'video_status',
      title: '✅ Your video is ready!',
      body: `${req.project_name || 'Your video'} (${req.language}) — download it now (the link expires after ~7 days).`,
      link: '/content/videos',
    });
    redirect('/content/videos?ok=' + encodeURIComponent('Video ready — download it below.'));
  } else if (data.status === 'failed') {
    const msg = data?.error?.message || data?.error || 'render failed';
    await admin.from('video_requests').update({ status: 'failed', error: String(msg) }).eq('id', id);
    redirect('/content/videos?error=' + encodeURIComponent('Render failed: ' + msg));
  }
  redirect('/content/videos?ok=' + encodeURIComponent('Still rendering — check again in a minute.'));
}
