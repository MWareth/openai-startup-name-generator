'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ORIGINS } from '@/lib/leadOrigin';
import { setLeadOrigin } from '@/app/(app)/leads/actions';

// Inline tagger on the Recent Leads row. Changing it moves the lead into the
// Follow Ups or Cold Leads tab immediately — no need to open the lead.
export default function OriginPicker({ leadId, value }) {
  const [origin, setOrigin] = useState(value || 'campaign');
  const [err, setErr] = useState(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function change(next) {
    const previous = origin;
    setOrigin(next);
    setErr(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set('lead_id', leadId);
      fd.set('origin', next);
      const res = await setLeadOrigin(fd);
      if (res && res.ok === false) {
        setOrigin(previous); // put it back — nothing was saved
        setErr(res.error || 'Could not save');
        return;
      }
      router.refresh();
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
      {err ? <div className="small" style={{ color: 'var(--red)' }}>{err}</div> : null}
    </>
  );
}
