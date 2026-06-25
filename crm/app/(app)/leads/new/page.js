import Link from 'next/link';
import { requireUser, hasStaffAccess } from '@/lib/auth';
import { PROPERTY_TYPES, BEDROOM_OPTIONS } from '@/lib/format';
import SubmitButton from '@/components/SubmitButton';
import { createLead } from '../actions';

export const dynamic = 'force-dynamic';

export default async function NewLeadPage({ searchParams }) {
  const { user, profile, supabase } = await requireUser();
  const error = searchParams?.error;
  const isStaff = hasStaffAccess(profile);

  // Admin/support can assign the new lead to any agent or admin.
  let assignees = [];
  if (isStaff) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['agent', 'admin'])
      .order('full_name');
    assignees = data || [];
  }

  return (
    <div className="stack" style={{ maxWidth: 640 }}>
      <div>
        <Link className="small muted" href="/leads">← Leads</Link>
        <h1>New lead</h1>
      </div>
      {error ? <div className="alert error">{error}</div> : null}

      <form action={createLead} className="card">
        {isStaff ? (
          <div className="field">
            <label htmlFor="assigned_agent_id">Assign to</label>
            <select id="assigned_agent_id" name="assigned_agent_id" defaultValue={user.id}>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name}{a.id === user.id ? ' (me)' : ''}</option>
              ))}
            </select>
          </div>
        ) : null}
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
          <label htmlFor="property_interest">Project / development</label>
          <input id="property_interest" name="property_interest" placeholder="South Square, The Heights…" />
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="property_type">Property type</label>
            <select id="property_type" name="property_type" defaultValue="">
              <option value="">— Select —</option>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="bedrooms">Bedrooms</label>
            <select id="bedrooms" name="bedrooms" defaultValue="">
              <option value="">— Select —</option>
              {BEDROOM_OPTIONS.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
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
        <SubmitButton className="btn" pendingLabel="Creating…">Create lead</SubmitButton>
      </form>
    </div>
  );
}
