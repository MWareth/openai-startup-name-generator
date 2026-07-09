'use client';

import { useState } from 'react';
import { translateToEnglish } from '@/app/(app)/leads/actions';

// Shows a "Translate to English" button under a note; fetches the translation
// on demand (so it only costs when actually used).
export default function TranslateButton({ text }) {
  const [out, setOut] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  async function go() {
    setLoading(true);
    setErr(null);
    const r = await translateToEnglish(text);
    setLoading(false);
    if (r?.error) setErr(r.error);
    else setOut(r?.text || '');
  }

  if (out != null) {
    return (
      <div
        className="small"
        style={{ marginTop: 6, background: 'var(--panel-2)', borderRadius: 8, padding: '6px 10px' }}
      >
        <span className="muted">🌐 English:</span> {out}
      </div>
    );
  }

  return (
    <div style={{ marginTop: 4 }}>
      <button type="button" className="btn ghost small" onClick={go} disabled={loading}>
        {loading ? 'Translating…' : '🌐 Translate to English'}
      </button>
      {err ? <span className="small" style={{ color: 'var(--red)', marginLeft: 8 }}>{err}</span> : null}
    </div>
  );
}
