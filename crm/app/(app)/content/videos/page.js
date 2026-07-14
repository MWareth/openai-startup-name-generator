import Link from 'next/link';
import { requireUser, canRouteLeads } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { heygenReady } from '@/lib/heygen';
import { approveVideoRequest, rejectVideoRequest, refreshVideoStatus, saveAvatarProfile } from '../actions';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STATUS_BADGE = {
  requested: { label: '⏳ Awaiting approval', style: { background: 'var(--panel-2)' } },
  rendering: { label: '🎬 Rendering…', style: { background: '#f59e0b', color: '#1a1407' } },
  done: { label: '✅ Ready', style: { background: '#16a34a', color: '#fff' } },
  failed: { label: '❌ Failed', style: { background: '#dc2626', color: '#fff' } },
  rejected: { label: '🚫 Rejected', style: { background: 'var(--panel-2)' } },
};

function stamp(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default async function VideoStudioPage({ searchParams }) {
  const { user, profile } = await requireUser();
  const isCreator = canRouteLeads(profile);
  const ok = searchParams?.ok;
  const error = searchParams?.error;
  const admin = createAdminClient();

  // Requests: admins see all, agents see their own (also enforced by RLS).
  let reqQuery = admin
    .from('video_requests')
    .select('*, agent:profiles!video_requests_agent_id_fkey(full_name)')
    .order('requested_at', { ascending: false })
    .limit(100);
  if (!isCreator) reqQuery = reqQuery.eq('agent_id', user.id);
  const { data: requests } = await reqQuery.then((r) => r, () => ({ data: [] }));

  // Avatar setup table (admins only).
  let people = [];
  if (isCreator) {
    const [{ data: profiles }, avRes] = await Promise.all([
      admin.from('profiles').select('id, full_name, role').in('role', ['agent', 'admin']).order('full_name'),
      admin.from('avatar_profiles').select('*').then((r) => r, () => ({ data: [] })),
    ]);
    const avByUser = new Map(((avRes && avRes.data) || []).map((a) => [a.user_id, a]));
    people = (profiles || []).map((p) => ({ ...p, av: avByUser.get(p.id) || null }));
  }

  return (
    <div className="stack">
      <div>
        <Link className="small muted" href="/content">← Content Studio</Link>
        <h1>🎥 Videos</h1>
        <p className="muted">
          {isCreator
            ? 'Approve agent video requests (a render only costs credits once you approve), and manage each person’s avatar setup.'
            : 'Your requested videos. When one is ready, download it — links expire after about 7 days.'}
        </p>
      </div>
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      {isCreator && !heygenReady() ? (
        <div className="card" style={{ borderColor: 'var(--gold)' }}>
          <h3 style={{ marginTop: 0 }}>One-time setup needed</h3>
          <p className="small">
            Video rendering needs a HeyGen API key. Create an account at <strong>heygen.com</strong> → API (pay-as-you-go,
            from $5), then in <strong>Vercel → Settings → Environment Variables</strong> add <code>HEYGEN_API_KEY</code> and
            redeploy. A 45-second agent video costs roughly AED 3–11. Requests queue up fine meanwhile — they just can’t render yet.
          </p>
        </div>
      ) : null}

      {/* Requests */}
      <div className="stack" style={{ gap: 10 }}>
        <h3 style={{ margin: 0 }}>Requests</h3>
        {(requests || []).map((r) => {
          const badge = STATUS_BADGE[r.status] || STATUS_BADGE.requested;
          return (
            <div key={r.id} className="card">
              <div className="spread" style={{ flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <strong>{r.project_name || 'Project'}</strong> · {r.language}
                  {isCreator ? <span className="small muted"> · {r.agent?.full_name || '—'}</span> : null}
                  <span className="badge" style={{ marginLeft: 8, ...badge.style }}>{badge.label}</span>
                  <div className="small muted">{stamp(r.requested_at)}{r.error ? ` · ${r.error}` : ''}</div>
                </div>
                <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                  {r.status === 'done' && r.video_url ? (
                    <a className="btn small" href={r.video_url} target="_blank" rel="noopener noreferrer">⬇️ Download video</a>
                  ) : null}
                  {r.status === 'rendering' ? (
                    <form action={refreshVideoStatus}>
                      <input type="hidden" name="request_id" value={r.id} />
                      <button className="btn secondary small" type="submit">🔄 Check status</button>
                    </form>
                  ) : null}
                  {isCreator && r.status === 'requested' ? (
                    <>
                      <form action={approveVideoRequest}>
                        <input type="hidden" name="request_id" value={r.id} />
                        <button className="btn small" type="submit">✅ Approve & render</button>
                      </form>
                      <form action={rejectVideoRequest}>
                        <input type="hidden" name="request_id" value={r.id} />
                        <button className="btn ghost small" type="submit">Reject</button>
                      </form>
                    </>
                  ) : null}
                </div>
              </div>
              <details style={{ marginTop: 8 }}>
                <summary className="small muted">Script that will be spoken</summary>
                <p className="small" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{r.script_body}</p>
              </details>
            </div>
          );
        })}
        {(requests || []).length === 0 ? (
          <p className="muted small">
            No video requests yet.{' '}
            {isCreator ? 'Agents request videos from approved scripts in Content Studio.' : (
              <>Pick an approved script in <Link href="/content">Content Studio</Link> and tap “Make my video”.</>
            )}
          </p>
        ) : null}
      </div>

      {/* Avatar setup (admin) */}
      {isCreator ? (
        <details className="card panel">
          <summary><h2 style={{ display: 'inline' }}>👤 Avatar setup per person</h2></summary>
          <div className="panel-body">
            <p className="small muted" style={{ marginTop: 0 }}>
              Flow: the person ticks consent on their Profile → records a 2-minute clip (good light, reads a script
              naturally) and sends it to you → you create their <strong>digital twin avatar + voice clone</strong> in the
              HeyGen dashboard from that clip → paste the two IDs here. After that they can request videos forever.
            </p>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead><tr><th>Person</th><th>Consent</th><th>HeyGen avatar ID</th><th>HeyGen voice ID</th><th></th></tr></thead>
                <tbody>
                  {people.map((p) => (
                    <tr key={p.id}>
                      <td>{p.full_name}</td>
                      <td className="small">{p.av?.consent_at ? '✅' : <span className="muted">not yet</span>}</td>
                      <td colSpan={3} style={{ padding: '6px 8px' }}>
                        <form action={saveAvatarProfile} className="row" style={{ gap: 8, margin: 0, flexWrap: 'wrap' }}>
                          <input type="hidden" name="user_id" value={p.id} />
                          <input name="avatar_id" defaultValue={p.av?.avatar_id || ''} placeholder="avatar_id" style={{ flex: '1 1 180px' }} />
                          <input name="voice_id" defaultValue={p.av?.voice_id || ''} placeholder="voice_id" style={{ flex: '1 1 180px' }} />
                          <button className="btn secondary small" type="submit">Save</button>
                          {p.av?.avatar_id && p.av?.voice_id ? <span className="badge" style={{ background: '#16a34a', color: '#fff' }}>Ready</span> : null}
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      ) : null}
    </div>
  );
}
