'use client';

import { useState } from 'react';

// Copies text to the clipboard with a brief "Copied ✓" confirmation.
export default function CopyButton({ text, label = '📋 Copy script' }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="btn secondary small"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch (e) {
          // Older Safari fallback
          const ta = document.createElement('textarea');
          ta.value = text;
          document.body.appendChild(ta);
          ta.select();
          document.execCommand('copy');
          document.body.removeChild(ta);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        }
      }}
    >
      {done ? 'Copied ✓' : label}
    </button>
  );
}
