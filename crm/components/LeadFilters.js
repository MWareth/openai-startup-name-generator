'use client';

import { useEffect, useRef, useState } from 'react';
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
  { v: 'name', l: 'Name: A → Z' },
  { v: 'name_desc', l: 'Name: Z → A' },
  { v: 'budget_high', l: 'Budget: high → low' },
  { v: 'budget_low', l: 'Budget: low → high' },
];

export default function LeadFilters({ agents, values, names = [] }) {
  const router = useRouter();
  const [name, setName] = useState(values.name || '');
  const timer = useRef(null);

  // Keep the local box in sync when the URL changes elsewhere (e.g. Clear).
  useEffect(() => {
    setName(values.name || '');
  }, [values.name]);

  function buildAndPush(nextValues, replace = false) {
    const params = new URLSearchParams();
    Object.entries(nextValues).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    const qs = params.toString();
    const url = qs ? `/leads?${qs}` : '/leads';
    if (replace) router.replace(url);
    else router.push(url);
  }

  function update(key, val) {
    buildAndPush({ ...values, name, [key]: val });
  }

  // Debounce the name search so we don't navigate on every keystroke.
  function onNameChange(val) {
    setName(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => buildAndPush({ ...values, name: val }, true), 350);
  }

  function onNameEnter(e) {
    if (e.key === 'Enter') {
      if (timer.current) clearTimeout(timer.current);
      buildAndPush({ ...values, name });
    }
  }

  function clearAll() {
    if (timer.current) clearTimeout(timer.current);
    setName('');
    router.push('/leads');
  }

  const bind = (key) => ({
    value: values[key] || '',
    onChange: (e) => update(key, e.target.value),
  });

  const cell = { minWidth: 130, flex: '1 1 130px' };

  return (
    <div className="card">
      <div className="row" style={{ gap: 10, alignItems: 'flex-end' }}>
        <div style={{ minWidth: 190, flex: '2 1 190px' }}>
          <label>Client name</label>
          <input
            type="search"
            placeholder="Type a name to search…"
            value={name}
            list="lead-name-options"
            autoComplete="off"
            onChange={(e) => onNameChange(e.target.value)}
            onKeyDown={onNameEnter}
          />
          <datalist id="lead-name-options">
            {names.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </div>
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
        <button type="button" className="btn ghost small" onClick={clearAll}>
          Clear
        </button>
      </div>
    </div>
  );
}
