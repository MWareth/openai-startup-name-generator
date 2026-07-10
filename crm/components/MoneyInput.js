'use client';

import { useState } from 'react';

// Money input that shows the number with thousands separators (1,200,000) while
// keeping a raw-digit value in a hidden <input name={name}> so server actions
// that read Number(formData.get(name)) keep working unchanged.
function fmt(n) {
  if (n === '' || n == null) return '';
  const num = Number(n);
  if (Number.isNaN(num)) return '';
  return num.toLocaleString('en-US');
}
function parse(s) {
  return String(s).replace(/[^0-9.]/g, '');
}

export default function MoneyInput({
  name,
  defaultValue = '',
  placeholder,
  readOnly = false,
  required = false,
  id,
  className,
  style,
  min,
  step,
}) {
  const [value, setValue] = useState(defaultValue == null ? '' : String(defaultValue));

  return (
    <>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={fmt(value)}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        className={className}
        style={style}
        onChange={(e) => setValue(parse(e.target.value))}
      />
      <input type="hidden" name={name} value={value} />
    </>
  );
}
