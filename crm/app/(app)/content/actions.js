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

const MAX_TOTAL_BYTES = 20 * 1024 * 1024; // stay under the 32MB API request cap after base64
const OK_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

// Never echo secrets (API keys etc.) back to the browser in error messages.
function redact(msg) {
  return String(msg || 'unknown error')
    .replace(/sk-ant-[\w-]+/g, 'sk-ant-…[hidden]')
    .replace(/sk-[A-Za-z0-9_-]{20,}/g, 'sk-…[hidden]')
    .slice(0, 300);
}

function fail(path, msg) {
  redirect(`${path}?error=` + encodeURIComponent(redact(msg)));
}

async function requireCreator() {
  const ctx = await requireUser();
  if (!canRouteLeads(ctx.profile)) redirect('/content?error=' + encodeURIComponent('Only admin, support or marketing can create content.'));
  return ctx;
}

// Uploaded brochures are deleted right after a successful generation; this
// sweep also removes anything older than 24h (failed/abandoned attempts), so
// the bucket never accumulates files. Upload folders are named "<ms>-<rand>".
async function cleanupStaleUploads(admin) {
  try {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const { data: folders } = await admin.storage.from('brochures').list('', { limit: 100 });
    for (const f of folders || []) {
      const ts = parseInt(String(f.name).split('-')[0], 10);
      if (!Number.isFinite(ts) || ts > cutoff) continue;
      const { data: inner } = await admin.storage.from('brochures').list(f.name, { limit: 100 });
      const paths = (inner || []).map((i) => `${f.name}/${i.name}`);
      if (paths.length) await admin.storage.from('brochures').remove(paths);
    }
  } catch (e) {
    // no-op — cleanup must never block generation
  }
}

const normName = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

// Best-effort: harvest the renders embedded in a brochure PDF by scanning for
// JPEG start/end markers. Most brochures embed photos as JPEGs, so this pulls
// usable renders without any AI cost. Small images (logos/icons) are skipped.
const JPEG_SOI = Buffer.from([0xff, 0xd8, 0xff]);
const JPEG_EOI = Buffer.from([0xff, 0xd9]);
function harvestJpegs(buf, max = 8) {
  const out = [];
  let i = 0;
  while (out.length < max) {
    const start = buf.indexOf(JPEG_SOI, i);
    if (start === -1) break;
    const end = buf.indexOf(JPEG_EOI, start + 3);
    if (end === -1) break;
    const slice = buf.subarray(start, end + 2);
    if (slice.length >= 80 * 1024 && slice.length <= 8 * 1024 * 1024) out.push(slice);
    i = end + 2;
  }
  return out;
}

// Upload image buffers to the public assets bucket + register rows.
// items: [{ buf, contentType, ext }]
async function saveProjectAssets(admin, projectId, userId, items) {
  let saved = 0;
  for (const [idx, it] of items.entries()) {
    const path = `${projectId}/asset-${Date.now()}-${idx}.${it.ext}`;
    const { error: upErr } = await admin.storage
      .from('project-assets')
      .upload(path, it.buf, { contentType: it.contentType, upsert: true });
    if (upErr) continue;
    const { data: pub } = admin.storage.from('project-assets').getPublicUrl(path);
    if (!pub?.publicUrl) continue;
    const { error } = await admin.from('content_assets').insert({
      project_id: projectId, kind: 'image', url: pub.publicUrl, path, created_by: userId,
    });
    if (!error) saved += 1;
  }
  return saved;
}

const extOf = (mediaType) => (mediaType === 'image/jpeg' ? 'jpg' : String(mediaType).split('/')[1] || 'bin');

// Called from the client after files are uploaded straight to Supabase Storage
// (bypassing Vercel's ~4.5MB request limit). Reads the files, extracts facts,
// writes the first script, deletes the uploads. Returns {id} or {error} —
// never redirects, so the form can show inline errors instead of hanging.
// Credit savers: picking an existing project (no files) skips the expensive
// brochure read entirely, and a re-uploaded project merges into the existing
// one instead of creating a duplicate.
// Ping management when an agent adds content that needs review/approval.
async function notifyContentReview(admin, user, profile, projectId, projectName, language) {
  try {
    const { data: mgrs } = await admin.from('profiles').select('id').in('role', ['admin', 'director', 'c_suite']);
    for (const m of mgrs || []) {
      if (m.id === user.id) continue;
      await notify({
        userId: m.id,
        type: 'content_review',
        title: `🎬 ${profile?.full_name || 'An agent'} added a script: ${projectName || 'a project'}`,
        body: `${language} — review, edit and approve it in Content Studio.`,
        link: `/content/${projectId}`,
        email: false,
      });
    }
  } catch (e) {
    // no-op
  }
}

