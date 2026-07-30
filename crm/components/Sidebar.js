'use client';

import { useEffect, useState } from 'react';

// App sidebar. On desktop it's the fixed left column (unchanged). On phones it
// becomes an off-canvas drawer opened by a ☰ hamburger in a top bar; tapping a
// menu item, the ✕, or the dimmed backdrop closes it.
export default function Sidebar({ children }) {
  const [open, setOpen] = useState(false);          // phone drawer
  const [collapsed, setCollapsed] = useState(false); // desktop: menu tucked away

  // The class is applied pre-paint by the inline script in ThemeApply so the
  // menu doesn't flash open on load; this just syncs React's copy of it.
  useEffect(() => {
    try {
      setCollapsed(document.documentElement.classList.contains('menu-collapsed'));
    } catch {}
  }, []);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.documentElement.classList.toggle('menu-collapsed', next);
    try {
      localStorage.setItem('crm.menuCollapsed', next ? '1' : '0');
    } catch {}
  }

  return (
    <>
      <div className="mobile-bar">
        <button className="hamburger" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
          ☰
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Bullish Team — Bridges & Allies" className="mobile-logo" />
      </div>

      {/* Desktop: bring the menu back once it's tucked away. */}
      <button
        className="menu-reopen"
        aria-label="Show menu"
        title="Show menu"
        onClick={toggleCollapsed}
      >
        ☰
      </button>

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
        {/* Desktop only — gives the whole screen to the table when you want it. */}
        <button className="menu-collapse" onClick={toggleCollapsed} title="Hide the menu">
          ⟨ Hide menu
        </button>
      </aside>
    </>
  );
}
