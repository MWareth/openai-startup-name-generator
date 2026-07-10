'use client';

import { useEffect } from 'react';

// Registers the push service worker on every app load so it stays active and
// picks up new versions of /sw.js — otherwise a device that enabled push long
// ago can silently stop receiving it after an update.
export default function RegisterServiceWorker() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // ignore — push just won't be available on this device
    });
  }, []);
  return null;
}
