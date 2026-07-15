import { requireStaff } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import Avatar from '@/components/Avatar';
import MoneyInput from '@/components/MoneyInput';
import { ROLE_LABELS, pct, formatDate, PROPERTY_TYPES } from '@/lib/format';
import { setUserTeam, assignTest, resetTest, remindUpdateLeads, saveRouting } from './actions';

export const dynamic = 'force-dynamic';

const TEAMS = ['Offplan', 'Secondary', 'Rental'];

export default async function TeamsPage({ searchParams }) {
  const { supabase } = await requireStaff();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .order('full_name');

  // Training test data (read with the service-role key so staff can see
  // everyone's attempts). Degrades gracefully if the tables aren't set up yet.
  const admin = createAdminClient();
  const { data: quiz } = await admin
    .from('quizzes')
    .select('id, title')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const attemptByUser = new Map();
  const assignedTo = new Set();
  if (quiz) {
    const { data: attempts } = await admin
      .from('quiz_attempts')
      .select('user_id, correct, total, score_pct, passed, submitted_at')
      .eq('quiz_id', quiz.id);
    for (const a of attempts || []) attemptByUser.set(a.user_id, a);

    const { data: assigns } = await admin
      .from('quiz_assignments')
      .select('user_id')
      .eq('quiz_id', quiz.id);
    for (const a of assigns || []) assignedTo.add(a.user_id);
  }

  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <h1>Teams</h1>
      <p className="muted small">
        Assign each member to a team, assign the training test, and see their result. Agents can&apos;t
        change their own team.
      </p>
      {searchParams?.ok ? <div className="alert ok">{searchParams.ok === '1' ? 'Team updated. ✅' : searchParams.ok}</div> : null}
      {searchParams?.error ? <div className="alert error">{searchParams.error}</div> : null}
      {!quiz ? (
        <div className="alert error">No training test is set up in this database yet — run the training SQL (0018 + 0019) to enable the test column.</div>
      ) : null}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead><tr><th>Name</th><th>Role</th><th>Team</th><th>Test result</th><th></th></tr></thead>
          <tbody>
            {(profiles || []).map((p) => {
              const at = attemptByUser.get(p.id);
              return (
                <tr key={p.id}>
                  <td>
                    <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                      <Avatar url={p.avatar_url} name={p.full_name} size="sm" />
                      <div>
                        <div>{p.full_name || p.email}</div>
                        <div className="small muted">{p.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="small muted">{ROLE_LABELS[p.role] || p.role}</td>
                  <td style={{ padding: 0 }}>
                    <form action={setUserTeam} className="row" style={{ padding: '8px 12px', gap: 8 }}>
                      <input type="hidden" name="agent_id" value={p.id} />
                      <select name="team" defaultValue={TEAMS.includes(p.team) ? p.team : 'Offplan'} style={{ width: 120 }}>
                        {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <button className="btn secondary small" type="submit">Save</button>
                    </form>
                  </td>
                  <td className="small">
                    {at ? (
                      <>
                        <span className={`badge ${at.passed ? 'won' : 'lost'}`}>{at.passed ? 'Passed' : 'Not passed'}</span>{' '}
                        <strong>{at.correct}/{at.total}</strong> <span className="muted">({pct(at.score_pct)})</span>
                        <div className="small muted">{formatDate(at.submitted_at)}</div>
                      </>
                    ) : assignedTo.has(p.id) ? (
                      <span className="badge status">Assigned · not taken</span>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                  <td className="right">
                    <div className="row" style={{ gap: 6, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      {quiz && !at ? (
                        <form action={assignTest}>
                          <input type="hidden" name="member_id" value={p.id} />
                          <button className="btn small" type="submit">
                            {assignedTo.has(p.id) ? 'Re-notify' : 'Assign test'}
                          </button>
                        </form>
                      ) : quiz && at ? (
                        <form action={resetTest}>
                          <input type="hidden" name="member_id" value={p.id} />
                          <button className="btn secondary small" type="submit">Reset test</button>
                        </form>
                      ) : null}
                      {p.role === 'agent' ? (
                        <form action={remindUpdateLeads}>
                          <input type="hidden" name="member_id" value={p.id} />
                          <button className="btn ghost small" type="submit">Remind: update leads</button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---- Lead routing rules (campaigns → the right agent, auto-rotated) ---- */}
      <div className="card">
        <h2 style={{ marginTop: 0 }}>⚡ Lead routing</h2>
        <p className="small muted" style={{ marginTop: 0 }}>
          Campaign leads are assigned automatically: the lead’s <strong>budget</strong> and <strong>property type</strong>{' '}
          are matched against these rules, and matching agents take turns (fair rotation). Applies to leads from the
          website/Meta webhook and to leads you add with “⚡ Auto-route”. No match → the lead goes to the pool.
        </p>
        <div className="stack" style={{ gap: 10 }}>
          {(profiles || [])
            .filter((p) => p.role === 'agent' || p.role === 'admin')
            .map((p) => {
              const selected = String(p.route_types || '').split(',').map((s) => s.trim()).filter(Boolean);
              return (
                <form key={p.id} action={saveRouting} className="card" style={{ background: 'var(--panel-2)', margin: 0 }}>
                  <input type="hidden" name="member_id" value={p.id} />
                  <div className="row" style={{ gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Avatar url={p.avatar_url} name={p.full_name} size="sm" />
                    <strong style={{ minWidth: 120 }}>{p.full_name}</strong>
                    <label className="small" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="checkbox" name="route_enabled" defaultChecked={!!p.route_enabled} /> In rotation
                    </label>
                    <label className="small muted" style={{ display: 'flex', flexDirection: 'column' }}>
                      Budget from (AED)
                      <MoneyInput name="route_min" defaultValue={p.route_min_budget || ''} placeholder="no minimum" style={{ width: 140 }} />
                    </label>
                    <label className="small muted" style={{ display: 'flex', flexDirection: 'column' }}>
                      Budget up to (AED)
                      <MoneyInput name="route_max" defaultValue={p.route_max_budget || ''} placeholder="no maximum" style={{ width: 140 }} />
                    </label>
                  </div>
                  <div className="row" style={{ gap: 12, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="small muted">Types (none ticked = any):</span>
                    {PROPERTY_TYPES.map((t) => (
                      <label key={t} className="small" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                        <input type="checkbox" name="route_types" value={t} defaultChecked={selected.includes(t)} /> {t}
                      </label>
                    ))}
                    <button className="btn secondary small" type="submit" style={{ marginLeft: 'auto' }}>Save</button>
                  </div>
                </form>
              );
            })}
        </div>
      </div>
    </div>
  );
}
