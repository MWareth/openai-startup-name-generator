import Link from 'next/link';
import { requireStaff, canCarryLeads } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import ImportLeadsForm from '@/components/ImportLeadsForm';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Bulk import: bring a batch of leads over from another system (portal CRM,
// spreadsheet) and hand the whole batch to one agent. Staff only.
export default async function ImportLeadsPage() {
  await requireStaff();
  const admin = createAdminClient();
  const { data: people } = await admin
    .from('profiles')
    .select('id, full_name, email, role')
    .in('role', ['agent', 'admin'])
    .order('full_name');
  const agents = (people || []).filter(canCarryLeads).map((p) => ({
    id: p.id,
    full_name: p.full_name || p.email,
  }));

  return (
    <div className="stack" style={{ maxWidth: 900 }}>
      <div className="spread" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h1 style={{ marginBottom: 4 }}>⬆️ Import leads</h1>
          <p className="muted small" style={{ margin: 0 }}>
            Move a batch of leads in from another system and give them all to one agent. Duplicates
            already in the CRM are detected and skipped.
          </p>
        </div>
        <Link className="btn secondary" href="/leads">← Leads</Link>
      </div>

      <ImportLeadsForm agents={agents} />

      <details className="card small muted">
        <summary>Which columns are recognised?</summary>
        <div className="stack" style={{ gap: 4, marginTop: 8 }}>
          <div><strong>Name</strong> — First Name + Last Name, or Full Name / Client / Lead Name</div>
          <div><strong>Phone</strong> — Phone, Mobile, Contact No, Tel (spaces and dashes are cleaned up)</div>
          <div><strong>Email</strong> — Email, E-mail, Email Address</div>
          <div><strong>Project</strong> — Project, Property, Building, Development, Tower</div>
          <div><strong>Community</strong> — Community, Area, Location, District</div>
          <div><strong>Property type</strong> — Property Type / Unit Type (Villa, Apartment, Townhouse…)</div>
          <div><strong>Bedrooms</strong> — Bedrooms, Beds, BR, BHK</div>
          <div><strong>Budget</strong> — Budget, Price, Amount, Value</div>
          <div><strong>Source</strong> — Source, Lead Source, Channel, Campaign</div>
          <div><strong>Notes</strong> — Notes, Remarks, Message, Stage, Status (kept as the first note)</div>
          <div className="muted">Anything else is ignored — it&apos;s listed for you in the preview.</div>
        </div>
      </details>
    </div>
  );
}
