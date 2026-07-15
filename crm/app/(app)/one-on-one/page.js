import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { aed, formatDate, STATUS_LABELS } from '@/lib/format';
import { computeKpiStats } from '@/lib/audit';
import Avatar from '@/components/Avatar';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

const PERIODS = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'quarter', label: 'This quarter' },
];

function periodStart(key) {
  const now = new Date();
  if (key === '7d') return new Date(now.getTime() - 7 * 86400000);
  if (key === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  return new Date(now.getTime() - 30 * 86400000);
}

function Stat({ label, value, warn }) {
  return (
    <div>
      <div className="small muted">{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: warn ? '#dc2626' : undefined }}>{value}</div>
    </div>
  );
}

export default async function OneOnOnePage({ searchParams }) {
  await requireAdmin();
  const admin = createAdminClient();
  const agentId = searchParams?.agent || '';
  const period = PERIODS.some((p) => p.key === searchParams?.period) ? searchParams.period : '30d';
  const periodLabel = PERIODS.find((p) => p.key === period)?.label;
  const startDate = periodStart(period);
  const startIso = startDate.toISOString();

  const { data: people } = await admin
    .from('profiles')
    .select('id, full_name, role')
    .in('role', ['agent', 'admin'])
    .order('full_name');

  const linkTo = (over = {}) => {
    const qs = new URLSearchParams();
    qs.set('agent', 'agent' in over ? over.agent : agentId);
    qs.set('period', 'period' in over ? over.period : period);
    return `/one-on-one?${qs.toString()}`;
  };

  let report = null;
  if (agentId) {
    const [{ data: agent }, stats, leadsRes, dealsRes, actAll, audAll] = await Promise.all([
      admin.from('profiles').select('*').eq('id', agentId).single(),
      computeKpiStats(admin, { agentId, startIso }),
      admin.from('leads').select('id, name, status, qualification, updated_at, next_follow_up, assigned_at, sla_alerted_at').eq('assigned_agent_id', agentId),
      admin.from('deals').select('gross_commission, closed_on').eq('agent_id', agentId).gte('closed_on', startIso.slice(0, 10)).then((r) => r, () => ({ data: [] })),
      admin.from('lead_activities').select('agent_id').gte('created_at', startIso),
      admin.from('audit_events').select('user_id').gte('created_at', startIso).then((r) => r, () => ({ data: [] })),
    ]);
    if (agent) {
      const leads = leadsRes.data || [];
      const open = leads.filter((l) => l.status !== 'won' && l.status !== 'lost');
      const weekAgo = Date.now() - 7 * 86400000;
      const today = new Date().toISOString().slice(0, 10);
      const stale = open.filter((l) => l.updated_at && new Date(l.updated_at).getTime() < weekAgo);
      const overdue = open.filter((l) => l.next_follow_up && l.next_follow_up < today);
      const byStatus = {};
      for (const l of leads) byStatus[l.status] = (byStatus[l.status] || 0) + 1;

      // Response speed on leads assigned within the period.
      const assignedInPeriod = leads.filter((l) => l.assigned_at && new Date(l.assigned_at).getTime() >= startDate.getTime());
      let avgResponseMin = null;
      let neverActioned = 0;
      if (assignedInPeriod.length) {
        const ids = assignedInPeriod.map((l) => l.id);
        const { data: firstActs } = await admin
          .from('lead_activities')
          .select('lead_id, created_at')
          .in('lead_id', ids)
          .eq('agent_id', agentId);
        const firstByLead = {};
        for (const a of firstActs || []) {
          const t = new Date(a.created_at).getTime();
          if (firstByLead[a.lead_id] == null || t < firstByLead[a.lead_id]) firstByLead[a.lead_id] = t;
        }
        const times = [];
        for (const l of assignedInPeriod) {
          const first = firstByLead[l.id];
          if (first == null) neverActioned += 1;
          else {
            const mins = (first - new Date(l.assigned_at).getTime()) / 60000;
            if (mins >= 0) times.push(mins);
          }
        }
        if (times.length) avgResponseMin = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
      }
      const slaNudges = leads.filter((l) => l.sla_alerted_at && new Date(l.sla_alerted_at).getTime() >= startDate.getTime()).length;

      // Team comparison: total recorded actions per roster member this period.
      const totals = {};
      for (const r of actAll.data || []) totals[r.agent_id] = (totals[r.agent_id] || 0) + 1;
      for (const r of (audAll && audAll.data) || []) totals[r.user_id] = (totals[r.user_id] || 0) + 1;
      const rosterIds = (people || []).map((p) => p.id);
      const teamTotals = rosterIds.map((id) => totals[id] || 0);
      const teamAvg = teamTotals.length ? Math.round(teamTotals.reduce((a, b) => a + b, 0) / teamTotals.length) : 0;
      const myTotal = totals[agentId] || 0;

      const deals = dealsRes.data || [];
      const dealGross = deals.reduce((a, d) => a + Number(d.gross_commission || 0), 0);

      // Auto talking points — the conversation starters, from the data.
      const points = [];
      if (stats.followupsSet > 0 && stats.followupsDone < stats.followupsSet * 0.7)
        points.push(`Follow-up gap: set ${stats.followupsSet}, completed ${stats.followupsDone}. Ask what's blocking the callbacks.`);
      if (overdue.length) points.push(`${overdue.length} open lead${overdue.length === 1 ? ' has' : 's have'} an overdue follow-up right now.`);
      if (stale.length) points.push(`${stale.length} open lead${stale.length === 1 ? '' : 's'} untouched for 7+ days — walk through them together.`);
      if (neverActioned) points.push(`${neverActioned} lead${neverActioned === 1 ? '' : 's'} assigned this period still ${neverActioned === 1 ? 'has' : 'have'} no first action.`);
      if (avgResponseMin != null && avgResponseMin > 30) points.push(`Average first response ${avgResponseMin} min — target is under 30.`);
      if (slaNudges) points.push(`${slaNudges} SLA nudge${slaNudges === 1 ? '' : 's'} (20-min rule) fired this period.`);
      if ((byStatus.new || 0) > 0 && stats.statusChanges === 0) points.push(`${byStatus.new} lead${byStatus.new === 1 ? '' : 's'} sitting in “New” and no status changes recorded — pipeline isn't moving.`);
      if (teamAvg > 0 && myTotal < teamAvg * 0.6) points.push(`Activity well below team average (${myTotal} vs ~${teamAvg}). Understand why before pushing targets.`);
      if (stats.notes > 0 && stats.calls === 0 && stats.meetings === 0) points.push('All notes, no calls/meetings logged — documenting or actually selling?');
      // Positives — always give them something to keep doing.
      if (teamAvg > 0 && myTotal > teamAvg * 1.2) points.push(`✅ Activity above team average (${myTotal} vs ~${teamAvg}) — recognize it.`);
      if (stats.viewings > 0) points.push(`✅ ${stats.viewings} viewing${stats.viewings === 1 ? '' : 's'} this period — that's the right work.`);
      if (deals.length) points.push(`✅ ${deals.length} deal${deals.length === 1 ? '' : 's'} closed (${aed(dealGross)} gross) — celebrate, then ask what made them close.`);
      if (!points.length) points.push('Numbers look healthy — use the time for pipeline strategy and blockers.');

      report = { agent, stats, leads, open, stale, overdue, byStatus, avgResponseMin, neverActioned, slaNudges, myTotal, teamAvg, deals, dealGross, points };
    }
  }

  return (
    <div className="stack">
      <div className="spread">
        <div>
          <h1>📋 1:1 Report</h1>
          <p className="muted">Everything you need for a one-to-one, on one page. Private to management.</p>
        </div>
        {report ? <PrintButton className="btn secondary small">🖨 Print</PrintButton> : null}
      </div>

      {/* Picker */}
      <div className="card no-print">
        <form method="get" action="/one-on-one" className="row" style={{ gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="field" style={{ margin: 0 }}>
            <label className="small muted">Who</label>
            <select name="agent" defaultValue={agentId} style={{ minWidth: 200 }}>
              <option value="">Choose…</option>
              {(people || []).map((p) => <option key={p.id} value={p.id}>{p.full_name}</option>)}
            </select>
          </div>
          <input type="hidden" name="period" value={period} />
          <button className="btn secondary small" type="submit">Load</button>
          <div className="row" style={{ gap: 6 }}>
            {PERIODS.map((p) => (
              <Link key={p.key} href={linkTo({ period: p.key })} className="badge" style={{
                background: period === p.key ? 'var(--brand)' : 'var(--panel-2)',
                color: period === p.key ? '#fff' : 'var(--text)', padding: '6px 10px', textDecoration: 'none',
              }}>{p.label}</Link>
            ))}
          </div>
        </form>
      </div>

      {report ? (
        <>
          {/* Header */}
          <div className="card">
            <div className="row" style={{ gap: 12, alignItems: 'center' }}>
              <Avatar url={report.agent.avatar_url} name={report.agent.full_name} size="md" />
              <div>
                <h2 style={{ margin: 0 }}>{report.agent.full_name}</h2>
                <div className="small muted">
                  {report.agent.team || '—'} · {periodLabel}
                  {report.agent.joined_on ? <> · joined {formatDate(report.agent.joined_on)}</> : null}
                  {report.agent.last_seen_at ? <> · last seen {formatDate(report.agent.last_seen_at)}</> : null}
                </div>
              </div>
            </div>
          </div>

          {/* Suggested talking points */}
          <div className="card" style={{ borderColor: 'var(--gold)' }}>
            <h3 style={{ marginTop: 0 }}>🗣 Suggested talking points</h3>
            <ul style={{ margin: '0 0 0 18px', lineHeight: 1.9 }}>
              {report.points.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>

          {/* Activity */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Activity · {periodLabel}</h3>
            <div className="row" style={{ gap: 18, flexWrap: 'wrap' }}>
              <Stat label="Total actions" value={report.myTotal} />
              <Stat label="Team average" value={`~${report.teamAvg}`} />
              <Stat label="Leads touched" value={report.stats.leadsTouched} />
              <Stat label="📞 Calls" value={report.stats.calls} />
              <Stat label="🤝 Meetings" value={report.stats.meetings} />
              <Stat label="🏠 Viewings" value={report.stats.viewings} />
              <Stat label="📝 Notes" value={report.stats.notes} />
              <Stat label="📅 Follow-ups set" value={report.stats.followupsSet} />
              <Stat label="✅ Follow-ups done" value={report.stats.followupsDone} />
              <Stat label="🔀 Status changes" value={report.stats.statusChanges} />
            </div>
          </div>

          {/* Speed */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Response speed (new leads this period)</h3>
            <div className="row" style={{ gap: 18, flexWrap: 'wrap' }}>
              <Stat label="Avg first response" value={report.avgResponseMin == null ? '—' : `${report.avgResponseMin} min`} warn={report.avgResponseMin != null && report.avgResponseMin > 30} />
              <Stat label="Still not actioned" value={report.neverActioned} warn={report.neverActioned > 0} />
              <Stat label="SLA nudges (20-min)" value={report.slaNudges} warn={report.slaNudges > 0} />
            </div>
          </div>

          {/* Lead book */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Lead book (all time)</h3>
            <div className="row" style={{ gap: 18, flexWrap: 'wrap' }}>
              <Stat label="Total assigned" value={report.leads.length} />
              {Object.entries(report.byStatus).map(([s, n]) => (
                <Stat key={s} label={STATUS_LABELS[s] || s} value={n} />
              ))}
              <Stat label="Stale 7+ days (open)" value={report.stale.length} warn={report.stale.length > 0} />
              <Stat label="Overdue follow-ups" value={report.overdue.length} warn={report.overdue.length > 0} />
            </div>
            {report.stale.length ? (
              <details style={{ marginTop: 10 }}>
                <summary className="small muted">Show the stale leads</summary>
                <ul className="small" style={{ margin: '6px 0 0 18px', lineHeight: 1.8 }}>
                  {report.stale.slice(0, 15).map((l) => (
                    <li key={l.id}><Link href={`/leads/${l.id}`}>{l.name}</Link> — {STATUS_LABELS[l.status] || l.status}, last touch {formatDate(l.updated_at)}</li>
                  ))}
                </ul>
              </details>
            ) : null}
          </div>

          {/* Deals */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Deals · {periodLabel}</h3>
            <div className="row" style={{ gap: 18, flexWrap: 'wrap' }}>
              <Stat label="Closed" value={report.deals.length} />
              <Stat label="Gross commission" value={aed(report.dealGross)} />
            </div>
          </div>

          <p className="small muted no-print">
            Deep dive: <Link href={`/activity?agent=${agentId}&period=${period === '7d' ? '7d' : period === 'quarter' ? 'quarter' : '30d'}`}>full activity log</Link> ·{' '}
            <Link href={`/reviews/${agentId}`}>KPI scorecards</Link>
          </p>
        </>
      ) : (
        <p className="muted">Pick a person above to generate their report.</p>
      )}
    </div>
  );
}
