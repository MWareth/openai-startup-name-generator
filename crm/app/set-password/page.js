import { requireUser } from '@/lib/auth';
import { changeMyPassword } from './actions';

export const dynamic = 'force-dynamic';

export default async function SetPasswordPage({ searchParams }) {
  const { profile, user } = await requireUser();
  const firstName = profile?.full_name?.split(' ')[0] || '';

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 20px' }}>
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Set your password 🔐</h1>
        <p className="muted small">
          Welcome{firstName ? `, ${firstName}` : ''}! The password your admin gave you was temporary.
          For your security, please choose your own password before you start.
        </p>
        {searchParams?.error ? <div className="alert error">{searchParams.error}</div> : null}
        <form action={changeMyPassword} className="stack" style={{ gap: 12 }}>
          <input type="hidden" name="back" value="/set-password" />
          <input type="hidden" name="next" value="/dashboard" />
          <div className="field">
            <label>New password</label>
            <input name="password" type="password" minLength={6} required placeholder="At least 6 characters" autoFocus />
          </div>
          <button className="btn" type="submit">Save password &amp; continue</button>
        </form>
      </div>
    </div>
  );
}
