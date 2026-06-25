import { requireUser } from '@/lib/auth';
import { aed } from '@/lib/format';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function ProposalPrint({ searchParams }) {
  const { profile, supabase } = await requireUser();
  const client = searchParams?.client || 'our valued client';
  const budget = searchParams?.budget || '';
  const unit = searchParams?.unit || '';
  let ids = searchParams?.ids || [];
  if (typeof ids === 'string') ids = [ids];

  let projects = [];
  if (ids.length) {
    const { data } = await supabase.from('projects').select('*').in('id', ids);
    projects = data || [];
  }

  const story =
    `Based on your interest in an off-plan ${unit || 'home'}` +
    (budget ? ` within a budget of around ${aed(Number(budget))}` : '') +
    `, we are pleased to share the hand-picked options below.`;

  return (
    <div className="stack">
      <div className="no-print row" style={{ justifyContent: 'space-between' }}>
        <a className="small" href="/proposal">← Back to builder</a>
        <PrintButton className="btn">Save / Print as PDF</PrintButton>
      </div>

      <div className="card" id="proposal">
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Bridges & Allies" style={{ height: 64, maxWidth: '100%' }} />
        </div>
        <h1 style={{ textAlign: 'center', marginBottom: 2 }}>Property Proposal</h1>
        <p style={{ textAlign: 'center' }} className="muted">
          Prepared for <strong style={{ color: 'var(--text)' }}>{client}</strong>
        </p>
        <p style={{ marginTop: 12 }}>{story}</p>

        <hr className="divider" />

        {projects.length ? (
          projects.map((p) => (
            <div key={p.id} style={{ marginBottom: 20, pageBreakInside: 'avoid' }}>
              <h2 style={{ marginBottom: 2 }}>
                {p.name} <span className="small muted">· {p.developer}</span>
              </h2>
              <div className="small muted">{p.area}{p.emirate ? `, ${p.emirate}` : ''}</div>
              <table style={{ marginTop: 8 }}>
                <tbody>
                  {p.unit_types ? <tr><td className="muted" style={{ width: 160 }}>Unit types</td><td>{p.unit_types}</td></tr> : null}
                  {p.starting_price ? <tr><td className="muted">Starting price</td><td><strong>{aed(p.starting_price)}</strong></td></tr> : null}
                  {p.down_payment ? <tr><td className="muted">Down payment</td><td>{p.down_payment}</td></tr> : null}
                  {p.payment_plan ? <tr><td className="muted">Payment plan</td><td>{p.payment_plan}</td></tr> : null}
                  {p.handover ? <tr><td className="muted">Handover</td><td>{p.handover}</td></tr> : null}
                  {p.notes ? <tr><td className="muted">Notes</td><td>{p.notes}</td></tr> : null}
                </tbody>
              </table>
              {p.brochure_url || p.virtual_tour_url ? (
                <div className="small" style={{ marginTop: 6 }}>
                  {p.brochure_url ? <a href={p.brochure_url}>Brochure</a> : null}
                  {p.brochure_url && p.virtual_tour_url ? ' · ' : ''}
                  {p.virtual_tour_url ? <a href={p.virtual_tour_url}>Virtual tour</a> : null}
                </div>
              ) : null}
            </div>
          ))
        ) : (
          <p className="muted">No projects selected. Go back and pick at least one.</p>
        )}

        <hr className="divider" />
        <p className="small muted">
          Presented by {profile?.full_name || 'your agent'} · Bridges &amp; Allies Real Estate
        </p>
      </div>
    </div>
  );
}
