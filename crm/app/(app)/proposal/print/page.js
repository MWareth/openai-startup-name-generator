import { requireUser } from '@/lib/auth';
import { aed, formatDate } from '@/lib/format';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

export default async function ProposalPrint({ searchParams }) {
  const { user, profile, supabase } = await requireUser();
  const client = searchParams?.client || 'our valued client';
  const budget = searchParams?.budget || '';
  const unit = searchParams?.unit || '';
  let ids = searchParams?.ids || [];
  if (typeof ids === 'string') ids = [ids];

  let projects = [];
  if (ids.length) {
    const { data } = await supabase.from('projects').select('*').in('id', ids);
    // Keep the order the agent selected them in.
    projects = ids.map((id) => (data || []).find((p) => p.id === id)).filter(Boolean);
  }

  const todayStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  const story =
    `Based on your interest in an off-plan ${unit || 'home'}` +
    (budget ? ` within a budget of around ${aed(Number(budget))}` : '') +
    `, we are pleased to present the hand-picked options below.`;

  return (
    <div className="stack">
      <div className="no-print row" style={{ justifyContent: 'space-between' }}>
        <a className="small" href="/proposal">← Back to builder</a>
        <PrintButton className="btn">Save / Print as PDF</PrintButton>
      </div>

      <div className="proposal">
        {/* Cover */}
        <div className="proposal-cover">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Bridges & Allies" style={{ height: 70, maxWidth: '100%' }} />
          <h1>PROPERTY PROPOSAL</h1>
          <div className="muted">Prepared exclusively for <strong style={{ color: 'var(--text)' }}>{client}</strong> · {todayStr}</div>
        </div>

        <p style={{ fontSize: '1.02rem' }}>{story}</p>

        {/* Projects */}
        {projects.length ? (
          projects.map((p) => (
            <div key={p.id} className="proj">
              {p.image_url ? <img className="proj-photo" src={p.image_url} alt={p.name} /> : null}
              <div className="proj-head">
                <h2>{p.name}</h2>
                <div className="small">
                  <span className="dev">{p.developer || ''}</span>
                  {p.area ? ` · ${p.area}` : ''}{p.emirate ? `, ${p.emirate}` : ''}
                </div>
              </div>
              <div className="proj-body">
                <div className="facts">
                  {p.starting_price ? <div className="fact"><span className="k">Starting price</span><span className="v">{aed(p.starting_price)}</span></div> : null}
                  {p.unit_types ? <div className="fact"><span className="k">Unit types</span><span className="v">{p.unit_types}</span></div> : null}
                  {p.payment_plan ? <div className="fact"><span className="k">Payment plan</span><span className="v">{p.payment_plan}</span></div> : null}
                  {p.down_payment ? <div className="fact"><span className="k">Down payment</span><span className="v">{p.down_payment}</span></div> : null}
                  {p.handover ? <div className="fact"><span className="k">Handover</span><span className="v">{p.handover}</span></div> : null}
                  {p.sqft_avg ? <div className="fact"><span className="k">Avg. size</span><span className="v">{p.sqft_avg}</span></div> : null}
                </div>
                {p.notes ? <p className="small" style={{ marginTop: 10 }}>{p.notes}</p> : null}
                {p.brochure_url || p.virtual_tour_url ? (
                  <p className="small" style={{ marginTop: 8 }}>
                    {p.brochure_url ? <a href={p.brochure_url}>📄 Brochure</a> : null}
                    {p.brochure_url && p.virtual_tour_url ? '  ·  ' : ''}
                    {p.virtual_tour_url ? <a href={p.virtual_tour_url}>🎬 Virtual tour</a> : null}
                  </p>
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <p className="muted">No projects selected — go back and pick at least one.</p>
        )}

        {/* Footer */}
        <div style={{ borderTop: '3px solid var(--gold)', marginTop: 20, paddingTop: 12, textAlign: 'center' }} className="small muted">
          Presented by <strong style={{ color: 'var(--text)' }}>{profile?.full_name || 'your agent'}</strong>
          {profile?.email || user?.email ? ` · ${profile?.email || user.email}` : ''}<br />
          Bridges &amp; Allies Real Estate
        </div>
      </div>
    </div>
  );
}
