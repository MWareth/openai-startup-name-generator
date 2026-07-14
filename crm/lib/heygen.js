// Video Studio — HeyGen API helper (avatar videos from approved scripts).
// Needs HEYGEN_API_KEY in the environment (Vercel → Settings → Env Vars).
// Videos render vertically (720×1280) for Reels/TikTok/Shorts.

const BASE = 'https://api.heygen.com';

export function heygenReady() {
  return !!process.env.HEYGEN_API_KEY;
}

async function call(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: {
      'X-Api-Key': process.env.HEYGEN_API_KEY,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    cache: 'no-store',
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = json?.error?.message || json?.error || json?.message || `HeyGen error ${res.status}`;
    throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
  }
  return json;
}

// Split a script into n roughly-equal chunks on sentence boundaries, so each
// scene (with its own background render) gets a natural piece of the speech.
function splitScript(text, parts) {
  const sentences = String(text).split(/(?<=[.!?؟。])\s+/).filter(Boolean);
  if (parts <= 1 || sentences.length <= 1) return [String(text)];
  const per = Math.ceil(sentences.length / Math.min(parts, sentences.length));
  const chunks = [];
  for (let i = 0; i < sentences.length; i += per) chunks.push(sentences.slice(i, i + per).join(' '));
  return chunks;
}

// Fire a render: the agent's avatar speaks the script in their cloned voice.
// backgrounds: [{kind:'image'|'video', url}] — project renders / animated
// b-roll clips; the video cuts between them scene by scene while the agent
// keeps talking. Returns the HeyGen video id (poll getVideoStatus).
export async function generateAvatarVideo({ avatarId, voiceId, text, title, backgrounds = [] }) {
  const bgs = (backgrounds || []).slice(0, 4);
  const chunks = bgs.length ? splitScript(text, bgs.length) : [String(text)];

  const video_inputs = chunks.map((chunk, i) => {
    const scene = {
      character: { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal', matting: true },
      voice: { type: 'text', input_text: chunk, voice_id: voiceId },
    };
    const bg = bgs.length ? bgs[i % bgs.length] : null;
    if (bg) {
      scene.background =
        bg.kind === 'video'
          ? { type: 'video', url: bg.url, play_style: 'loop' }
          : { type: 'image', url: bg.url };
    }
    return scene;
  });

  const json = await call('/v2/video/generate', {
    method: 'POST',
    body: JSON.stringify({
      title: title || 'Bullish CRM video',
      video_inputs,
      dimension: { width: 720, height: 1280 },
    }),
  });
  const videoId = json?.data?.video_id;
  if (!videoId) throw new Error('HeyGen did not return a video id.');
  return videoId;
}

// Poll a render. Returns { status: 'processing'|'completed'|'failed'|..., video_url, error }.
export async function getVideoStatus(videoId) {
  const json = await call(`/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`);
  return json?.data || {};
}
