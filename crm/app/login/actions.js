'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Sign-in action for useFormState: returns { error } on failure (shown inline,
// no redirect — so the message reliably appears on iOS Safari / PWA too), and
// redirects to the dashboard on success.
export async function signIn(prevState, formData) {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  if (!email || !password) return { error: 'Enter your email and password.' };

  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const msg = /invalid login credentials/i.test(error.message || '')
      ? 'Wrong email or password. Please try again.'
      : error.message;
    return { error: msg };
  }

  // Count the login (for the management Presence view).
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const admin = createAdminClient();
    const { data: prof } = await admin.from('profiles').select('login_count').eq('id', user.id).single();
    const now = new Date().toISOString();
    await admin
      .from('profiles')
      .update({ login_count: (prof?.login_count || 0) + 1, last_login_at: now, last_seen_at: now })
      .eq('id', user.id);
  }

  redirect('/dashboard');
}
