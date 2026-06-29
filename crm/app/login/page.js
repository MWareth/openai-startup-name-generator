import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

async function signIn(formData) {
  'use server';
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect('/login?error=' + encodeURIComponent(error.message));
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

export default function LoginPage({ searchParams }) {
  const error = searchParams?.error;
  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="brand" style={{ padding: '0 0 18px', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Bullish Team — Bridges & Allies" style={{ width: '100%', maxWidth: 230, height: 'auto' }} />
        </div>
        <h2>Sign in</h2>
        {error ? <div className="alert error">{error}</div> : null}
        <form action={signIn}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete="current-password" required />
          </div>
          <button className="btn" type="submit" style={{ width: '100%' }}>
            Sign in
          </button>
        </form>
        <p className="muted small" style={{ marginTop: 14 }}>
          Accounts are created by your administrator.
        </p>
      </div>
    </div>
  );
}
