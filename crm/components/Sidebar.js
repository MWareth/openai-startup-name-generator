'use client';

import { useState } from 'react';

// App sidebar. On desktop it's the fixed left column (unchanged). On phones it
// becomes an off-canvas drawer opened by a ☰ hamburger in a top bar; tapping a
// menu item, the ✕, or the dimmed backdrop closes it.
export default function Sidebar({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="mobile-bar">
        <button className="hamburger" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
          ☰
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Bullish Team — Bridges & Allies" className="mobile-logo" />
      </div>

      <div className={`sidebar-backdrop${open ? ' show' : ''}`} onClick={() => setOpen(false)} />

      <aside
        className={`sidebar${open ? ' open' : ''}`}
        onClick={(e) => {
          // Close the drawer when a navigation link is tapped.
          const t = e.target;
          if (t && t.closest && t.closest('a')) setOpen(false);
        }}
      >
        <button className="sidebar-close" aria-label="Close menu" onClick={() => setOpen(false)}>
          ✕
        </button>
        {children}
      </aside>
    </>
  );
}
