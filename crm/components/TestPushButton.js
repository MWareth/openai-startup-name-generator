'use client';

import { useState } from 'react';

// Sends the current user a test push and shows the result inline, so they can
// tell exactly whether push reaches THIS device. Always resets — a slow or
// failed send can never leave it stuck on "Sending…".
export default function TestPushButton({ action }) {
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    if (busy) return;
    setBusy(true);
    setMsg(null);
    // Watchdog: if the server doesn't answer in 20s, un-freeze with a message.
    const watchdog = setTimeout(() => {
      setBusy(false);
      setMsg({ error: 'Timed out waiting for the server. Check your connection and try again.' });
    }, 20000);
    try {
      const res = await action();
      clearTimeout(watchdog);
      setMsg(res || { error: 'No response from the server.' });
    } catch (e) {
      clearTimeout(watchdog);
      setMsg({ error: 'Could not send: ' + (e?.message || 'unknown error') });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ gap: 6 }}>
      <button className="btn secondary" type="button" disabled={busy} onClick={run}>
        {busy ? 'Sending…' : '📨 Send myself a test notification'}
      </button>
      {msg?.ok ? <p className="small" style={{ color: 'var(--good, #16a34a)' }}>{msg.ok}</p> : null}
      {msg?.error ? <p className="small" style={{ color: '#dc2626' }}>{msg.error}</p> : null}
    </div>
  );
}
