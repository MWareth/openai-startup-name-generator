import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { aed, DEAL_PROPERTY_TYPES } from '@/lib/format';
import SubmitButton from '@/components/SubmitButton';
import { updateDeal, deleteDeal } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditDealPage({ params, searchParams }) {
  const { supabase } = await requireUser();
  const error = searchParams?.error;

  const { data: deal } = await supabase
    .from('deals')
    .select('*, lead:leads(id, name), agent:profiles(full_name, seniority)')
    .eq('id', params.id)
    .single();

  if (!deal) notFound();

  const backHref = deal.lead?.id ? `/leads/${deal.lead.id}` : '/leads';

  return (
    <div className="stack" style={{ maxWidth: 640 }}>
      <div>
        <Link className="small muted" href={backHref}>← Back to lead</Link>
        <h1>Edit deal</h1>
        <p className="muted small">
          {deal.agent?.full_name ? `Credited to ${deal.agent.full_name} (${deal.agent.seniority}). ` : ''}
          Commission is recalculated automatically when you save.
        </p>
      </div>
      {error ? <div className="alert error">{error}</div> : null}

      <form action={updateDeal} className="card">
        <input type="hidden" name="deal_id" value={deal.id} />
        <div className="form-grid">
          <div className="field">
            <label>Property type (sold)</label>
            <select name="property_type" defaultValue={deal.property_type || ''}>
              <option value="">— Select —</option>
              {DEAL_PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Property / reference</label>
            <input name="property" defaultValue={deal.property || ''} />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Deal value (AED) *</label>
            <input name="deal_value" type="number" min="0" step="1000" defaultValue={deal.deal_value} required />
          </div>
          <div className="field">
            <label>Gross commission (AED)</label>
            <input name="gross_commission" type="number" min="0" step="100" defaultValue={deal.gross_commission} />
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Referral party</label>
            <input name="referral_party" defaultValue={deal.referral_party || ''} />
          </div>
          <div className="field">
            <label>Referral amount (AED, off the top)</label>
            <input name="referral_amount" type="number" min="0" step="100" defaultValue={deal.referral_amount} />
          </div>
        </div>
        <div className="field" style={{ maxWidth: 240 }}>
          <label>Closed on</label>
          <input name="closed_on" type="date" defaultValue={deal.closed_on} />
        </div>

        <div className="row small muted" style={{ marginBottom: 12 }}>
          Current split — agent {aed(deal.agent_commission)} · company {aed(deal.company_commission)}
        </div>

        <SubmitButton className="btn" pendingLabel="Saving…">Save changes</SubmitButton>
      </form>

      <form action={deleteDeal} className="card" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
        <input type="hidden" name="deal_id" value={deal.id} />
        <h3>Delete this deal</h3>
        <p className="small muted">
          Removes the deal entirely. Its value will no longer count toward the agent&apos;s target.
        </p>
        <SubmitButton className="btn danger small" pendingLabel="Deleting…">Delete deal</SubmitButton>
      </form>
    </div>
  );
}
