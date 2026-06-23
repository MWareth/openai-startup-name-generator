import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { createLead } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewLeadPage({ searchParams }) {
  await requireUser();
  const error = searchParams?.error;

  return (
    <div className="stack" style={{ maxWidth: 640 }}>
      <div>
        <Link className="small muted" href="/leads">← Leads</Link>
        <h1>New lead</h1>
      </div>
      {error ? <div className="alert error">{error}</div> : null}

      <form action={createLead} className="card">
        <div className="field">
          <label htmlFor="name">Full name *</label>
          <input id="name" name="name" required />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="source">Source</label>
            <input id="source" name="source" placeholder="Instagram, referral, portal…" />
          </div>
          <div className="field">
            <label htmlFor="budget">Budget (AED)</label>
            <input id="budget" name="budget" type="number" min="0" step="1000" />
          </div>
        </div>
        <div className="field">
          <label htmlFor="property_interest">Property interest</label>
          <input id="property_interest" name="property_interest" placeholder="2BR Marina, villa in Arabian Ranches…" />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="qualification">Qualification</label>
            <select id="qualification" name="qualification" defaultValue="warm">
              <option value="hot">Hot</option>
              <option value="warm">Warm</option>
              <option value="cold">Cold</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue="new">
              <option value="new">New</option>
              <option value="active">Active</option>
              <option value="viewing">Viewing</option>
              <option value="negotiation">Negotiation</option>
            </select>
          </div>
        </div>
        <button className="btn" type="submit">Create lead</button>
      </form>
    </div>
  );
}
