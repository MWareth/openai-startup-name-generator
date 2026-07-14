import Link from 'next/link';
import { requireUser, canRouteLeads } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { contentReady, SCRIPT_LANGUAGES, SCRIPT_TONES, SCRIPT_DURATIONS } from '@/lib/content';
import SubmitButton from '@/components/SubmitButton';
import { createContentProject } from './actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // brochure reads can take a while

export default async function ContentStudioPage({ searchParams }) {
  const { profile, supabase } = await requireUser();
  const isCreator = canRouteLeads(profile); // admin + support + marketing
  const ok = searchParams?.ok;
  const error = searchParams?.error;
  const ready = contentReady();

  const { data: projects } = await supabase
    .from('content_projects')
    .select('id, name, developer, area, created_at, content_scripts(id, language, status)')
    .order('created_at', { ascending: false });

  // Agents only care about projects that have at least one approved script.
  const visible = isCreator
    ? projects || []
    : (projects || []).filter((p) => (p.content_scripts || []).some((s) => s.status === 'approved'));

  return (
    <div className="stack">
      <div>
        <h1>🎬 Content Studio</h1>
        <p className="muted">
          Upload a project brochure or renders — get a ready-to-film agent script, in any language.
          {isCreator ? ' Scripts start as drafts; approve them to publish to the agents.' : ' These scripts are approved by management — pick one and film.'}
        </p>
      </div>
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      {isCreator && !ready ? (
        <div className="card" style={{ borderColor: 'var(--gold)' }}>
          <h3 style={{ marginTop: 0 }}>One-time setup needed</h3>
          <p className="small">
            The script writer needs an Anthropic API key. Get one at <strong>console.anthropic.com</strong> → API Keys,
            then in <strong>Vercel → Settings → Environment Variables</strong> add <code>ANTHROPIC_API_KEY</code> and redeploy.
            Each brochure costs roughly AED 1–2 to process; extra scripts a few fils each.
          </p>
        </div>
      ) : null}

      {isCreator ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>New project script</h3>
          <form action={createContentProject} className="stack" style={{ gap: 10 }}>
            <div className="field">
              <label>Brochure (PDF) and/or renders (JPG/PNG) — up to 15 MB total</label>
              <input name="files" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple />
            </div>
            <div className="field">
              <label>Extra details (optional — payment plan, offer, prices not in the brochure)</label>
              <textarea name="notes" rows={3} placeholder="e.g. Launch offer: 1% monthly, 10% down. Starting AED 1.2M. Handover Q4 2027." />
            </div>
            <div className="form-grid">
              <div className="field">
                <label>Script language</label>
                <select name="language" defaultValue="English">
                  {SCRIPT_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="field">
                <label>Length</label>
                <select name="duration" defaultValue="45">
                  {SCRIPT_DURATIONS.map((d) => <option key={d} value={d}>{d} seconds</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Tone</label>
              <select name="tone">
                {SCRIPT_TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <SubmitButton className="btn" pendingLabel="Reading brochure & writing… (up to a minute)">✨ Generate script</SubmitButton>
            <p className="small muted" style={{ margin: 0 }}>
              The script only uses facts found in what you upload — it never invents prices or dates.
            </p>
          </form>
        </div>
      ) : null}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Project</th><th>Developer</th><th>Area</th><th>Scripts</th><th>Added</th></tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const scripts = p.content_scripts || [];
              const approved = scripts.filter((s) => s.status === 'approved').length;
              const langs = [...new Set(scripts.map((s) => s.language))].join(', ');
              return (
                <tr key={p.id}>
                  <td><Link href={`/content/${p.id}`}><strong>{p.name}</strong></Link></td>
                  <td className="small muted">{p.developer || '—'}</td>
                  <td className="small muted">{p.area || '—'}</td>
                  <td className="small">
                    {approved}/{scripts.length} approved{langs ? <span className="muted"> · {langs}</span> : null}
                  </td>
                  <td className="small muted">{formatDate(p.created_at)}</td>
                </tr>
              );
            })}
            {visible.length === 0 ? (
              <tr><td colSpan={5} className="muted" style={{ padding: 16 }}>
                {isCreator ? 'No projects yet — upload your first brochure above.' : 'No approved scripts yet — check back soon.'}
              </td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
