'use client';

import { useState } from 'react';

// Tap-to-pick date field. Renders a native date input, so tapping it opens the
// device's calendar picker (no typing needed) and it submits an ISO yyyy-mm-dd
// value under `name` — exactly what the server actions expect. On desktop you
// can still type into it; on phones it shows the calendar/wheel.
//
// When min/max are given the value is clamped in state, not just hinted via
// attributes — iOS wheel pickers ignore min/max, so an out-of-range pick snaps
// back to the nearest allowed date the moment it lands.
export default function DateField({ name, defaultValue = '', className, style, min, max }) {
  const clamp = (v) => {
    if (!v) return v;
    if (max && v > max) return max;
    if (min && v < min) return min;
    return v;
  };
  const [value, setValue] = useState(clamp(defaultValue || ''));

  return (
    <input
      type="date"
      name={name}
      value={value}
      onChange={(e) => setValue(clamp(e.target.value))}
      onBlur={(e) => setValue(clamp(e.target.value))}
      className={className}
      style={style}
      min={min}
      max={max}
    />
  );
}
