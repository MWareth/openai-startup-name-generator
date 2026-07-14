'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createContentFromUpload } from '@/app/(app)/content/actions';

// Content Studio upload form. Files go straight from the browser to Supabase
// Storage (no Vercel 4.5MB request limit), then the server action reads them,
// generates the script, and cleans up. Shows live status and inline errors —
// it can never silently hang.

const LANGS = ['English', 'Arabic', 'Russian', 'Hindi', 'Urdu', 'Chinese', 'Korean', 'Spanish'];
const TONES = [
  'Bullish default — short, punchy, direct',
  'Luxury — calm, premium, understated',
  'Investor — numbers-first, ROI-focused',
  'Energetic — high excitement, launch hype',
];
const OK_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
const MAX_TOTAL = 20 * 1024 * 1024; // keep under the AI request cap

export default function BrochureForm({ existingProjects = [] }) {
  const router = useRouter();
  const [status, setStatus] = useState(null); // null | 'uploading' | 'writing'
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    if (status) return;
    setError(null);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const notes = String(fd.get('notes') || '').trim();
    const language = String(fd.get('language') || 'English');
    const tone = String(fd.get('tone') || TONES[0]);
    const duration = parseInt(String(fd.get('duration') || '45'), 10) || 45;
    const projectName = String(fd.get('project') || '').trim();
    const files = Array.from(form.querySelector('input[type=file]')?.files || []);

    if (!files.length && !notes && !projectName) {
      setError('Upload a brochure/renders, paste the project details, or pick an existing project.');
      return;
    }
    let total = 0;
    for (const f of files) {
      total += f.size;
      if (!OK_TYPES.includes(f.type)) return setError(`Unsupported file type: ${f.name}. Use PDF, JPG, PNG or WebP.`);
    }
    if (total > MAX_TOTAL) return setError('Files are too big — keep the total under 20 MB (use the main brochure, not the full media kit).');

    try {
      // 1) Upload straight to Supabase Storage from the phone/browser.
      const uploaded = [];
      if (files.length) {
        setStatus('uploading');
        const supabase = createClient();
        for (const f of files) {
          const safe = f.name.replace(/[^\w.\-]/g, '_');
          const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}/${safe}`;
          const { error: upErr } = await supabase.storage.from('brochures').upload(path, f, { contentType: f.type });
          if (upErr) throw new Error('Upload failed: ' + upErr.message + (upErr.message?.includes('bucket') ? ' — run migration 0031 in Supabase.' : ''));
          uploaded.push({ path, mediaType: f.type });
        }
      }

      // 2) Server reads the files and writes the script.
      setStatus('writing');
      const res = await createContentFromUpload({ files: uploaded, notes, language, tone, duration, projectName });
      if (res?.error) {
        setError(res.error);
        setStatus(null);
        return;
      }
      router.push(
        `/content/${res.id}?ok=` +
          encodeURIComponent(
            res.assetsOnly
              ? `${res.saved} render${res.saved === 1 ? '' : 's'} pulled from the brochure into the gallery — no AI credits used.`
              : 'Script generated — review, edit and approve it below.'
          )
      );
    } catch (err) {
      setError(err?.message || 'Something went wrong — try again.');
      setStatus(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 10 }}>
      {existingProjects.length ? (
        <div className="field">
          <label>Existing project? Pick it to reuse its saved facts — no brochure re-read, almost free</label>
          <input name="project" list="existing-projects" placeholder="Leave empty for a new project" disabled={!!status} autoComplete="off" />
          <datalist id="existing-projects">
            {existingProjects.map((p) => <option key={p.id} value={p.name} />)}
          </datalist>
        </div>
      ) : null}
      <div className="field">
        <label>Brochure (PDF) and/or renders (JPG/PNG) — up to 20 MB total</label>
        <input type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple disabled={!!status} />
      </div>
      <div className="field">
        <label>Extra details (optional — payment plan, offer, prices not in the brochure)</label>
        <textarea name="notes" rows={3} placeholder="e.g. Launch offer: 1% monthly, 10% down. Starting AED 1.2M. Handover Q4 2027." disabled={!!status} />
      </div>
      <div className="form-grid">
        <div className="field">
          <label>Script language</label>
          <select name="language" defaultValue="English" disabled={!!status}>
            {LANGS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Length</label>
          <select name="duration" defaultValue="45" disabled={!!status}>
            {[30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} seconds</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>Tone</label>
        <select name="tone" disabled={!!status}>
          {TONES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      {error ? <div className="alert error">{error}</div> : null}
      <button className="btn" type="submit" disabled={!!status}>
        {status === 'uploading' ? '⬆️ Uploading files…' : status === 'writing' ? '✍️ Reading & writing… (1–2 minutes, keep this open)' : '✨ Generate script'}
      </button>
      <p className="small muted" style={{ margin: 0 }}>
        The script only uses facts found in what you upload — it never invents prices or dates.
      </p>
    </form>
  );
}
