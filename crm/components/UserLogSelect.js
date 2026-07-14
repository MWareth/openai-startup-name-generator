'use client';

import { useRouter } from 'next/navigation';

// Dropdown to pick whose activity record to view on the Activity Log.
export default function UserLogSelect({ agents, value, period }) {
  const router = useRouter();
  return (
    <select
      value={value || ''}
      style={{ minWidth: 200 }}
      onChange={(e) => {
        const qs = new URLSearchParams();
        if (e.target.value) qs.set('agent', e.target.value);
        if (period) qs.set('period', period);
        const s = qs.toString();
        router.push('/activity' + (s ? `?${s}` : ''));
      }}
    >
      <option value="">All users</option>
      {agents.map((a) => (
        <option key={a.id} value={a.id}>{a.full_name}</option>
      ))}
    </select>
  );
}
