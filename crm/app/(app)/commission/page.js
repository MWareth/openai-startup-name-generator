import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { aed, formatDate, COMMISSION_STATUSES, DOC_KINDS } from '@/lib/format';
import { updateCommissionStatus } from './actions';

export const dynamic = 'force-dynamic';

const STATUS_LABEL = Object.fromEntries(COMMISSION_STATUSES.map((s) => [s.v, s.l]));
const DOC_LABEL = Object.fromEntries(DOC_KINDS.map((k) => [k.v, k.l]));

export default async function CommissionPage({ searchParams }) {
  await requireStaff();
  const ok = searchParams?.ok;
  const error = searchParams?.error;

  // Read across the whole team via the admin client (support isn't an RLS admin).
  const admin = createAdminClient();
  const { data: deals } = await admin
    .from('deals')
    .select('*, lead:leads(id, name), agent:profiles!deals_agent_id_fkey(full_name), docs:deal_documents(id, kind, file_path, file_name)')
    .order('closed_on', { ascending: false });

  // Sign view URLs for every document.
  const rows = [];
  for (const d of deals || []) {
    const docs = [];
    for (const doc of d.docs || []) {
      const { data: signed } = await admin.storage.from('deal-docs').createSignedUrl(doc.file_path, 3600);
      docs.push({ ...doc, url: signed?.signedUrl });
    }
    rows.push({ ...d, docs });
  }

  // Outstanding = anything not yet received, especially with an SPA on file.
  const outstanding = rows.filter((d) => (d.commission_status || 'pending') !== 'received');

  return (
    <div className="stack">
      <div>
        <h1>Commission to collect</h1>
        <p className="muted">Deals and their documents. Chase the developer once the SPA is in, then mark as received.</p>
      </div>
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      <div className="grid grid-3">
        <div className="card stat"><span className="muted small">Outstanding</span><span className="value">{outstanding.length}</span></div>
        <div className="card stat"><span className="muted small">Total deals</span><span className="value">{rows.length}</span></div>
        <div className="card stat"><span className="muted small">Gross commission (all)</span><span className="value" style={{ fontSize: '1.3rem' }}>{aed(rows.reduce((s, d) => s + Number(d.gross_commission || 0), 0))}</span></div>
      </div>

      {rows.length ? (
        rows.map((d) => (
          <div key={d.id} className="card">
            <div className="spread">
              <div>
                <strong>{d.lead?.name || d.property || 'Deal'}</strong>
                <div className="small muted">
                  {d.property || '—'} · Agent: {d.agent?.full_name || '—'} · Closed {formatDate(d.closed_on)}
                </div>
              </div>
              <div className="right">
                <div style={{ fontWeight: 700 }}>{aed(d.gross_commission)}</div>
                <div className="small muted">gross commission</div>
              </div>
            </div>

            <div className="row small" style={{ gap: 8, marginTop: 8 }}>
              <span className="muted">Documents:</span>
              {d.docs.length ? (
                d.docs.map((doc) => (
                  <a key={doc.id} className="badge status" href={doc.url || '#'} target="_blank" rel="noopener noreferrer">
                    {DOC_LABEL[doc.kind] || doc.kind} ↗
                  </a>
                ))
              ) : (
                <span className="muted">none uploaded</span>
              )}
            </div>

            <form action={updateCommissionStatus} className="row" style={{ gap: 8, marginTop: 10, alignItems: 'flex-end' }}>
              <input type="hidden" name="deal_id" value={d.id} />
              <div style={{ width: 220 }}>
                <label>Commission status</label>
                <select name="commission_status" defaultValue={d.commission_status || 'pending'}>
                  {COMMISSION_STATUSES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}
                </select>
              </div>
              <button className="btn secondary small" type="submit">Update</button>
              {d.lead?.id ? <Link className="small" href={`/leads/${d.lead.id}`}>Open lead →</Link> : null}
              <span className={`badge ${d.commission_status === 'received' ? 'won' : 'status'}`}>{STATUS_LABEL[d.commission_status] || 'Pending'}</span>
            </form>
          </div>
        ))
      ) : (
        <div className="card muted">No deals yet. They appear here once agents close deals.</div>
      )}
    </div>
  );
}
