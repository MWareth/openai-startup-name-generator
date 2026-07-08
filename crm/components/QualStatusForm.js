'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateLead } from '@/app/(app)/leads/actions';
import { STATUS_LABELS, PROPERTY_TYPES, BEDROOM_OPTIONS } from '@/lib/format';

// Qualification & status form. Submits via the server action, shows the green
// confirmation inline (client state), then refreshes the page data. No redirect,
// so the message reliably appears — including on iPhone.
export default function QualStatusForm({ leadId, qualification, status, propertyType, bedrooms }) {
  const [msg, setMsg] = useState(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(e) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const res = await updateLead(null, formData);
        setMsg(res);
        if (res?.ok) router.refresh();
      } catch {
        setMsg({ error: 'Could not save — please try again.' });
      }
    });
  }

  return (
    <form onSubmit={onSubmit}>
      {msg?.ok ? <div className="alert ok" role="status">{msg.ok}</div> : null}
      {msg?.error ? <div className="alert error" role="alert">{msg.error}</div> : null}
      <input type="hidden" name="lead_id" value={leadId} />
      <div className="form-grid">
        <div className="field">
          <label>Qualification</label>
          <select name="qualification" defaultValue={qualification}>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
          </select>
        </div>
        <div className="field">
          <label>Status</label>
          <select name="status" defaultValue={status}>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="form-grid">
        <div className="field">
          <label>Property type</label>
          <select name="property_type" defaultValue={propertyType || ''}>
            <option value="">— Select —</option>
            {PROPERTY_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Bedrooms</label>
          <select name="bedrooms" defaultValue={bedrooms || ''}>
            <option value="">— Select —</option>
            {BEDROOM_OPTIONS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>
      <button className="btn secondary small" type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Update'}
      </button>
    </form>
  );
}
