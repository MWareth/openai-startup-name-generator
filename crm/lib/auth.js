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

export async function requireAdmin() {
  const ctx = await requireUser();
  if (!ctx.profile || ctx.profile.role !== 'admin') redirect('/dashboard');
  return ctx;
}
