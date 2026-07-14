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

// Fire a render: the agent's avatar speaks the script in their cloned voice.
// Returns the HeyGen video id (poll getVideoStatus for the result).
export async function generateAvatarVideo({ avatarId, voiceId, text, title }) {
  const json = await call('/v2/video/generate', {
    method: 'POST',
    body: JSON.stringify({
      title: title || 'Bullish CRM video',
      video_inputs: [
        {
          character: { type: 'avatar', avatar_id: avatarId, avatar_style: 'normal' },
          voice: { type: 'text', input_text: text, voice_id: voiceId },
        },
      ],
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
