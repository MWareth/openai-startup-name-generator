import { redirect } from 'next/navigation';
import { requireUser, hasAdminAccess, hasStaffAccess } from '@/lib/auth';
import { ROLE_LABELS, SENIORITY_NAMES } from '@/lib/format';
import NavLink from '@/components/NavLink';
import Avatar from '@/components/Avatar';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const { user, profile } = await requireUser();

  // First login with a temporary password → force them to set their own first.
  if (profile?.must_change_password) redirect('/set-password');
  const isAdmin = hasAdminAccess(profile);
  const isStaff = hasStaffAccess(profile);
  const name = profile?.full_name || user.email;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand" style={{ padding: '0 0 14px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Bullish Team — Bridges & Allies" style={{ width: 185, maxWidth: '100%', height: 'auto' }} />
        </div>
        <nav className="nav">
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/leads">Leads</NavLink>
          <NavLink href="/projects">Projects</NavLink>
          <NavLink href="/proposal">Proposal</NavLink>
          <NavLink href="/leaderboard">Leaderboard</NavLink>
          <NavLink href="/cold-calls">Cold Calls</NavLink>
          <NavLink href="/targets">My Targets</NavLink>
          <NavLink href="/profile">My Profile</NavLink>
          {isStaff ? <NavLink href="/commission">Commission</NavLink> : null}
          {isStaff ? <NavLink href="/teams">Teams</NavLink> : null}
          {isAdmin ? <NavLink href="/reviews">Reviews</NavLink> : null}
          {isAdmin ? <NavLink href="/admin">Admin</NavLink> : null}
        </nav>
        <div className="sidebar-foot">
          <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
            <Avatar url={profile?.avatar_url} name={name} size="md" />
            <div style={{ minWidth: 0 }}>
              <div className="small" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
              <div className="small muted">
                {ROLE_LABELS[profile?.role] || profile?.role}
                {profile?.role === 'agent' ? ` · ${SENIORITY_NAMES[profile?.seniority] || profile?.seniority}` : ''}
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
