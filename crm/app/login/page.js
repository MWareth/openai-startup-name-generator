import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

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
