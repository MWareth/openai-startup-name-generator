import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser, hasAdminAccess, hasStaffAccess, hasMarketingAccess } from '@/lib/auth';
import { ROLE_LABELS, SENIORITY_NAMES } from '@/lib/format';
import NavLink from '@/components/NavLink';
import NavGroup from '@/components/NavGroup';
import Avatar from '@/components/Avatar';
import PresenceTracker from '@/components/PresenceTracker';
import Sidebar from '@/components/Sidebar';
import RegisterServiceWorker from '@/components/RegisterServiceWorker';
import { currentWeek } from '@/lib/onboarding';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }) {
  const { user, profile, supabase } = await requireUser();

  // First login with a temporary password → force them to set their own first.
  if (profile?.must_change_password) redirect('/set-password');
  const isAdmin = hasAdminAccess(profile);
  const isStaff = hasStaffAccess(profile);
  const isMarketing = hasMarketingAccess(profile);
  const name = profile?.full_name || user.email;

  // Bell = pending items: informational ones you haven't seen, plus
  // action-required ones (assigned lead not yet contacted, SLA breach, admin
  // reminders, a test to take) that aren't resolved yet — those stay lit even
  // after you've seen them. Falls back to plain unread before migration 0026.
  let unread = 0;
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .or('and(requires_action.is.false,read_at.is.null),and(requires_action.is.true,resolved_at.is.null)');
    if (error) throw error;
    unread = count || 0;
  } catch (e) {
    const { count } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .is('read_at', null);
    unread = count || 0;
  }

  return (
    <div className="shell">
      <Sidebar>
        <div className="brand" style={{ padding: '0 0 14px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Bullish Team — Bridges & Allies" style={{ width: 185, maxWidth: '100%', height: 'auto' }} />
        </div>
        <nav className="nav">
          {/* Daily drivers — always visible, never buried. */}
          <NavLink href="/dashboard">Dashboard</NavLink>
          <NavLink href="/notifications">
            🔔 Notifications
            {unread ? (
              <span className="badge" style={{ background: 'var(--gold)', color: '#1a1407', marginLeft: 6 }}>{unread}</span>
            ) : null}
          </NavLink>
          <NavLink href="/leads">Leads</NavLink>
          <NavLink href="/projects">Projects</NavLink>
          <NavLink href="/content">🎬 Content Studio</NavLink>
          <NavLink href="/proposal">Proposal</NavLink>

          {/* Everything else lives in a group that opens itself when you're in it. */}
          {!isMarketing ? (
            <NavGroup
              label="My performance"
              hrefs={['/leaderboard', '/cold-calls', '/targets', '/training', '/onboarding']}
            >
              <NavLink href="/leaderboard">Leaderboard</NavLink>
              <NavLink href="/cold-calls">Cold Calls</NavLink>
              <NavLink href="/targets">My Targets</NavLink>
              <NavLink href="/training">Training</NavLink>
              {profile?.role === 'agent' && profile?.joined_on && currentWeek(profile.joined_on) <= 6 ? (
                <NavLink href="/onboarding">🌱 My Program</NavLink>
              ) : null}
            </NavGroup>
          ) : null}

          {isStaff || isMarketing ? (
            <NavGroup
              label="Reports"
              hrefs={['/marketing-report', '/one-on-one', '/reviews', '/activity']}
            >
              {isStaff || isMarketing ? <NavLink href="/marketing-report">📣 Marketing Report</NavLink> : null}
              {isAdmin ? <NavLink href="/one-on-one">📋 1:1 Report</NavLink> : null}
              {isAdmin ? <NavLink href="/reviews">KPIs</NavLink> : null}
              {isAdmin ? <NavLink href="/activity">Activity log</NavLink> : null}
            </NavGroup>
          ) : null}

          {isStaff ? (
            <NavGroup label="Manage" hrefs={['/teams', '/commission', '/presence', '/admin']}>
              <NavLink href="/teams">Teams</NavLink>
              <NavLink href="/commission">Commission</NavLink>
              <NavLink href="/presence">Presence</NavLink>
              <NavLink href="/admin/projects">🏗️ Project names</NavLink>
              {isAdmin ? <NavLink href="/admin">Admin</NavLink> : null}
            </NavGroup>
          ) : null}
        </nav>
        <div className="sidebar-foot">
          {/* The avatar block IS the profile link now — one less tab in the menu. */}
          <Link href="/profile" className="row" style={{ gap: 8, flexWrap: 'nowrap', color: 'inherit', textDecoration: 'none' }}>
            <Avatar url={profile?.avatar_url} name={name} size="md" />
            <div style={{ minWidth: 0 }}>
              <div className="small" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
              <div className="small muted">
                {ROLE_LABELS[profile?.role] || profile?.role}
                {profile?.role === 'agent' ? ` · ${SENIORITY_NAMES[profile?.seniority] || profile?.seniority}` : ''}
              </div>
              <div className="small" style={{ color: 'var(--gold, var(--brand))' }}>My Profile →</div>
            </div>
          </Link>
          <form action="/auth/signout" method="post" style={{ marginTop: 10 }}>
            <button className="btn ghost small" type="submit">Sign out</button>
          </form>
        </div>
      </Sidebar>
      <main className="content">
        <div className="topbar">
          <Link href="/notifications" className="bell" aria-label="Notifications" title="Notifications">
            <span className="bell-icon">🔔</span>
            {unread ? <span className="bell-count">{unread > 99 ? '99+' : unread}</span> : null}
          </Link>
        </div>
        {children}
      </main>
      <PresenceTracker />
      <RegisterServiceWorker />
    </div>
  );
}