export async function createContentFromUpload(payload) {
  const { user, profile } = await requireUser();
  const isCreator = canRouteLeads(profile);
  if (!contentReady()) return { error: 'ANTHROPIC_API_KEY is not set in Vercel yet — see the setup note on this page.' };

  const { files = [], notes = '', language = 'English', tone = 'Bullish default — short, punchy, direct', duration = 45, projectName = '' } = payload || {};
  const durationSec = parseInt(String(duration), 10) || 45;
  const cleanNotes = String(notes).trim();
  if (!files.length && !cleanNotes && !normName(projectName)) return { error: 'Upload a brochure/renders, paste the project details, or pick an existing project.' };

  const admin = createAdminClient();
  await cleanupStaleUploads(admin);

  // Agents can add projects too (their scripts stay drafts until admin
  // approves) — capped at 3 generations/day so credits stay safe.
  if (!isCreator) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await admin
      .from('content_scripts')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', user.id)
      .gte('created_at', dayAgo);
    if ((count || 0) >= 3) return { error: 'Daily limit reached (3 scripts per day). Ask your admin if you need more today.' };
  }

  // An existing project was picked:
  //  • with files → harvest the renders out of the upload into that project's
  //    gallery, with NO AI read (free).
  //  • without files → regenerate a script from the stored facts (a fraction
  //    of the cost, no brochure re-read).
  if (normName(projectName)) {
    const { data: all } = await admin.from('content_projects').select('id, name, facts');
    const match = (all || []).find((p) => normName(p.name) === normName(projectName));

    if (match && files.length) {
      const items = [];
      for (const f of files) {
        const { data } = await admin.storage.from('brochures').download(f.path);
        if (!data) continue;
        const buf = Buffer.from(await data.arrayBuffer());
        if (f.mediaType === 'application/pdf') {
          for (const jpeg of harvestJpegs(buf)) items.push({ buf: jpeg, contentType: 'image/jpeg', ext: 'jpg' });
        } else {
          items.push({ buf, contentType: f.mediaType, ext: extOf(f.mediaType) });
        }
      }
      const saved = await saveProjectAssets(admin, match.id, user.id, items.slice(0, 10));
      try { await admin.storage.from('brochures').remove(files.map((f) => f.path)); } catch (e) { /* no-op */ }
      revalidatePath(`/content/${match.id}`);
      if (!saved) return { error: 'Couldn’t find usable renders in that file — upload the renders as JPG/PNG images instead.' };
      return { id: match.id, assetsOnly: true, saved };
    }

    if (match) {
      let body;
      try {
        const facts = cleanNotes ? { ...match.facts, extra_notes: cleanNotes } : match.facts;
        body = await writeScriptFromFacts({ facts, language, tone, durationSec });
      } catch (e) {
        return { error: 'Generation failed: ' + redact(e?.message) };
      }
      await admin.from('content_scripts').insert({
        project_id: match.id, language, duration_sec: durationSec, tone, body, created_by: user.id,
      });
      if (!isCreator) await notifyContentReview(admin, user, profile, match.id, match.name, language);
      revalidatePath('/content');
      return { id: match.id };
    }
    if (!files.length && !cleanNotes) return { error: `No existing project called “${projectName}” — upload its brochure or paste its details.` };
  }

  // Pull the uploaded files down from Storage. While we're at it, collect the
  // renders: uploaded images directly, and JPEGs harvested out of PDFs — they
  // become the project's video-background gallery.
  const blobs = [];
  const assetItems = [];
  let total = 0;
  for (const f of files) {
    const mediaType = OK_TYPES.includes(f.mediaType) ? f.mediaType : null;
    if (!mediaType) return { error: `Unsupported file type: ${f.mediaType}. Use PDF, JPG, PNG or WebP.` };
    const { data, error } = await admin.storage.from('brochures').download(f.path);
    if (error) return { error: 'Could not read the uploaded file: ' + error.message };
    const buf = Buffer.from(await data.arrayBuffer());
    total += buf.length;
    if (total > MAX_TOTAL_BYTES) return { error: 'Files are too big — keep the total under 20 MB.' };
    blobs.push({ mediaType, base64: buf.toString('base64') });
    if (mediaType === 'application/pdf') {
      for (const jpeg of harvestJpegs(buf)) assetItems.push({ buf: jpeg, contentType: 'image/jpeg', ext: 'jpg' });
    } else {
      assetItems.push({ buf, contentType: mediaType, ext: extOf(mediaType) });
    }
  }

  let result;
  try {
    result = await extractAndWriteScript({ files: blobs, notes: cleanNotes, language, tone, durationSec });
  } catch (e) {
    if (e?.digest?.startsWith?.('NEXT_REDIRECT')) throw e;
    return { error: 'Generation failed: ' + redact(e?.message) + ' — nothing was saved, try again.' };
  }

  // Best-effort cleanup of the uploaded originals (facts + renders are kept).
  try {
    if (files.length) await admin.storage.from('brochures').remove(files.map((f) => f.path));
  } catch (e) {
    // no-op
  }

  const facts = {
    project_name: result.project_name,
    developer: result.developer,
    location: result.location,
    handover: result.handover,
    payment_plan: result.payment_plan,
    starting_price: result.starting_price,
    unit_types: result.unit_types,
    usps: result.usps || [],
    notes: cleanNotes || undefined,
  };

  // Duplicate guard: if this project already exists (same name), attach the
  // new script to it and refresh its facts instead of creating a copy.
  if (normName(result.project_name)) {
    const { data: all } = await admin.from('content_projects').select('id, name, facts');
    const existing = (all || []).find((p) => normName(p.name) === normName(result.project_name));
    if (existing) {
      const mergedFacts = { ...facts };
      for (const [k, v] of Object.entries(existing.facts || {})) {
        const cur = mergedFacts[k];
        if (cur == null || cur === '' || (Array.isArray(cur) && !cur.length)) mergedFacts[k] = v;
      }
      await admin.from('content_projects').update({ facts: mergedFacts }).eq('id', existing.id);
      await admin.from('content_scripts').insert({
        project_id: existing.id, language, duration_sec: durationSec, tone, body: result.script_body, created_by: user.id,
      });
      if (assetItems.length) await saveProjectAssets(admin, existing.id, user.id, assetItems.slice(0, 10));
      if (!isCreator) await notifyContentReview(admin, user, profile, existing.id, existing.name, language);
      revalidatePath('/content');
      return { id: existing.id };
    }
  }

  const { data: project, error } = await admin
    .from('content_projects')
    .insert({
      name: result.project_name || 'Untitled project',
      developer: result.developer || null,
      area: result.location || null,
      facts,
      created_by: user.id,
    })
    .select('id')
    .single();
  if (error) return { error: error.message };

  await admin.from('content_scripts').insert({
    project_id: project.id,
    language,
    duration_sec: durationSec,
    tone,
    body: result.script_body,
    created_by: user.id,
  });

  if (assetItems.length) await saveProjectAssets(admin, project.id, user.id, assetItems.slice(0, 10));
  if (!isCreator) await notifyContentReview(admin, user, profile, project.id, facts.project_name, language);

  revalidatePath('/content');
  return { id: project.id };
}

