'use client';

import { usePathname } from 'next/navigation';

// A collapsible sidebar section. Stays closed to keep the menu short, but opens
// itself automatically when the page you're on lives inside it — so you never
// have to hunt for where you already are.
export default function NavGroup({ label, hrefs = [], children, defaultOpen = false }) {
  const pathname = usePathname();
  const holdsCurrent = hrefs.some((h) => pathname === h || pathname.startsWith(h + '/'));

  return (
    <details className="nav-group" open={holdsCurrent || defaultOpen}>
      <summary>{label}</summary>
      <div className="nav-group-items">{children}</div>
    </details>
  );
}
