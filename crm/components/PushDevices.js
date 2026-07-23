'use client';

import { useCallback, useEffect, useState } from 'react';

// Shows the user which devices are actually registered for push — the answer
// to "sent to 2 devices, what 2 devices?". Flags whether THIS device is one of
// them, and lets the user remove stale registrations from old installs.

function deviceLabel(endpoint, ua) {
  let host = '';
  try { host = new URL(endpoint).host; } catch (e) { /* ignore */ }
  let label = 'Unknown device';
  if (host.includes('push.apple.com')) label = '📱 iPhone / iPad (Safari app)';
  else if (host.includes('fcm.googleapis.com')) label = '🤖 Android (Chrome)';
  else if (host.includes('mozilla')) label = '🦊 Firefox';
  else if (host.includes('windows.com')) label = '💻 Windows (Edge)';
  if (ua) {
    if (/iphone/i.test(ua)) label = '📱 iPhone (Safari app)';
    else if (/ipad/i.test(ua)) label = '📱 iPad (Safari app)';
    else if (/samsung|sm-/i.test(ua)) label = '🤖 Samsung';
    else if (/android/i.test(ua)) label = '🤖 Android';
    else if (/macintosh/i.test(ua)) label = '💻 Mac';
    else if (/windows/i.test(ua)) label = '💻 Windows PC';
  }
  return label;
}

export default function PushDevices() {
  const [devices, setDevices] = useState(null);
  const [current, setCurrent] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/push/devices');
      const json = await res.json();
      setDevices(json.devices || []);
    } catch (e) {
      setDevices([]);
    }
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      setCurrent(sub?.endpoint || null);
    } catch (e) {
      setCurrent(null);
    }
  }, []);

  useEffect(() => {
    load();
    window.addEventListener('push-changed', load);
    return () => window.removeEventListener('push-changed', load);
  }, [load]);

  async function remove(endpoint) {
    if (busy) return;
    setBusy(true);
    try {
      await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint }),
      });
      if (endpoint === current) {
        try {
          const reg = await navigator.serviceWorker?.getRegistration();
          const sub = reg ? await reg.pushManager.getSubscription() : null;
          if (sub) await sub.unsubscribe();
        } catch (e) { /* best-effort */ }
      }
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (devices === null) return null;

  const thisRegistered = current && devices.some((d) => d.endpoint === current);

  return (
    <div className="stack" style={{ gap: 6, marginTop: 8 }}>
      <div className="small muted">Registered devices ({devices.length}):</div>
      {devices.length ? (
        devices.map((d) => (
          <div key={d.endpoint} className="row" style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="small">
              {deviceLabel(d.endpoint, d.ua)}
              {d.endpoint === current ? <strong> — this device ✅</strong> : null}
              <span className="muted"> · added {new Date(d.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
            </span>
            <button className="btn secondary small" type="button" disabled={busy} onClick={() => remove(d.endpoint)}>
              Remove
            </button>
          </div>
        ))
      ) : (
        <p className="small muted">No devices registered yet.</p>
      )}
      {devices.length && !thisRegistered ? (
        <p className="small" style={{ color: '#dc2626' }}>
          ⚠️ The device you&apos;re holding is NOT one of them — tests go to the devices above, not here.
          Remove the stale ones and tap “Enable notifications” on this device.
        </p>
      ) : null}
    </div>
  );
}
