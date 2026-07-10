'use client';

import { useState, useTransition } from 'react';

// Sends the current user a test push and shows the result inline, so they can
// tell exactly whether push reaches THIS device.
export default function TestPushButton({ action }) {
  const [msg, setMsg] = useState(null);
  const [pending, start] = useTransition();

  return (
    <div className="stack" style={{ gap: 6 }}>
      <button
        className="btn secondary"
        type="button"
        disabled={pending}
        onClick={() => start(async () => setMsg(await action()))}
      >
        {pending ? 'Sending…' : '📨 Send myself a test notification'}
      </button>
      {msg?.ok ? <p className="small" style={{ color: 'var(--good, #16a34a)' }}>{msg.ok}</p> : null}
      {msg?.error ? <p className="small" style={{ color: '#dc2626' }}>{msg.error}</p> : null}
    </div>
  );
}
