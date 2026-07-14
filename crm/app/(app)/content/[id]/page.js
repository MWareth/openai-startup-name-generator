import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser, canRouteLeads } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { SCRIPT_LANGUAGES, SCRIPT_TONES, SCRIPT_DURATIONS } from '@/lib/content';
import SubmitButton from '@/components/SubmitButton';
import CopyButton from '@/components/CopyButton';
import { generateScript, updateScript, approveScript, deleteScript, deleteContentProject } from '../actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const FACT_LABELS = {
  developer: 'Developer',
  location: 'Area',
  handover: 'Handover',
  payment_plan: 'Payment plan',
  starting_price: 'Starting price',
  unit_types: 'Unit types',
};

export default async function ContentProjectPage({ params, searchParams }) {
  const { profile, supabase } = await requireUser();
  const isCreator = canRouteLeads(profile);
  const ok = searchParams?.ok;
  const error = searchParams?.error;

  const { data: project } = await supabase
    .from('content_projects')
    .select('*, content_scripts(*)')
    .eq('id', params.id)
    .single();
  if (!project) notFound();

  const allScripts = (project.content_scripts || []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  const scripts = isCreator ? allScripts : allScripts.filter((s) => s.status === 'approved');
  const facts = project.facts || {};
  const usps = Array.isArray(facts.usps) ? facts.usps : [];

  return (
    <div className="stack">
      <div>
        <Link className="small muted" href="/content">← Content Studio</Link>
        <div className="spread">
          <h1>🎬 {project.name}</h1>
          {isCreator ? (
            <form action={deleteContentProject}>
              <input type="hidden" name="project_id" value={project.id} />
              <button className="btn ghost small" type="submit">Delete project</button>
            </form>
          ) : null}
        </div>
        <p className="muted small">{project.developer || '—'}{project.area ? ` · ${project.area}` : ''} · added {formatDate(project.created_at)}</p>
      </div>
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      {/* Extracted facts — what every script is allowed to say */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>📌 Project facts (from the brochure)</h3>
        <div className="row" style={{ gap: 18, flexWrap: 'wrap' }}>
          {Object.entries(FACT_LABELS).map(([key, label]) =>
            facts[key] ? (
              <div key={key}>
                <div className="small muted">{label}</div>
                <div style={{ fontWeight: 600 }}>{facts[key]}</div>
              </div>
            ) : null
          )}
        </div>
        {usps.length ? (
          <ul className="small" style={{ margin: '10px 0 0 18px' }}>
            {usps.map((u, i) => <li key={i}>{u}</li>)}
          </ul>
        ) : null}
      </div>

      {/* Generate another script from the stored facts */}
      {isCreator ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>➕ Another script (new language / tone / length)</h3>
          <form action={generateScript} className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <input type="hidden" name="project_id" value={project.id} />
            <div className="field" style={{ margin: 0 }}>
              <label className="small muted">Language</label>
              <select name="language" defaultValue="English">
                {SCRIPT_LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="field" style={{ margin: 0 }}>
              <label className="small muted">Length</label>
              <select name="duration" defaultValue="45">
                {SCRIPT_DURATIONS.map((d) => <option key={d} value={d}>{d}s</option>)}
              </select>
            </div>
            <div className="field" style={{ margin: 0, minWidth: 220 }}>
              <label className="small muted">Tone</label>
              <select name="tone">
                {SCRIPT_TONES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <SubmitButton className="btn secondary" pendingLabel="Writing…">Generate</SubmitButton>
          </form>
        </div>
      ) : null}

      {/* Scripts */}
      <div className="stack" style={{ gap: 12 }}>
        {scripts.map((s) => (
          <div key={s.id} className="card" style={s.status === 'approved' ? { borderColor: '#16a34a' } : undefined}>
            <div className="spread" style={{ marginBottom: 8 }}>
              <div>
                <strong>{s.language}</strong> · {s.duration_sec}s
                {s.tone ? <span className="small muted"> · {String(s.tone).split('—')[0].trim()}</span> : null}
                {s.status === 'approved'
                  ? <span className="badge" style={{ background: '#16a34a', color: '#fff', marginLeft: 8 }}>Approved</span>
                  : <span className="badge role" style={{ marginLeft: 8 }}>Draft</span>}
              </div>
              <span className="small muted">{formatDate(s.created_at)}</span>
            </div>

            {isCreator ? (
              <form action={updateScript} className="stack" style={{ gap: 8 }}>
                <input type="hidden" name="script_id" value={s.id} />
                <input type="hidden" name="project_id" value={project.id} />
                <textarea name="body" defaultValue={s.body} rows={Math.min(14, Math.max(6, Math.ceil(s.body.length / 70)))} style={{ width: '100%', lineHeight: 1.5 }} />
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn secondary small" type="submit">💾 Save edits</button>
                  <CopyButton text={s.body} />
                </div>
              </form>
            ) : (
              <>
                <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6, margin: '0 0 10px' }}>{s.body}</p>
                <CopyButton text={s.body} />
              </>
            )}

            {isCreator ? (
              <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {s.status !== 'approved' ? (
                  <form action={approveScript}>
                    <input type="hidden" name="script_id" value={s.id} />
                    <input type="hidden" name="project_id" value={project.id} />
                    <button className="btn small" type="submit">✅ Approve — publish to agents</button>
                  </form>
                ) : null}
                <form action={deleteScript}>
                  <input type="hidden" name="script_id" value={s.id} />
                  <input type="hidden" name="project_id" value={project.id} />
                  <button className="btn ghost small" type="submit">Delete</button>
                </form>
              </div>
            ) : null}
          </div>
        ))}
        {scripts.length === 0 ? (
          <p className="muted">{isCreator ? 'No scripts yet — generate one above.' : 'No approved scripts for this project yet.'}</p>
        ) : null}
      </div>
    </div>
  );
}
