'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { updateLead } from '@/app/(app)/leads/actions';
import { STATUS_LABELS, PROPERTY_TYPES, BEDROOM_OPTIONS } from '@/lib/format';

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button className="btn secondary small" type="submit" disabled={pending}>
      {pending ? 'Saving…' : 'Update'}
    </button>
  );
}

// Qualification & status form. Shows the green confirmation inline (via
// useFormState) so it always appears — no redirect that iPhone could drop.
export default function QualStatusForm({ leadId, qualification, status, propertyType, bedrooms }) {
  const [state, action] = useFormState(updateLead, null);
  return (
    <form action={action}>
      {state?.ok ? <div className="alert ok" role="status">{state.ok}</div> : null}
      {state?.error ? <div className="alert error" role="alert">{state.error}</div> : null}
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
      <SaveButton />
    </form>
  );
}
