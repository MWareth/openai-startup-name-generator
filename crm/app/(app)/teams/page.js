import { requireStaff } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import Avatar from '@/components/Avatar';
import { ROLE_LABELS, pct, formatDate } from '@/lib/format';
import { setUserTeam, assignTest } from './actions';

export const dynamic = 'force-dynamic';

const TEAMS = ['Offplan', 'Secondary', 'Rental'];

export default async function TeamsPage({ searchParams }) {
  const { supabase } = await requireStaff();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, team, avatar_url')
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
                    {quiz && !at ? (
                      <form action={assignTest}>
                        <input type="hidden" name="member_id" value={p.id} />
                        <button className="btn small" type="submit">
                          {assignedTo.has(p.id) ? 'Re-notify' : 'Assign test'}
                        </button>
                      </form>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
