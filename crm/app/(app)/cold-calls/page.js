import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import Avatar from '@/components/Avatar';

export const dynamic = 'force-dynamic';

const MEDALS = ['🥇', '🥈', '🥉'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default async function ColdCallsPage() {
  const { user, profile } = await requireUser();
  if (profile?.role === 'marketing') redirect('/leads'); // no money for Marketing

  // Month boundary in Dubai time (the whole team is Dubai-based).
  const dubaiYMD = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const monthStart = `${dubaiYMD.slice(0, 7)}-01T00:00:00+04:00`;
  const monthLabel = `${MONTHS[Number(dubaiYMD.slice(5, 7)) - 1]} ${dubaiYMD.slice(0, 4)}`;

  // Aggregate across all agents (service role) — only counts/names are shown,
  // which is the whole point of a public contest board.
  const admin = createAdminClient();
  const { data: coldLeads } = await admin
    .from('leads')
    .select('id, created_by')
    .eq('source', 'Cold Call')
    .gte('created_at', monthStart);

  const ids = (coldLeads || []).map((l) => l.id);
  let metSet = new Set();
  if (ids.length) {
    const { data: meets } = await admin.from('lead_activities').select('lead_id').eq('type', 'meeting').in('lead_id', ids);
    metSet = new Set((meets || []).map((m) => m.lead_id));
  }

  const byAgent = {};
  for (const l of coldLeads || []) {
    const a = l.created_by || 'unknown';
    byAgent[a] ||= { agent_id: a, cold: 0, meetings: 0 };
    byAgent[a].cold += 1;
    if (metSet.has(l.id)) byAgent[a].meetings += 1;
  }

  const agentIds = Object.keys(byAgent).filter((id) => id !== 'unknown');
  let profilesById = {};
  if (agentIds.length) {
    const { data: profs } = await admin.from('profiles').select('id, full_name, avatar_url').in('id', agentIds);
    profilesById = Object.fromEntries((profs || []).map((p) => [p.id, p]));
  }

  const board = Object.values(byAgent)
    .map((r) => ({ ...r, full_name: profilesById[r.agent_id]?.full_name || '—', avatar_url: profilesById[r.agent_id]?.avatar_url }))
    .sort((a, b) => b.cold - a.cold || b.meetings - a.meetings);

  const totalCold = board.reduce((s, r) => s + r.cold, 0);
  const totalMeetings = board.reduce((s, r) => s + r.meetings, 0);

  return (
    <div className="stack">
      <div>
        <h1>📞 Cold-call contest</h1>
        <p className="muted">
          New conversations win deals. Add every cold-call lead (source = <strong>Cold Call</strong>) — most leads
          and most meetings booked this month takes the crown. {monthLabel}.
        </p>
      </div>

      <div className="grid grid-2">
        <div className="card stat"><span className="muted small">Team cold leads — {monthLabel}</span><span className="value">{totalCold}</span></div>
        <div className="card stat"><span className="muted small">Meetings booked from them</span><span className="value">{totalMeetings}</span></div>
      </div>

      {board.length ? (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Agent</th>
                <th className="right">Cold leads</th>
                <th className="right">Meetings</th>
                <th className="right">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {board.map((r, i) => {
                const conv = r.cold > 0 ? Math.round((r.meetings / r.cold) * 100) : 0;
                const isMe = r.agent_id === user.id;
                return (
                  <tr key={r.agent_id} style={isMe ? { background: 'var(--panel-2)' } : undefined}>
                    <td style={{ fontWeight: 700 }}>{MEDALS[i] || i + 1}</td>
                    <td>
                      <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                        <Avatar url={r.avatar_url} name={r.full_name} size="sm" />
                        <span>{r.full_name}</span>
                        {isMe ? <span className="badge role">You</span> : null}
                      </span>
                    </td>
                    <td className="right" style={{ fontWeight: 600 }}>{r.cold}</td>
                    <td className="right">{r.meetings}</td>
                    <td className="right small muted">{conv}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card muted">No cold-call leads added yet this month. Add one with source “Cold Call” and you’ll top the board! 🚀</div>
      )}
    </div>
  );
}
