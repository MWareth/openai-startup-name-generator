import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return (
    <div className="login-wrap">
      <div className="card login-card">
        <div className="brand" style={{ padding: '0 0 18px', textAlign: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Bullish Team — Bridges & Allies" style={{ width: '100%', maxWidth: 230, height: 'auto' }} />
        </div>
        <h2>Sign in</h2>
        <LoginForm />
        <p className="muted small" style={{ marginTop: 14 }}>
          Accounts are created by your administrator.
        </p>
      </div>
    </div>
  );
}
