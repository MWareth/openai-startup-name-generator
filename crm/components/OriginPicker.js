'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ORIGINS, originMeta } from '@/lib/leadOrigin';
import { setLeadOrigin } from '@/app/(app)/leads/actions';

// Inline tagger on the Recent Leads row. Changing it moves the lead into the
// Follow Ups or Cold Leads tab immediately — no need to open the lead — and
// confirms with a toast, because the row itself doesn't visibly move.
export default function OriginPicker({ leadId, leadName, value }) {
  const [origin, setOrigin] = useState(value || 'other');
  const [toast, setToast] = useState(null); // { ok, text }
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function change(next) {
    const previous = origin;
    setOrigin(next);
    setToast(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('lead_id', leadId);
      fd.set('origin', next);
      const res = await setLeadOrigin(fd);
      if (res && res.ok === false) {
        setOrigin(previous); // nothing saved — never leave a tag showing that isn't real
        setToast({ ok: false, text: res.error || 'Could not save — the lead was not moved.' });
        return;
      }
      const meta = originMeta(next);
      setToast({ ok: true, text: `${leadName || 'Lead'} moved to ${meta.icon} ${meta.tab}` });
      router.refresh();
      setTimeout(() => setToast(null), 3200);
    });
  }

  return (
    <>
      <select
        aria-label="How this lead was generated"
        value={origin}
        disabled={pending}
        onChange={(e) => change(e.target.value)}
        style={{ fontSize: '0.8rem', padding: '3px 6px', width: 'auto', minWidth: 116 }}
      >
        {ORIGINS.map((o) => (
          <option key={o.id} value={o.id}>{o.icon} {o.label}</option>
        ))}
      </select>

      {toast ? (
        <div
          role="status"
          className="lead-toast"
          style={
            toast.ok
              ? { background: '#e7f6ec', border: '1px solid var(--green)', color: '#14532d' }
              : { background: '#fde4e4', border: '1px solid var(--red)', color: '#7f1d1d' }
          }
        >
          {toast.ok ? '✅ ' : '⚠️ '}
          {toast.text}
        </div>
      ) : null}
    </>
  );
}
