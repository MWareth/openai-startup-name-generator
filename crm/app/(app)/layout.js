import { requireUser, hasAdminAccess } from '@/lib/auth';
import { ROLE_LABELS, SENIORITY_LABELS } from '@/lib/format';
import NavLink from '@/components/NavLink';
import Avatar from '@/components/Avatar';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const { user, profile } = await requireUser();
  const isAdmin = hasAdminAccess(profile);
  const name = profile?.full_name || user.email;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          Estate<span>CRM</span>
        </div>
        <nav className="nav">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/leads">Leads</NavLink>
          <NavLink href="/leaderboard">Leaderboard</NavLink>
          <NavLink href="/targets">My Targets</NavLink>
          {isAdmin ? <NavLink href="/admin">Admin</NavLink> : null}
        </nav>
        <div className="sidebar-foot">
          <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
            <Avatar url={profile?.avatar_url} name={name} size="md" />
            <div style={{ minWidth: 0 }}>
              <div className="small" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
              <div className="small muted">
                {ROLE_LABELS[profile?.role] || profile?.role}
                {profile?.role === 'agent' ? ` · ${SENIORITY_LABELS[profile?.seniority] || profile?.seniority}` : ''}
              </div>
            </div>
          </div>
          <form action="/auth/signout" method="post" style={{ marginTop: 10 }}>
            <button className="btn ghost small" type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
