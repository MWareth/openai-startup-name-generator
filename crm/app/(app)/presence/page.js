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

// Monday (UTC) of the week containing a YYYY-MM-DD date string.
function weekStartOf(dayStr) {
  const d = new Date(dayStr + 'T00:00:00Z');
  const dow = (d.getUTCDay() + 6) % 7; // 0 = Monday
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

export default async function PresencePage() {
  await requireStaff();
  const admin = createAdminClient();

  const [{ data: profiles }, { data: activity }] = await Promise.all([
    admin.from('profiles').select('id, full_name, avatar_url, role, login_count, last_login_at, last_seen_at').order('full_name'),
    admin.from('user_activity').select('user_id, day, seconds'),
  ]);

  // Aggregate: total + active days, and per-week seconds per user.
  const byUser = {};
  const byUserWeek = {};
  for (const r of activity || []) {
    const secs = Number(r.seconds || 0);
    const u = (byUser[r.user_id] ||= { total: 0, days: 0 });
    u.total += secs;
    if (secs > 0) u.days += 1;
    const wk = weekStartOf(r.day);
    (byUserWeek[r.user_id] ||= {})[wk] = (byUserWeek[r.user_id]?.[wk] || 0) + secs;
  }

  // The last 6 weeks (Mondays), current week first, in Dubai time.
  const todayDubai = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Dubai' }).format(new Date());
  const curWeek = weekStartOf(todayDubai);
  const weeks = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(curWeek + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 7 * i);
    const key = d.toISOString().slice(0, 10);
    const label = i === 0
      ? 'This week'
      : `${d.getUTCDate()} ${d.toLocaleString('en', { month: 'short', timeZone: 'UTC' })}`;
    weeks.push({ key, label });
  }

  const onlineCutoff = Date.now() - 5 * 60000;
  const rows = (profiles || []).map((p) => {
    const a = byUser[p.id] || { total: 0, days: 0 };
    const avg = a.days ? a.total / a.days : 0;
    const online = p.last_seen_at && new Date(p.last_seen_at).getTime() >= onlineCutoff;
    const thisWeek = byUserWeek[p.id]?.[curWeek] || 0;
    return { ...p, total: a.total, days: a.days, avg, online, thisWeek };
  });

  return (
    <div className="stack">
      <div>
        <h1>📊 Presence &amp; activity</h1>
        <p className="muted">
          Logins, last seen, and active time on the CRM. Active time counts only while the app is open and in use.
        </p>
      </div>

      {/* Overview */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>User</th>
              <th>Role</th>
              <th className="right">Logins</th>
              <th>Last seen</th>
              <th className="right">This week</th>
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
                <td className="right" style={{ fontWeight: 600 }}>{fmtDuration(r.thisWeek)}</td>
                <td className="right small">{r.days}</td>
                <td className="right">{fmtDuration(r.total)}</td>
                <td className="right small muted">{fmtDuration(r.avg)}</td>
              </tr>
            ))}
            {rows.length === 0 ? <tr><td colSpan={8} className="muted">No users yet.</td></tr> : null}
          </tbody>
        </table>
      </div>

      {/* Weekly breakdown */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <div style={{ padding: '14px 16px 0' }}>
          <h3 style={{ margin: 0 }}>Weekly active time</h3>
          <p className="small muted" style={{ margin: '4px 0 0' }}>Active time on the CRM per week (Mon–Sun), last 6 weeks.</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>User</th>
              {weeks.map((w) => <th key={w.key} className="right">{w.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                    <Avatar url={r.avatar_url} name={r.full_name} size="sm" />
                    <span>{r.full_name || '—'}</span>
                  </span>
                </td>
                {weeks.map((w, i) => {
                  const secs = byUserWeek[r.id]?.[w.key] || 0;
                  return (
                    <td key={w.key} className="right small" style={i === 0 ? { fontWeight: 600 } : { color: 'var(--muted)' }}>
                      {secs > 0 ? fmtDuration(secs) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))}
            {rows.length === 0 ? <tr><td colSpan={weeks.length + 1} className="muted">No activity yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
