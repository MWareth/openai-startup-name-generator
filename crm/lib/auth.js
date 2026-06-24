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
