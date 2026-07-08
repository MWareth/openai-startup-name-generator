import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { ACTIVITY_LABELS, formatDate } from '@/lib/format';
import Avatar from '@/components/Avatar';

export const dynamic = 'force-dynamic';

// Relative "how long ago" for the feed.
function timeAgo(ts) {
  if (!ts) return '';
  const mins = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(ts);
}

const ICON = { call: '📞', call_update: '📞', meeting: '🤝', viewing: '🏠', note: '📝' };

export default async function ActivityLogPage({ searchParams }) {
  await requireAdmin();
  const admin = createAdminClient();
  const agentFilter = searchParams?.agent || '';

  const weekAgoIso = new Date(Date.now() - 7 * 86400000).toISOString();

  const [{ data: agents }, { data: recent }, actsRes] = await Promise.all([
    admin.from('profiles').select('id, full_name').in('role', ['agent', 'admin', 'team_leader']).order('full_name'),
    admin.from('lead_activities').select('agent_id, created_at').gte('created_at', weekAgoIso),
    (() => {
      let q = admin
        .from('lead_activities')
        .select('id, type, body, occurred_on, created_at, agent_id, agent:profiles(full_name, avatar_url), lead:leads(id, name)')
        .order('created_at', { ascending: false })
        .limit(300);
      if (agentFilter) q = q.eq('agent_id', agentFilter);
      return q;
    })(),
  ]);

  const acts = actsRes.data || [];

  // Updates per agent in the last 7 days.
  const weekCount = {};
  for (const r of recent || []) weekCount[r.agent_id] = (weekCount[r.agent_id] || 0) + 1;
  const summary = (agents || [])
    .map((a) => ({ ...a, count: weekCount[a.id] || 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="stack">
      <div>
        <h1>📜 Lead activity log</h1>
        <p className="muted">
          Every update your team logs on a lead — calls, meetings, notes — newest first. Private to admins.
        </p>
      </div>

      {/* Per-agent activity this week */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Updates this week</h3>
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {summary.map((a) => (
            <Link
              key={a.id}
              href={agentFilter === a.id ? '/activity' : `/activity?agent=${a.id}`}
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
          {agentFilter ? <Link href="/activity" className="small" style={{ alignSelf: 'center' }}>Clear filter ✕</Link> : null}
        </div>
      </div>

      {/* Feed */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>When</th><th>Agent</th><th>Lead</th><th>Update</th></tr>
          </thead>
          <tbody>
            {acts.map((a) => (
              <tr key={a.id}>
                <td className="small muted" style={{ whiteSpace: 'nowrap' }} title={new Date(a.created_at).toLocaleString('en-GB')}>{timeAgo(a.created_at)}</td>
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
              <tr><td colSpan={4} className="muted" style={{ padding: 16 }}>No updates logged yet{agentFilter ? ' by this agent' : ''}.</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
      {acts.length >= 300 ? <p className="small muted">Showing the 300 most recent updates.</p> : null}
    </div>
  );
}
