'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// A collapsible sidebar section.
//
// The open state is controlled and remembered per section, because a plain
// `<details open={…}>` in React gets stuck: once you toggle it by hand React
// stops re-applying the prop, so a section you closed once stays closed even
// after navigating into it. Your choice is kept per section, and a section
// containing the page you're on always opens regardless.
export default function NavGroup({ label, hrefs = [], children, defaultOpen = false }) {
  const pathname = usePathname();
  const holdsCurrent = hrefs.some((h) => pathname === h || pathname.startsWith(h + '/'));
  const key = `crm.nav.${label}`;

  const [open, setOpen] = useState(holdsCurrent || defaultOpen);

  useEffect(() => {
    if (holdsCurrent) {
      setOpen(true); // never hide the section you're standing in
      return;
    }
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) setOpen(saved === '1');
    } catch {}
  }, [holdsCurrent, key]);

  function onToggle(e) {
    const next = e.currentTarget.open;
    if (next === open) return;
    setOpen(next);
    try {
      localStorage.setItem(key, next ? '1' : '0');
    } catch {}
  }

  return (
    <details className="nav-group" open={open} onToggle={onToggle}>
      <summary>{label}</summary>
      <div className="nav-group-items">{children}</div>
    </details>
  );
}
