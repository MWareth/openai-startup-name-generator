'use client';

// Tap-to-pick date field. Renders a native date input, so tapping it opens the
// device's calendar picker (no typing needed) and it submits an ISO yyyy-mm-dd
// value under `name` — exactly what the server actions expect. On desktop you
// can still type into it; on phones it shows the calendar/wheel.
export default function DateField({ name, defaultValue = '', className, style, min, max }) {
  return (
    <input
      type="date"
      name={name}
      defaultValue={defaultValue || ''}
      className={className}
      style={style}
      min={min}
      max={max}
    />
  );
}
