import { requireStaff } from '@/lib/auth';
import Avatar from '@/components/Avatar';
import { ROLE_LABELS } from '@/lib/format';
import { setUserTeam } from './actions';

export const dynamic = 'force-dynamic';

const TEAMS = ['Offplan', 'Secondary', 'Rental'];

export default async function TeamsPage({ searchParams }) {
  const { supabase } = await requireStaff();

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email, role, team, avatar_url')
    .order('full_name');

  return (
    <div className="stack" style={{ maxWidth: 680 }}>
      <h1>Teams</h1>
      <p className="muted small">
        Assign each team member to a team. Agents can&apos;t change their own team — only admin and support can.
      </p>
      {searchParams?.ok ? <div className="alert ok">Team updated. ✅</div> : null}
      {searchParams?.error ? <div className="alert error">{searchParams.error}</div> : null}

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead><tr><th>Name</th><th>Role</th><th>Team</th></tr></thead>
          <tbody>
            {(profiles || []).map((p) => (
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
                    <select name="team" defaultValue={TEAMS.includes(p.team) ? p.team : 'Offplan'} style={{ width: 140 }}>
                      {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button className="btn secondary small" type="submit">Save</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
