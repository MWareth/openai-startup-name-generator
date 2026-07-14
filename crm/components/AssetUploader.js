'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { registerProjectAsset } from '@/app/(app)/content/actions';

// Uploads project renders (images) and animated b-roll clips (videos) straight
// to the public project-assets bucket, then registers them on the project.
const OK = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image',
  'video/mp4': 'video', 'video/quicktime': 'video', 'video/webm': 'video',
};
const MAX_EACH = 60 * 1024 * 1024; // generous for short mp4 clips

export default function AssetUploader({ projectId }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  async function onChange(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length || busy) return;
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      for (const f of files) {
        const kind = OK[f.type];
        if (!kind) throw new Error(`Unsupported type: ${f.name}. Use JPG/PNG/WebP images or MP4/MOV clips.`);
        if (f.size > MAX_EACH) throw new Error(`${f.name} is too big — keep each file under 60 MB.`);
        const safe = f.name.replace(/[^\w.\-]/g, '_');
        const path = `${projectId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safe}`;
        const { error: upErr } = await supabase.storage.from('project-assets').upload(path, f, { contentType: f.type });
        if (upErr) throw new Error('Upload failed: ' + upErr.message + (upErr.message?.includes('bucket') ? ' — run migration 0032 in Supabase.' : ''));
        const res = await registerProjectAsset({ projectId, path, kind });
        if (res?.error) throw new Error(res.error);
      }
      router.refresh();
    } catch (err) {
      setError(err?.message || 'Upload failed — try again.');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  return (
    <div className="stack" style={{ gap: 6 }}>
      <input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" multiple onChange={onChange} disabled={busy} />
      {busy ? <p className="small muted" style={{ margin: 0 }}>⬆️ Uploading…</p> : null}
      {error ? <div className="alert error">{error}</div> : null}
    </div>
  );
}
