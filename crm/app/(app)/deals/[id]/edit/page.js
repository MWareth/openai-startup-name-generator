import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { aed, formatDate, DEAL_PROPERTY_TYPES, DOC_KINDS } from '@/lib/format';
import SubmitButton from '@/components/SubmitButton';
import DealMoneyFields from '@/components/DealMoneyFields';
import DateField from '@/components/DateField';
import { updateDeal, deleteDeal, uploadDealDoc, deleteDealDoc, addDealNote } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditDealPage({ params, searchParams }) {
  const { supabase } = await requireUser();
  const error = searchParams?.error;
  const ok = searchParams?.ok;

  const { data: deal } = await supabase
    .from('deals')
    .select('*, lead:leads(id, name), agent:profiles!deals_agent_id_fkey(full_name, seniority)')
    .eq('id', params.id)
    .single();

  if (!deal) notFound();

  const backHref = deal.lead?.id ? `/leads/${deal.lead.id}` : '/leads';

  // Documents (private storage) — fetch + sign view URLs via the admin client.
  const adminCli = createAdminClient();
  const { data: docsRaw } = await adminCli
    .from('deal_documents')
    .select('*')
    .eq('deal_id', deal.id)
    .order('created_at', { ascending: false });
  const docs = [];
  for (const d of docsRaw || []) {
    const { data: signed } = await adminCli.storage.from('deal-docs').createSignedUrl(d.file_path, 3600);
    docs.push({ ...d, url: signed?.signedUrl });
  }
  const docLabel = Object.fromEntries(DOC_KINDS.map((k) => [k.v, k.l]));

  // Notes specific to this deal/unit.
  const { data: notes } = await supabase
    .from('deal_notes')
    .select('*, author:profiles(full_name)')
    .eq('deal_id', deal.id)
    .order('created_at', { ascending: false });

  return (
    <div className="stack" style={{ maxWidth: 640 }}>
      <div>
        <Link className="small muted" href={backHref}>← Back to lead</Link>
        <h1>Deal — {deal.lead?.name || 'Lead'}{deal.property ? ` · ${deal.property}` : ''}</h1>
        <p className="muted small">
          {deal.agent?.full_name ? `Credited to ${deal.agent.full_name} (${deal.agent.seniority}). ` : ''}
          Commission is recalculated automatically when you save.
        </p>
      </div>
      {error ? <div className="alert error">{error}</div> : null}
      {ok ? <div className="alert ok">{ok}</div> : null}

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
        <DealMoneyFields
          dealValue={deal.deal_value}
          commissionRate={deal.commission_rate}
          grossCommission={deal.gross_commission}
          referralAmount={deal.referral_amount}
        />
        <div className="field">
          <label>Referral party</label>
          <input name="referral_party" defaultValue={deal.referral_party || ''} />
        </div>
        <div className="field" style={{ maxWidth: 240 }}>
          <label>Closed on</label>
          <DateField name="closed_on" defaultValue={deal.closed_on} />
        </div>

        <div className="field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
            <input type="checkbox" name="self_sourced" value="true" defaultChecked={!!deal.self_sourced} style={{ width: 'auto' }} />
            Own referral — agent brought this lead (60/40 split)
          </label>
        </div>

        <div className="row small muted" style={{ marginBottom: 12 }}>
          Current split — agent {aed(deal.agent_commission)} · company {aed(deal.company_commission)}
        </div>

        <SubmitButton className="btn" pendingLabel="Saving…">Save changes</SubmitButton>
      </form>

      <div className="card">
        <h3>Documents</h3>
        <p className="small muted">Proof of payment, SPA, passport, Emirates ID. PDF or image, up to ~4 MB each.</p>
        <form action={uploadDealDoc}>
          <input type="hidden" name="deal_id" value={deal.id} />
          <div className="form-grid">
            <div className="field">
              <label>Document type</label>
              <select name="kind" defaultValue="proof_of_payment">
                {DOC_KINDS.map((k) => (
                  <option key={k.v} value={k.v}>{k.l}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>File (PDF or image)</label>
              <input type="file" name="file" accept="image/*,application/pdf" required />
            </div>
          </div>
          <SubmitButton className="btn small" pendingLabel="Uploading…">Upload document</SubmitButton>
        </form>

        {docs.length ? (
          <div className="stack" style={{ gap: 6, marginTop: 12 }}>
            {docs.map((d) => (
              <div key={d.id} className="spread" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <div className="small">
                  <span className="badge status">{docLabel[d.kind] || d.kind}</span>{' '}
                  {d.url ? <a href={d.url} target="_blank" rel="noopener noreferrer">{d.file_name || 'View file'}</a> : (d.file_name || 'file')}
                </div>
                <form action={deleteDealDoc}>
                  <input type="hidden" name="deal_id" value={deal.id} />
                  <input type="hidden" name="doc_id" value={d.id} />
                  <button className="btn ghost small" type="submit">Remove</button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="small muted" style={{ marginTop: 8 }}>No documents uploaded yet.</p>
        )}
      </div>

      <div className="card">
        <h3>Notes for this deal</h3>
        <p className="small muted">Notes specific to this unit (separate from the lead&apos;s timeline).</p>
        <form action={addDealNote}>
          <input type="hidden" name="deal_id" value={deal.id} />
          <div className="field">
            <textarea name="body" placeholder="e.g. Developer confirmed booking, awaiting OQOOD…" required />
          </div>
          <SubmitButton className="btn small" pendingLabel="Adding…">Add note</SubmitButton>
        </form>
        {notes && notes.length ? (
          <div className="stack" style={{ gap: 8, marginTop: 12 }}>
            {notes.map((n) => (
              <div key={n.id} style={{ borderLeft: '2px solid var(--border)', paddingLeft: 10 }}>
                <div className="small" style={{ whiteSpace: 'pre-wrap' }}>{n.body}</div>
                <div className="small muted">{n.author?.full_name || '—'} · {formatDate(n.created_at)}</div>
              </div>
            ))}
          </div>
        ) : (
          <p className="small muted" style={{ marginTop: 8 }}>No notes yet for this deal.</p>
        )}
      </div>

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
