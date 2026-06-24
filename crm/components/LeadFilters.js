'use client';

import { useRouter } from 'next/navigation';
import { PROPERTY_TYPES, BEDROOM_OPTIONS, QUAL_LABELS, STATUS_LABELS } from '@/lib/format';

const BUDGETS = [
  { v: '', l: 'Any budget' },
  { v: 'lt1m', l: 'Under 1M' },
  { v: '1-2m', l: '1M – 2M' },
  { v: '2-5m', l: '2M – 5M' },
  { v: '5m+', l: '5M +' },
];

const SORTS = [
  { v: 'recent', l: 'Recently updated' },
  { v: 'new', l: 'Newest first' },
  { v: 'old', l: 'Oldest first' },
  { v: 'budget_high', l: 'Budget: high → low' },
  { v: 'budget_low', l: 'Budget: low → high' },
];

export default function LeadFilters({ agents, values }) {
  const router = useRouter();

  function update(key, val) {
    const next = { ...values, [key]: val };
    const params = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    router.push(qs ? `/leads?${qs}` : '/leads');
  }

  const bind = (key) => ({
    value: values[key] || '',
    onChange: (e) => update(key, e.target.value),
  });

  const cell = { minWidth: 130, flex: '1 1 130px' };

  return (
    <div className="card">
      <div className="row" style={{ gap: 10, alignItems: 'flex-end' }}>
        <div style={cell}>
          <label>Agent</label>
          <select {...bind('agent')}>
            <option value="">All agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.full_name}</option>
            ))}
          </select>
        </div>
        <div style={cell}>
          <label>Type</label>
          <select {...bind('type')}>
            <option value="">All types</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div style={cell}>
          <label>Bedrooms</label>
          <select {...bind('beds')}>
            <option value="">All bedrooms</option>
            {BEDROOM_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
        <div style={cell}>
          <label>Qualification</label>
          <select {...bind('qual')}>
            <option value="">All</option>
            {Object.entries(QUAL_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div style={cell}>
          <label>Status</label>
          <select {...bind('status')}>
            <option value="">All</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
        <div style={cell}>
          <label>Budget (AED)</label>
          <select {...bind('budget')}>
            {BUDGETS.map((b) => (
              <option key={b.v} value={b.v}>{b.l}</option>
            ))}
          </select>
        </div>
        <div style={cell}>
          <label>Sort by</label>
          <select {...bind('sort')}>
            {SORTS.map((s) => (
              <option key={s.v} value={s.v}>{s.l}</option>
            ))}
          </select>
        </div>
        <button type="button" className="btn ghost small" onClick={() => router.push('/leads')}>
          Clear
        </button>
      </div>
    </div>
  );
}
