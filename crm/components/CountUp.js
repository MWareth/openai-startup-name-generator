'use client';

import { useEffect, useRef, useState } from 'react';

// Counts a stat up to its value when the card scrolls into view. Small touch,
// but it makes the dashboard read as live data rather than a printed page.
// Falls back to the plain number if the browser can't do it, and respects the
// OS "reduce motion" setting.
export default function CountUp({ value, prefix = '', suffix = '', duration = 700 }) {
  const target = Number(value) || 0;
  const [shown, setShown] = useState(target);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reduce || !('IntersectionObserver' in window) || target === 0) {
      setShown(target);
      return;
    }

    const node = ref.current;
    if (!node) return;
    setShown(0);

    const run = () => {
      if (started.current) return;
      started.current = true;
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / duration);
        // ease-out: fast start, gentle landing
        const eased = 1 - Math.pow(1 - p, 3);
        setShown(Math.round(target * eased));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && run()),
      { threshold: 0.2 }
    );
    io.observe(node);
    return () => io.disconnect();
  }, [target, duration]);

  return (
    <span ref={ref}>
      {prefix}
      {shown.toLocaleString()}
      {suffix}
    </span>
  );
}
