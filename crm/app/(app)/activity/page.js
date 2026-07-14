import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { ACTIVITY_LABELS } from '@/lib/format';
import { AUDIT_ICONS, fetchUserLog, computeKpiStats } from '@/lib/audit';
import Avatar from '@/components/Avatar';
import PrintButton from '@/components/PrintButton';
import UserLogSelect from '@/components/UserLogSelect';

export const dynamic = 'force-dynamic';

const ICON = {
  call: '📞', call_update: '📞', meeting: '🤝', viewing: '🏠', note: '📝', ...AUDIT_ICONS,
};

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
  return new Date(now.getTime() - 30 * 86400000);
}

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

  const linkTo = (over = {}) => {
    const a = 'agent' in over ? over.agent : agentFilter;
    const p = 'period' in over ? over.period : period;
    const qs = new URLSearchParams();
    if (a) qs.set('agent', a);
    if (p) qs.set('period', p);
    const s = qs.toString();
    return s ? `/activity?${s}` : '/activity';
  };

  const [{ data: agents }, actCountRes, audCountRes, feed, stats] = await Promise.all([
    admin.from('profiles').select('id, full_name').in('role', ['agent', 'admin', 'team_leader']).order('full_name'),
    (() => {
      let q = admin.from('lead_activities').select('agent_id, created_at');
      if (startIso) q = q.gte('created_at', startIso);
      return q;
    })(),
    (() => {
      let q = admin.from('audit_events').select('user_id, created_at');
      if (startIso) q = q.gte('created_at', startIso);
      return q.then((r) => r, () => ({ data: [] }));
    })(),
    fetchUserLog(admin, { userId: agentFilter || null, startIso, limit: 400 }),
    agentFilter ? computeKpiStats(admin, { agentId: agentFilter, startIso }) : null,
  ]);

  // Totals per user across BOTH activities and audit events (for the chips).
  const totalByUser = {};
  for (const r of actCountRes.data || []) totalByUser[r.agent_id] = (totalByUser[r.agent_id] || 0) + 1;
  for (const r of (audCountRes && audCountRes.data) || []) totalByUser[r.user_id] = (totalByUser[r.user_id] || 0) + 1;
  const summary = (agents || [])
    .map((a) => ({ ...a, count: totalByUser[a.id] || 0 }))
    .sort((a, b) => b.count - a.count);

  const agentName = (agents || []).find((a) => a.id === agentFilter)?.full_name || 'This user';

  return (
    <div className="stack">
      <div className="spread">
        <div>
          <h1>📜 User activity log</h1>
          <p className="muted">
            Everything each person does on a lead — calls, notes, status changes, follow-ups, contact edits — as dated proof for KPI reviews. Private to admins.
          </p>
        </div>
        <PrintButton className="btn secondary small">🖨 Print for 1:1</PrintButton>
      </div>

      {/* Who + period */}
      <div className="row no-print" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="field" style={{ margin: 0 }}>
          <label className="small muted">Who</label>
          <UserLogSelect agents={agents || []} value={agentFilter} period={period} />
        </div>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {PERIODS.map((p) => (
            <Link
              key={p.key}
              href={linkTo({ period: p.key })}
              className="badge"
              style={{
                background: period === p.key ? 'var(--brand)' : 'var(--panel-2)',
                color: period === p.key ? '#fff' : 'var(--text)',
                padding: '6px 10px', textDecoration: 'none', alignSelf: 'flex-end',
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Per-user totals for the period (click to filter) */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Actions · {periodLabel}</h3>
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
          {agentFilter ? <Link href={linkTo({ agent: '' })} className="small" style={{ alignSelf: 'center' }}>Clear ✕</Link> : null}
        </div>
      </div>

      {/* KPI breakdown for the selected user */}
      {stats ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>{agentName} · {periodLabel}</h3>
          <div className="row" style={{ gap: 18, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            {[
              ['Leads touched', stats.leadsTouched],
              ['📞 Calls', stats.calls],
              ['🤝 Meetings', stats.meetings],
              ['🏠 Viewings', stats.viewings],
              ['📝 Notes', stats.notes],
              ['📅 Follow-ups set', stats.followupsSet],
              ['✅ Follow-ups done', stats.followupsDone],
              ['🔀 Status changes', stats.statusChanges],
              ['✏️ Contact edits', stats.contactEdits],
            ].map(([label, val]) => (
              <div key={label}>
                <div className="small muted">{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700 }}>{val}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Feed with full date + time */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Date &amp; time</th><th>User</th><th>Lead</th><th>Action</th></tr>
          </thead>
          <tbody>
            {feed.map((r) => (
              <tr key={r.id}>
                <td className="small muted" style={{ whiteSpace: 'nowrap' }}>{stamp(r.when)}</td>
                <td>
                  <span className="row" style={{ gap: 6, flexWrap: 'nowrap' }}>
                    <Avatar url={r.avatar} name={r.agentName} size="sm" />
                    <span className="small">{r.agentName}</span>
                  </span>
                </td>
                <td className="small">
                  {r.lead?.id ? <Link href={`/leads/${r.lead.id}`}>{r.lead.name || 'Lead'}</Link> : '—'}
                </td>
                <td className="small">
                  <span className="badge status" style={{ marginRight: 6 }}>{ICON[r.kind] || '•'} {r.label}</span>
                  <span style={{ whiteSpace: 'pre-wrap' }}>{r.body}</span>
                </td>
              </tr>
            ))}
            {feed.length === 0 ? (
              <tr><td colSpan={4} className="muted" style={{ padding: 16 }}>No actions recorded in this period{agentFilter ? ' by this user' : ''}.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {feed.length >= 400 ? <p className="small muted">Showing the 400 most recent actions in this period.</p> : null}
    </div>
  );
}
