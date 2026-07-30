'use client';

import { useEffect } from 'react';

// Puts the member's theme on <html> so the CSS token overrides take effect.
// An inline script runs it before paint (no flash of the wrong colours on a
// hard refresh); the effect keeps it in sync on client-side navigation.
export default function ThemeApply({ theme = 'light' }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme || 'light');
  }, [theme]);

  return (
    <script
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{
        __html:
          `document.documentElement.setAttribute('data-theme',${JSON.stringify(theme || 'light')});` +
          // Restore the collapsed menu before first paint, so it never flashes
          // open and then snap shut on every page load.
          `try{if(localStorage.getItem('crm.menuCollapsed')==='1')document.documentElement.classList.add('menu-collapsed')}catch(e){}`,
      }}
    />
  );
}
