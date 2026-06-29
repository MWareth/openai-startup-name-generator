import { requireStaff } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import Avatar from '@/components/Avatar';
import { ROLE_LABELS } from '@/lib/format';

export const dynamic = 'force-dynamic';

function fmtDuration(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

function timeAgo(ts) {
  if (!ts) return 'never';
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default async function PresencePage() {
  await requireStaff();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: activity }] = await Promise.all([
    admin.from('profiles').select('id, full_name, avatar_url, role, login_count, last_login_at, last_seen_at').order('full_name'),
    admin.from('user_activity').select('user_id, day, seconds'),
  ]);

  // Aggregate active time per user: total seconds + number of active days.
  const byUser = {};
  for (const r of activity || []) {
    const u = (byUser[r.user_id] ||= { total: 0, days: 0 });
    u.total += Number(r.seconds || 0);
    if (Number(r.seconds || 0) > 0) u.days += 1;
  }

  const onlineCutoff = Date.now() - 5 * 60000; // seen in last 5 min = online
  const rows = (profiles || []).map((p) => {
    const a = byUser[p.id] || { total: 0, days: 0 };
    const avg = a.days ? a.total / a.days : 0;
    const online = p.last_seen_at && new Date(p.last_seen_at).getTime() >= onlineCutoff;
    return { ...p, total: a.total, days: a.days, avg, online };
  });

  return (
    <div className="stack">
      <div>
        <h1>📊 Presence &amp; activity</h1>
        <p className="muted">
          Logins, last seen, and active time on the CRM — for management &amp; support to monitor presence and flow.
          Active time counts only while the app is open and in use.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th className="right">Logins</th>
              <th>Last seen</th>
              <th className="right">Active days</th>
              <th className="right">Total time</th>
              <th className="right">Avg / active day</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                    <Avatar url={r.avatar_url} name={r.full_name} size="sm" />
                    <span>{r.full_name || '—'}</span>
                    {r.online ? <span className="badge won">● Online</span> : null}
                  </span>
                </td>
                <td className="small muted">{ROLE_LABELS[r.role] || r.role}</td>
                <td className="right" style={{ fontWeight: 600 }}>{r.login_count || 0}</td>
                <td className="small muted">{timeAgo(r.last_seen_at)}</td>
                <td className="right small">{r.days}</td>
                <td className="right">{fmtDuration(r.total)}</td>
                <td className="right small muted">{fmtDuration(r.avg)}</td>
              </tr>
            ))}
            {rows.length === 0 ? <tr><td colSpan={7} className="muted">No users yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
