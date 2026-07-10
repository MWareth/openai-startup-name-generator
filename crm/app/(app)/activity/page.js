import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { ACTIVITY_LABELS, formatDate } from '@/lib/format';
import Avatar from '@/components/Avatar';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

const ICON = { call: '📞', call_update: '📞', meeting: '🤝', viewing: '🏠', note: '📝' };

// Selectable review windows for the KPI 1:1s.
const PERIODS = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: 'quarter', label: 'This quarter' },
  { key: 'all', label: 'All time' },
];

function periodStart(key) {
  const now = new Date();
  if (key === '7d') return new Date(now.getTime() - 7 * 86400000);
  if (key === 'quarter') return new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  if (key === 'all') return null;
  return new Date(now.getTime() - 30 * 86400000); // default 30d
}

// Full date + time, e.g. "10 Jul 2026, 14:32" — the evidence stamp for KPIs.
function stamp(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default async function ActivityLogPage({ searchParams }) {
  await requireAdmin();
  const admin = createAdminClient();
  const agentFilter = searchParams?.agent || '';
  const period = PERIODS.some((p) => p.key === searchParams?.period) ? searchParams.period : '30d';
  const periodLabel = PERIODS.find((p) => p.key === period)?.label || 'Last 30 days';
  const startDate = periodStart(period);
  const startIso = startDate ? startDate.toISOString() : null;

  // A link that keeps the current agent/period while changing one of them.
  const linkTo = (over = {}) => {
    const a = 'agent' in over ? over.agent : agentFilter;
    const p = 'period' in over ? over.period : period;
    const qs = new URLSearchParams();
    if (a) qs.set('agent', a);
    if (p) qs.set('period', p);
    const s = qs.toString();
    return s ? `/activity?${s}` : '/activity';
  };

  const [{ data: agents }, periodRes, feedRes] = await Promise.all([
    admin.from('profiles').select('id, full_name').in('role', ['agent', 'admin', 'team_leader']).order('full_name'),
    (() => {
      let q = admin.from('lead_activities').select('agent_id, type, lead_id, created_at');
      if (startIso) q = q.gte('created_at', startIso);
      return q;
    })(),
    (() => {
      let q = admin
        .from('lead_activities')
        .select('id, type, body, occurred_on, created_at, agent_id, agent:profiles(full_name, avatar_url), lead:leads(id, name)')
        .order('created_at', { ascending: false })
        .limit(400);
      if (agentFilter) q = q.eq('agent_id', agentFilter);
      if (startIso) q = q.gte('created_at', startIso);
      return q;
    })(),
  ]);

  const periodActs = periodRes.data || [];
  const acts = feedRes.data || [];

  // Totals per agent for the chips.
  const totalByAgent = {};
  for (const r of periodActs) totalByAgent[r.agent_id] = (totalByAgent[r.agent_id] || 0) + 1;
  const summary = (agents || [])
    .map((a) => ({ ...a, count: totalByAgent[a.id] || 0 }))
    .sort((a, b) => b.count - a.count);

  // KPI breakdown for the selected agent (type counts + distinct leads touched).
  let breakdown = null;
  if (agentFilter) {
    const rows = periodActs.filter((r) => r.agent_id === agentFilter);
    const byType = {};
    const leads = new Set();
    for (const r of rows) {
      byType[r.type] = (byType[r.type] || 0) + 1;
      if (r.lead_id) leads.add(r.lead_id);
    }
    breakdown = {
      name: (agents || []).find((a) => a.id === agentFilter)?.full_name || 'Agent',
      total: rows.length,
      leads: leads.size,
      byType,
    };
  }

  return (
    <div className="stack">
      <div className="spread">
        <div>
          <h1>📜 Lead activity log</h1>
          <p className="muted">
            Every update your team logs on a lead — calls, meetings, viewings, notes — as dated proof for KPI reviews. Private to admins.
          </p>
        </div>
        <PrintButton className="btn secondary small">🖨 Print for 1:1</PrintButton>
      </div>

      {/* Period picker */}
      <div className="row no-print" style={{ gap: 8, flexWrap: 'wrap' }}>
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            href={linkTo({ period: p.key })}
            className="badge"
            style={{
              background: period === p.key ? 'var(--brand)' : 'var(--panel-2)',
              color: period === p.key ? '#fff' : 'var(--text)',
              padding: '6px 10px', textDecoration: 'none',
            }}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* Per-agent totals for the period (click to filter) */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Updates · {periodLabel}</h3>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {summary.map((a) => (
            <Link
              key={a.id}
              href={agentFilter === a.id ? linkTo({ agent: '' }) : linkTo({ agent: a.id })}
              className="badge"
              style={{
                background: agentFilter === a.id ? 'var(--brand)' : 'var(--panel-2)',
                color: agentFilter === a.id ? '#fff' : 'var(--text)',
                padding: '6px 10px', textDecoration: 'none',
              }}
            >
              {a.full_name} · <strong>{a.count}</strong>
            </Link>
          ))}
          {agentFilter ? <Link href={linkTo({ agent: '' })} className="small" style={{ alignSelf: 'center' }}>Clear filter ✕</Link> : null}
        </div>
      </div>

      {/* KPI breakdown for the selected agent */}
      {breakdown ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{breakdown.name} · {periodLabel}</h3>
          <div className="row" style={{ gap: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div><div className="small muted">Total updates</div><div style={{ fontSize: 26, fontWeight: 700 }}>{breakdown.total}</div></div>
            <div><div className="small muted">Leads touched</div><div style={{ fontSize: 26, fontWeight: 700 }}>{breakdown.leads}</div></div>
            {Object.keys(ACTIVITY_LABELS).map((t) => (
              <div key={t}>
                <div className="small muted">{ICON[t] || ''} {ACTIVITY_LABELS[t]}</div>
                <div style={{ fontSize: 22, fontWeight: 600 }}>{breakdown.byType[t] || 0}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Feed with full date + time */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Date &amp; time</th><th>Agent</th><th>Lead</th><th>Update</th></tr>
          </thead>
          <tbody>
            {acts.map((a) => (
              <tr key={a.id}>
                <td className="small muted" style={{ whiteSpace: 'nowrap' }}>{stamp(a.created_at)}</td>
                <td>
                  <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                    <Avatar url={a.agent?.avatar_url} name={a.agent?.full_name} size="sm" />
                    <span className="small">{a.agent?.full_name || '—'}</span>
                  </span>
                </td>
                <td className="small">
                  {a.lead?.id ? <Link href={`/leads/${a.lead.id}`}>{a.lead.name || 'Lead'}</Link> : '—'}
                </td>
                <td className="small">
                  <span className="badge status" style={{ marginRight: 6 }}>{ICON[a.type] || ''} {ACTIVITY_LABELS[a.type] || a.type}</span>
                  <span style={{ whiteSpace: 'pre-wrap' }}>{a.body}</span>
                </td>
              </tr>
            ))}
            {acts.length === 0 ? (
              <tr><td colSpan={4} className="muted" style={{ padding: 16 }}>No updates logged in this period{agentFilter ? ' by this agent' : ''}.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {acts.length >= 400 ? <p className="small muted">Showing the 400 most recent updates in this period.</p> : null}
    </div>
  );
}
