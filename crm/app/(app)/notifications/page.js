import { requireUser } from '@/lib/auth';
import { formatDate } from '@/lib/format';
import { markAllRead, clearRead, openNotification, markSeenOnView } from './actions';
import MarkSeenOnMount from '@/components/MarkSeenOnMount';

export const dynamic = 'force-dynamic';

function timeAgo(ts) {
  if (!ts) return '';
  const diff = (Date.now() - new Date(ts).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return formatDate(ts);
}

export default async function NotificationsPage({ searchParams }) {
  const { user, supabase } = await requireUser();
  const ok = searchParams?.ok;

  const { data: items } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100);

  const unread = (items || []).filter((n) => !n.read_at).length;
  // Still-open action items keep the bell lit even once seen.
  const actionNeeded = (items || []).filter((n) => n.requires_action && !n.resolved_at).length;

  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      {/* Opening this page marks everything seen; the bell then shows only the
          action items still outstanding. */}
      <MarkSeenOnMount action={markSeenOnView} />
      <div className="spread">
        <div>
          <h1>Notifications</h1>
          <p className="muted">
            {actionNeeded
              ? `${actionNeeded} need${actionNeeded === 1 ? 's' : ''} action`
              : 'You’re all caught up.'}
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {unread ? (
            <form action={markAllRead}><button className="btn secondary small" type="submit">Mark all read</button></form>
          ) : null}
          <form action={clearRead}><button className="btn ghost small" type="submit">Clear read</button></form>
        </div>
      </div>
      {ok ? <div className="alert ok">{ok}</div> : null}

      <div className="card" style={{ padding: 0 }}>
        {items && items.length ? (
          <div>
            {items.map((n) => (
              <div
                key={n.id}
                className="spread"
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: n.read_at ? 'transparent' : 'var(--panel-2)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: n.read_at ? 500 : 700 }}>
                    {!n.read_at ? <span style={{ color: 'var(--gold)' }}>● </span> : null}
                    {n.title}
                    {n.requires_action && !n.resolved_at ? (
                      <span className="badge lost" style={{ marginLeft: 8, verticalAlign: 'middle' }}>Action needed</span>
                    ) : null}
                  </div>
                  {n.body ? <div className="small muted">{n.body}</div> : null}
                  <div className="small muted">{timeAgo(n.created_at)}</div>
                </div>
                {n.link ? (
                  <form action={openNotification}>
                    <input type="hidden" name="id" value={n.id} />
                    <input type="hidden" name="link" value={n.link} />
                    <button className="btn small" type="submit">Open</button>
                  </form>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <p className="muted" style={{ padding: 18 }}>No notifications yet. When a lead is assigned to you, it’ll show up here.</p>
        )}
      </div>
    </div>
  );
}
