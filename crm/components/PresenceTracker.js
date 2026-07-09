'use client';

import { useEffect, useRef } from 'react';

// Sends a heartbeat ~once a minute while the CRM tab is visible AND the user
// has interacted recently — so "time spent" reflects real active use, not a
// tab left open overnight. Each ping adds its interval to today's total.
export default function PresenceTracker({ intervalMs = 60000 }) {
  const lastActivity = useRef(Date.now());

  useEffect(() => {
    const bump = () => { lastActivity.current = Date.now(); };
    const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, bump, { passive: true }));

    const ping = () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      // Only count if there was interaction within the last two intervals.
      if (Date.now() - lastActivity.current > intervalMs * 2) return;
      fetch('/api/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds: Math.round(intervalMs / 1000) }),
        keepalive: true,
      }).catch(() => {});
    };

    ping(); // count this session starting now
    const id = setInterval(ping, intervalMs);
    return () => {
      clearInterval(id);
      events.forEach((e) => window.removeEventListener(e, bump));
    };
  }, [intervalMs]);

  return null;
}
