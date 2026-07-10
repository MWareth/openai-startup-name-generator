import Link from 'next/link';
import { requireUser, hasStaffAccess, canCarryLeads } from '@/lib/auth';
import { PROPERTY_TYPES, BEDROOM_OPTIONS } from '@/lib/format';
import SubmitButton from '@/components/SubmitButton';
import MoneyInput from '@/components/MoneyInput';
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
    assignees = (data || []).filter(canCarryLeads);
  }

  const { data: areaRows } = await supabase.from('areas').select('name').order('name');
  const { data: buildingRows } = await supabase.from('buildings').select('name').order('name');
  const areaNames = [...new Set((areaRows || []).map((r) => r.name).filter(Boolean))];
  const buildingNames = [...new Set((buildingRows || []).map((r) => r.name).filter(Boolean))];

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
            <input id="source" name="source" list="source-options" autoComplete="off" placeholder="Cold Call, Instagram, referral…" />
            <datalist id="source-options">
              <option value="Cold Call" />
              <option value="Instagram" />
              <option value="Referral" />
              <option value="Bayut" />
              <option value="Property Finder" />
              <option value="Website" />
              <option value="WhatsApp" />
              <option value="Walk-in" />
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="budget">Budget (AED)</label>
            <MoneyInput id="budget" name="budget" placeholder="e.g. 1,200,000" />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label htmlFor="community">Community / area</label>
            <input
              id="community"
              name="community"
              list="area-options"
              autoComplete="off"
              placeholder="Start typing… e.g. Dubai Marina"
            />
            <datalist id="area-options">
              {areaNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
          <div className="field">
            <label htmlFor="property_interest">Building / project</label>
            <input
              id="property_interest"
              name="property_interest"
              list="building-options"
              autoComplete="off"
              placeholder="Tower or development name"
            />
            <datalist id="building-options">
              {buildingNames.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" name="self_sourced" value="true" style={{ width: 'auto' }} />
            Own referral — I brought this lead myself (60/40 split in the agent&apos;s favour)
          </label>
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
