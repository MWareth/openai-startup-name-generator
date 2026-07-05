import Link from 'next/link';
import { requireUser, hasStaffAccess } from '@/lib/auth';
import PasteLeadForm from '@/components/PasteLeadForm';

export const dynamic = 'force-dynamic';

export default async function PasteLeadPage({ searchParams }) {
  const { profile, supabase } = await requireUser();
  const isStaff = hasStaffAccess(profile);
  const error = searchParams?.error;

  let agents = [];
  if (isStaff) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('role', ['agent', 'admin'])
      .order('full_name');
    agents = data || [];
  }

  return (
    <div className="stack" style={{ maxWidth: 680 }}>
      <div>
        <Link className="small muted" href="/leads">← Leads</Link>
        <h1>Paste a lead</h1>
        <p className="muted">Copy an enquiry from WhatsApp, email or a portal, paste it, and it fills the form for you.</p>
      </div>
      {error ? <div className="alert error">{error}</div> : null}
      <PasteLeadForm agents={agents} isStaff={isStaff} />
    </div>
  );
}
