import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { SELF_GENERATED } from '@/lib/leadOrigin';
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
  // Score on origin (migration 0040), not an exact match on the source text —
  // "cold call", "Cold-Call" or a stray space used to score nothing at all.
  // Cold calls and follow-ups are both the agent's own effort, so both count;
  // they stay in separate columns so working old leads can't be mistaken for
  // starting new conversations.
  let { data: coldLeads, error: originErr } = await admin
    .from('leads')
    .select('id, created_by, origin')
    .in('origin', SELF_GENERATED)
    .gte('created_at', monthStart);
  const originReady = !originErr;
  if (originErr) {
    // Migration 0040 not applied yet — fall back to the old source match.
    const { data } = await admin
      .from('leads')
      .select('id, created_by')
      .eq('source', 'Cold Call')
      .gte('created_at', monthStart);
    coldLeads = (data || []).map((l) => ({ ...l, origin: 'cold_call' }));
  }

  const ids = (coldLeads || []).map((l) => l.id);
  let metSet = new Set();
  if (ids.length) {
    const { data: meets } = await admin.from('lead_activities').select('lead_id').eq('type', 'meeting').in('lead_id', ids);
    metSet = new Set((meets || []).map((m) => m.lead_id));
  }

  const byAgent = {};
  for (const l of coldLeads || []) {
    const a = l.created_by || 'unknown';
    byAgent[a] ||= { agent_id: a, cold: 0, followUp: 0, total: 0, meetings: 0 };
    if (l.origin === 'follow_up') byAgent[a].followUp += 1;
    else byAgent[a].cold += 1;
    byAgent[a].total += 1;
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
    .sort((a, b) => b.total - a.total || b.cold - a.cold || b.meetings - a.meetings);

  const totalCold = board.reduce((s, r) => s + r.cold, 0);
  const totalFollowUp = board.reduce((s, r) => s + r.followUp, 0);
  const totalSelf = totalCold + totalFollowUp;
  const totalMeetings = board.reduce((s, r) => s + r.meetings, 0);

  return (
    <div className="stack">
      <div>
        <h1>📞 Cold-call contest</h1>
        <p className="muted">
          New conversations win deals. Every lead you add as a <strong>📞 cold call</strong> or a{' '}
          <strong>🔁 follow-up</strong> scores — they are counted separately so starting a new
          conversation is never confused with working an old one. Ranked on the combined total,
          then meetings booked. {monthLabel}.
        </p>
      </div>

      {!originReady ? (
        <div className="alert" style={{ background: '#fde4e4', border: '1px solid var(--red)', color: '#7f1d1d', padding: '10px 14px', borderRadius: 10 }}>
          <strong>⚠️ Scoring on the old source text.</strong> Run migration{' '}
          <code>0040_lead_origin.sql</code> to score on lead origin — until then only leads whose
          source is exactly “Cold Call” count, and follow-ups don&apos;t count at all.
        </div>
      ) : null}

      <div className="grid grid-2">
        <div className="card stat">
          <span className="muted small">Team self-generated leads — {monthLabel}</span>
          <span className="value">{totalSelf}</span>
          <span className="small muted">📞 {totalCold} cold · 🔁 {totalFollowUp} follow-up</span>
        </div>
        <div className="card stat"><span className="muted small">Meetings booked from them</span><span className="value">{totalMeetings}</span></div>
      </div>

      {board.length ? (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Agent</th>
                <th className="right">📞 Cold</th>
                <th className="right">🔁 Follow-up</th>
                <th className="right">Total</th>
                <th className="right">Meetings</th>
                <th className="right">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {board.map((r, i) => {
                const conv = r.total > 0 ? Math.round((r.meetings / r.total) * 100) : 0;
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
                    <td className="right">{r.cold}</td>
                    <td className="right">{r.followUp}</td>
                    <td className="right" style={{ fontWeight: 700 }}>{r.total}</td>
                    <td className="right">{r.meetings}</td>
                    <td className="right small muted">{conv}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card muted">No self-generated leads yet this month. Add a lead and pick 📞 Cold call or 🔁 Follow-up — you’ll top the board! 🚀</div>
      )}
    </div>
  );
}