// Register an asset (render image / animated b-roll clip) uploaded from the
// browser straight to the public project-assets bucket.
export async function registerProjectAsset(payload) {
  const { user, profile } = await requireUser();
  if (!canRouteLeads(profile)) return { error: 'Only admin, support or marketing can add assets.' };
  const { projectId, path, kind } = payload || {};
  if (!projectId || !path) return { error: 'Missing file info.' };
  const admin = createAdminClient();
  const { data: pub } = admin.storage.from('project-assets').getPublicUrl(path);
  if (!pub?.publicUrl) return { error: 'Could not resolve the file URL.' };
  const { error } = await admin.from('content_assets').insert({
    project_id: projectId,
    kind: kind === 'video' ? 'video' : 'image',
    url: pub.publicUrl,
    path,
    created_by: user.id,
  });
  if (error) return { error: error.message };
  revalidatePath(`/content/${projectId}`);
  return { ok: true };
}

export async function deleteProjectAsset(formData) {
  await requireCreator();
  const id = String(formData.get('asset_id'));
  const projectId = String(formData.get('project_id'));
  const admin = createAdminClient();
  const { data: asset } = await admin.from('content_assets').select('path').eq('id', id).single();
  if (asset?.path) {
    await admin.storage.from('project-assets').remove([asset.path]).then((r) => r, () => null);
  }
  await admin.from('content_assets').delete().eq('id', id);
  revalidatePath(`/content/${projectId}`);
  redirect(`/content/${projectId}?ok=` + encodeURIComponent('Asset removed.'));
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
  const back = String(formData.get('back') || '/profile');
  if (!formData.get('consent')) redirect(`${back}?error=` + encodeURIComponent('Tick the consent box first.'));
  const admin = createAdminClient();
  const { error } = await admin
    .from('avatar_profiles')
    .upsert({ user_id: user.id, consent_at: new Date().toISOString(), updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) redirect(`${back}?error=` + encodeURIComponent(error.message));
  revalidatePath('/profile');
  revalidatePath('/content/avatar');
  redirect(`${back}?ok=` + encodeURIComponent('Consent saved — now set up your shot and record the 2-minute read below.'));
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

  // Project renders / animated b-roll become scene backgrounds behind the agent.
  let backgrounds = [];
  if (req.script_id) {
    const { data: script } = await admin.from('content_scripts').select('project_id').eq('id', req.script_id).maybeSingle();
    if (script?.project_id) {
      const { data: assets } = await admin
        .from('content_assets')
        .select('kind, url')
        .eq('project_id', script.project_id)
        .order('created_at')
        .then((r) => r, () => ({ data: [] }));
      // Videos (living renders) first — they make the best scenes.
      backgrounds = [...(assets || [])].sort((a, b) => (a.kind === 'video' ? -1 : 1) - (b.kind === 'video' ? -1 : 1));
    }
  }

  let videoId;
  try {
    videoId = await generateAvatarVideo({
      avatarId: av.avatar_id,
      voiceId: av.voice_id,
      text: req.script_body,
      title: `${req.project_name || 'Project'} · ${req.language}`,
      backgrounds,
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
