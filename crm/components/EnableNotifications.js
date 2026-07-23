'use client';

import { useEffect, useState } from 'react';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export default function EnableNotifications({ vapidPublicKey }) {
  const [status, setStatus] = useState('checking'); // checking | idle | subscribed | working | denied | unsupported

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      setStatus('unsupported');
      return;
    }
    navigator.serviceWorker
      .getRegistration()
      .then((reg) => (reg ? reg.pushManager.getSubscription() : null))
      .then((sub) => setStatus(sub ? 'subscribed' : 'idle'))
      .catch(() => setStatus('idle'));
  }, []);

  async function enable() {
    try {
      setStatus('working');
      if (!vapidPublicKey) {
        alert('Notifications are not configured yet. Ask the admin to add the VAPID key.');
        setStatus('idle');
        return;
      }
      // iOS Safari voids the tap-gesture after any await — if the permission
      // prompt isn't the FIRST thing we ask for, iPhones silently deny without
      // ever showing it. So: permission first, service worker after.
      const perm = await Notification.requestPermission();
      if (perm !== 'granted') {
        setStatus('denied');
        return;
      }
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...sub.toJSON(), ua: navigator.userAgent }),
      });
      if (!res.ok) throw new Error('Could not save subscription');
      setStatus('subscribed');
      window.dispatchEvent(new Event('push-changed'));
    } catch (e) {
      alert('Could not enable notifications: ' + (e?.message || e));
      setStatus('idle');
    }
  }

  async function disable() {
    try {
      setStatus('working');
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg ? await reg.pushManager.getSubscription() : null;
      if (sub) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setStatus('idle');
      window.dispatchEvent(new Event('push-changed'));
    } catch (e) {
      setStatus('subscribed');
    }
  }

  if (status === 'unsupported') {
    return (
      <p className="small muted">
        Notifications aren&apos;t available here. On iPhone, first <strong>Add to Home Screen</strong> and open the app from there.
      </p>
    );
  }

  return (
    <div className="stack" style={{ gap: 8 }}>
      {status === 'subscribed' ? (
        <button className="btn secondary" type="button" onClick={disable} disabled={status === 'working'}>
          🔕 Turn off notifications on this device
        </button>
      ) : (
        <button className="btn" type="button" onClick={enable} disabled={status === 'working' || status === 'checking'}>
          🔔 Enable notifications on this device
        </button>
      )}
      {status === 'denied' ? (
        <p className="small muted">Permission is blocked. Allow notifications in your browser/site settings, then try again.</p>
      ) : null}
      <p className="small muted">Get pinged for new leads assigned to you and follow-ups due today.</p>
    </div>
  );
}
