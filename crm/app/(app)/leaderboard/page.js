import { requireUser } from '@/lib/auth';
import { aed, SENIORITY_LABELS } from '@/lib/format';
import Avatar from '@/components/Avatar';

export const dynamic = 'force-dynamic';

const MEDALS = ['🥇', '🥈', '🥉'];

export default async function LeaderboardPage() {
  const { user, supabase } = await requireUser();
  const { data: rows } = await supabase.rpc('agent_leaderboard');
  const board = rows || [];
  const topValue = board.length ? Number(board[0].total_value) || 0 : 0;

  return (
    <div className="stack">
      <div>
        <h1>🏆 Team leaderboard</h1>
        <p className="muted">Ranked by total sales value closed. Keep climbing!</p>
      </div>

      {board.length ? (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Agent</th>
                <th>Level</th>
                <th className="right">Deals</th>
                <th className="right">Sales value</th>
                <th style={{ width: '30%' }}>Share of top</th>
              </tr>
            </thead>
            <tbody>
              {board.map((r, i) => {
                const value = Number(r.total_value) || 0;
                const share = topValue > 0 ? value / topValue : 0;
                const isMe = r.agent_id === user.id;
                return (
                  <tr key={r.agent_id} style={isMe ? { background: 'var(--panel-2)' } : undefined}>
                    <td style={{ fontWeight: 700 }}>{MEDALS[i] || i + 1}</td>
                    <td>
                      <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                        <Avatar url={r.avatar_url} name={r.full_name} size="sm" />
                        <span>{r.full_name || '—'}</span>
                        {isMe ? <span className="badge role">You</span> : null}
                      </span>
                    </td>
                    <td className="small muted">{SENIORITY_LABELS[r.seniority] || r.seniority}</td>
                    <td className="right">{r.deals_count}</td>
                    <td className="right" style={{ fontWeight: 600 }}>{aed(value)}</td>
                    <td>
                      <div className="progress" style={{ height: 10 }}>
                        <div style={{ width: `${Math.round(share * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card muted">No agents with deals yet. Once deals are logged, the ranking shows here.</div>
      )}
    </div>
  );
}
