'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

// On mount, mark the user's notifications as seen (a server action), then
// refresh so the bell recomputes to just the still-pending action items.
export default function MarkSeenOnMount({ action }) {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    (async () => {
      try {
        await action();
      } catch (e) {
        // ignore — worst case the bell updates on the next navigation
      }
      router.refresh();
    })();
  }, [action, router]);

  return null;
}
