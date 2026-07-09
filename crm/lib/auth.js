import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Returns { user, profile } for the signed-in user, or redirects to /login.
export async function requireUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return { user, profile, supabase };
}

// Roles with full owner-level access (monitor everything + edit). The owner is
// 'admin'; Director and C-Suite are oversight roles granted the same powers.
export const ADMIN_ROLES = ['admin', 'director', 'c_suite'];

export function hasAdminAccess(profile) {
  return !!profile && ADMIN_ROLES.includes(profile.role);
}

export async function requireAdmin() {
  const ctx = await requireUser();
  if (!hasAdminAccess(ctx.profile)) redirect('/dashboard');
  return ctx;
}

// Roles allowed to see the commission-collection queue: owner-admins + support.
export const STAFF_ROLES = ['admin', 'director', 'c_suite', 'support'];

export function hasStaffAccess(profile) {
  return !!profile && STAFF_ROLES.includes(profile.role);
}

export async function requireStaff() {
  const ctx = await requireUser();
  if (!hasStaffAccess(ctx.profile)) redirect('/dashboard');
  return ctx;
}

// Marketing: feeds & triages leads (see all, note, qualify, route, flag fakes),
// but no money (deals/commission/targets).
export function hasMarketingAccess(profile) {
  return !!profile && profile.role === 'marketing';
}

// Roles that can see ALL leads and route them to any agent / the pool: staff
// (admin + support + oversight) plus marketing. NOT a money permission.
export function canRouteLeads(profile) {
  return hasStaffAccess(profile) || hasMarketingAccess(profile);
}
