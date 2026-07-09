'use client';

import { useState } from 'react';

// Clickable 1–5 star rating for the KPI scorecard. Submits its value in a hidden
// input named `name`; empty value = N/A (not applicable, excluded from the score).
// Click a star to set it; click "N/A" (or the selected star again) to clear.
export default function StarRating({ name, defaultValue = '' }) {
  const [value, setValue] = useState(defaultValue ? Number(defaultValue) : 0);
  const [hover, setHover] = useState(0);
  const active = hover || value;

  return (
    <div className="kpi-stars">
      <input type="hidden" name={name} value={value || ''} />
      <div className="stars" role="radiogroup" aria-label={name}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            className="star"
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            aria-pressed={value === n}
            onClick={() => setValue(n === value ? 0 : n)}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            style={{ color: n <= active ? 'var(--gold)' : 'var(--border)' }}
          >
            ★
          </button>
        ))}
      </div>
      <button
        type="button"
        className={`na-btn${value ? '' : ' on'}`}
        onClick={() => setValue(0)}
        title="Not applicable"
      >
        N/A
      </button>
    </div>
  );
}
