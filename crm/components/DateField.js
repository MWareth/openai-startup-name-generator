'use client';

import { useState } from 'react';

// Locale-proof date entry: always shows and accepts dd/mm/yyyy (never mm/dd,
// regardless of the device's region), and submits an ISO yyyy-mm-dd value via a
// hidden input named `name` — so server actions, which expect ISO dates, work
// unchanged. Digits auto-format into dd/mm/yyyy as you type.

function isoToDisplay(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

function displayToIso(s) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(s || '').trim());
  if (!m) return '';
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  if (dd < 1 || dd > 31 || mm < 1 || mm > 12) return '';
  return `${m[3]}-${m[2]}-${m[1]}`;
}

export default function DateField({ name, defaultValue = '', className, style }) {
  const [text, setText] = useState(isoToDisplay(defaultValue));

  function onChange(e) {
    let v = e.target.value.replace(/\D/g, '').slice(0, 8); // ddmmyyyy
    if (v.length > 4) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
    else if (v.length > 2) v = `${v.slice(0, 2)}/${v.slice(2)}`;
    setText(v);
  }

  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="dd/mm/yyyy"
        value={text}
        onChange={onChange}
        className={className}
        style={style}
        aria-label="Date, day / month / year"
      />
      <input type="hidden" name={name} value={displayToIso(text)} />
    </>
  );
}
