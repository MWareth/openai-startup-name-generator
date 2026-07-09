'use client';

import { useEffect } from 'react';

// Error boundary for the app. Instead of a raw white "client-side exception"
// screen, show a friendly card with a Reload button (which reliably recovers
// from a mid-deploy code mismatch) and the underlying message to help debugging.
export default function AppError({ error, reset }) {
  useEffect(() => {
    // Surface to the console for debugging.
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="card" style={{ maxWidth: 560, margin: '48px auto' }}>
      <h2 style={{ marginTop: 0 }}>Something went wrong</h2>
      <p className="small muted">
        The page hit an error. This is usually a temporary hiccup after an update — tap
        <strong> Reload</strong> and it should work. If it keeps happening, let us know what you were doing.
      </p>
      {error?.message ? (
        <p className="small" style={{ color: 'var(--red)', wordBreak: 'break-word', background: 'var(--panel-2)', padding: '8px 10px', borderRadius: 8 }}>
          {error.message}
        </p>
      ) : null}
      <div className="row" style={{ gap: 8, marginTop: 10 }}>
        <button className="btn" onClick={() => reset()}>Try again</button>
        <button className="btn secondary" onClick={() => window.location.reload()}>Reload page</button>
      </div>
    </div>
  );
}
