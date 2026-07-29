'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

export default function NavLink({ href, children }) {
  const pathname = usePathname();
  const search = useSearchParams();
  // Links that carry a query (the Cold calls / Follow-ups lead tabs) are only
  // active when that query actually matches — otherwise every /leads?… page
  // would light up all three tabs at once. Plain /leads stays active while a
  // tab is open only if no tab query is present.
  const [path, query] = href.split('?');
  const params = new URLSearchParams(query || '');
  let active = pathname === path || (path !== '/dashboard' && pathname.startsWith(path));
  if (active && [...params.keys()].length) {
    active = [...params.entries()].every(([k, v]) => search.get(k) === v);
  } else if (active && path === '/leads') {
    active = !search.get('origin');
  }
  return (
    <Link href={href} className={active ? 'active' : undefined}>
      {children}
    </Link>
  );
}
