import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser, canRouteLeads } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { SCRIPT_LANGUAGES, SCRIPT_TONES, SCRIPT_DURATIONS } from '@/lib/content';
import SubmitButton from '@/components/SubmitButton';
import CopyButton from '@/components/CopyButton';
import AssetUploader from '@/components/AssetUploader';
import { generateScript, updateScript, approveScript, deleteScript, deleteContentProject, requestVideo, deleteProjectAsset } from '../actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const FACT_LABELS = {
  developer: 'Developer',
  location: 'Area',
  handover: 'Handover',
  payment_plan: 'Payment plan',
  starting_price: 'Starting price',
  unit_types: 'Unit types',
};

export default async function ContentProjectPage({ params, searchParams }) {
  const { user, profile, supabase } = await requireUser();
  const isCreator = canRouteLeads(profile);
  const ok = searchParams?.ok;
  const error = searchParams?.error;

  const { data: project } = await supabase
    .from('content_projects')
    .select(
      '*, creator:profiles!content_projects_created_by_fkey(full_name), content_scripts(*, creator:profiles!content_scripts_created_by_fkey(full_name), approver:profiles!content_scripts_approved_by_fkey(full_name))'
    )
    .eq('id', params.id)
    .single();
  if (!project) notFound();

  // Renders & b-roll clips attached to this project (video backgrounds).
  const { data: assets } = await supabase
    .from('content_assets')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at')
    .then((r) => r, () => ({ data: [] }));

  // Video Studio: can this user request a video? (consent + admin-set avatar)
  const { data: myAvatar } = await supabase
    .from('avatar_profiles')
    .select('consent_at, avatar_id, voice_id')
    .eq('user_id', user.id)
    .maybeSingle()
    .then((r) => r, () => ({ data: null }));
  const avatarReady = !!(myAvatar?.consent_at && myAvatar?.avatar_id && myAvatar?.voice_id);

  const allScripts = (project.content_scripts || []).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  // Agents see approved scripts plus their own drafts (awaiting approval).
  const scripts = isCreator
    ? allScripts
    : allScripts.filter((s) => s.status === 'approved' || s.created_by === user.id);
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
        <p className="muted small">
          {project.developer || '—'}{project.area ? ` · ${project.area}` : ''} · added {formatDate(project.created_at)}
          {project.creator?.full_name ? <> by <strong>{project.creator.full_name}</strong></> : null}
        </p>
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

      {/* Renders & b-roll — used as scene backgrounds behind the agent */}
      <div className="card">
        <div className="spread">
          <h3 style={{ marginTop: 0 }}>🖼️ Renders & b-roll ({(assets || []).length})</h3>
        </div>
        <p className="small muted" style={{ marginTop: 0 }}>
          These appear <strong>behind the agent</strong> in generated videos — the video cuts between them scene by scene.
          Images = static renders. For the cinematic effect, animate a render in Kling/Higgsfield (building rising, camera
          descending…) and upload the MP4 here — moving clips are used first.
        </p>
        {(assets || []).length ? (
          <div className="row" style={{ gap: 10, flexWrap: 'wrap' }}>
            {(assets || []).map((a) => (
              <div key={a.id} style={{ width: 130 }}>
                {a.kind === 'video' ? (
                  <video src={a.url} muted playsInline style={{ width: 130, height: 90, objectFit: 'cover', borderRadius: 8, background: '#000' }} />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.url} alt="render" style={{ width: 130, height: 90, objectFit: 'cover', borderRadius: 8 }} />
                )}
                <div className="spread" style={{ marginTop: 2 }}>
                  <span className="small muted">{a.kind === 'video' ? '🎞️ clip' : '🖼️ render'}</span>
                  {isCreator ? (
                    <form action={deleteProjectAsset} style={{ margin: 0 }}>
                      <input type="hidden" name="asset_id" value={a.id} />
                      <input type="hidden" name="project_id" value={project.id} />
                      <button className="btn ghost small" type="submit" style={{ padding: '0 6px' }}>✕</button>
                    </form>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="small muted">No renders yet{isCreator ? ' — add some below so videos have the project behind the agent.' : '.'}</p>
        )}
        {isCreator ? (
          <div style={{ marginTop: 10 }}>
            <AssetUploader projectId={project.id} />
          </div>
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
              <span className="small muted">
                ✍️ {s.creator?.full_name || 'Unknown'} · {formatDate(s.created_at)}
                {s.status === 'approved' && s.approver?.full_name ? <> · ✅ {s.approver.full_name}</> : null}
              </span>
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
                {s.status === 'approved' ? (
                  <CopyButton text={s.body} />
                ) : (
                  <p className="small muted" style={{ margin: 0 }}>⏳ Waiting for admin approval — you’ll be able to use it once it’s approved.</p>
                )}
              </>
            )}

            {/* Video Studio: turn an approved script into an avatar video */}
            {s.status === 'approved' ? (
              avatarReady ? (
                <form action={requestVideo} style={{ marginTop: 10 }}>
                  <input type="hidden" name="script_id" value={s.id} />
                  <input type="hidden" name="project_id" value={project.id} />
                  <button className="btn small" type="submit" style={{ background: '#7c3aed' }}>
                    🎥 Make my video with this script
                  </button>
                </form>
              ) : (
                <p className="small muted" style={{ marginTop: 10 }}>
                  🎥 Want this as a video of you? <Link href="/content/avatar">Set up your avatar first — takes one 2-minute recording</Link>.
                </p>
              )
            ) : null}

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
