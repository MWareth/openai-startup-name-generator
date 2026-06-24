import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import {
  QUAL_LABELS,
  STATUS_LABELS,
  ACTIVITY_LABELS,
  formatDate,
  aed,
  waLink,
  PROPERTY_TYPES,
} from '@/lib/format';
import { addActivity, updateLead, suggestReassign, logDeal, setFollowUp } from '../actions';
import DictateField from '@/components/DictateField';
import TranslateButton from '@/components/TranslateButton';

export const dynamic = 'force-dynamic';

export default async function LeadDetail({ params, searchParams }) {
  const { user, profile, supabase } = await requireUser();
  const error = searchParams?.error;
  const today = new Date().toISOString().slice(0, 10);

  const { data: lead } = await supabase
    .from('leads')
    .select(
      '*, assigned:profiles!leads_assigned_agent_id_fkey(full_name), suggested:profiles!leads_suggested_agent_id_fkey(id,full_name)'
    )
    .eq('id', params.id)
    .single();

  if (!lead) notFound();

  const { data: activities } = await supabase
    .from('lead_activities')
    .select('*, agent:profiles(full_name)')
    .eq('lead_id', lead.id)
    .order('occurred_on', { ascending: false })
    .order('created_at', { ascending: false });

  const { data: deals } = await supabase
    .from('deals')
    .select('*')
    .eq('lead_id', lead.id)
    .order('closed_on', { ascending: false });

  // Other agents to suggest the lead to.
  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['agent', 'admin'])
    .neq('id', user.id)
    .order('full_name');

  return (
    <div className="stack">
      <div>
        <Link className="small muted" href="/leads">← Leads</Link>
        <div className="spread">
          <h1>{lead.name}</h1>
          <div className="row">
            <span className={`badge ${lead.qualification}`}>{QUAL_LABELS[lead.qualification]}</span>
            <span className={`badge ${lead.status === 'won' ? 'won' : lead.status === 'lost' ? 'lost' : 'status'}`}>
              {STATUS_LABELS[lead.status]}
            </span>
          </div>
        </div>
      </div>
      {error ? <div className="alert error">{error}</div> : null}

      <div className="grid grid-2">
        {/* Left column */}
        <div className="stack">
          <div className="card">
            <h3>Contact</h3>
            <div className="small stack" style={{ gap: 4 }}>
              <div><span className="muted">Phone:</span> {lead.phone || '—'}</div>
              <div><span className="muted">Email:</span> {lead.email || '—'}</div>
              <div><span className="muted">Source:</span> {lead.source || '—'}</div>
              <div><span className="muted">Interest:</span> {lead.property_interest || '—'}</div>
              <div><span className="muted">Type:</span> {lead.property_type || '—'}</div>
              <div><span className="muted">Budget:</span> {lead.budget ? aed(lead.budget) : '—'}</div>
              <div><span className="muted">Assigned:</span> {lead.assigned?.full_name || 'Unassigned'}</div>
            </div>
            {waLink(lead.phone) ? (
              <a
                className="btn small"
                href={waLink(lead.phone)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ marginTop: 12, background: '#25D366' }}
              >
                WhatsApp message
              </a>
            ) : null}
          </div>

          <div className="card">
            <h3>Next follow-up</h3>
            {lead.next_follow_up ? (
              <p className="small">
                Scheduled for <strong>{formatDate(lead.next_follow_up)}</strong>
                {lead.next_follow_up <= today ? <span className="badge hot" style={{ marginLeft: 8 }}>Due</span> : null}
              </p>
            ) : (
              <p className="small muted">No follow-up set.</p>
            )}
            <form action={setFollowUp} className="row" style={{ gap: 8 }}>
              <input type="hidden" name="lead_id" value={lead.id} />
              <input type="date" name="next_follow_up" defaultValue={lead.next_follow_up || ''} style={{ maxWidth: 180 }} />
              <button className="btn secondary small" type="submit">Save</button>
            </form>
          </div>

          <div className="card">
            <h3>Qualification & status</h3>
            <form action={updateLead}>
              <input type="hidden" name="lead_id" value={lead.id} />
              <div className="form-grid">
                <div className="field">
                  <label>Qualification</label>
                  <select name="qualification" defaultValue={lead.qualification}>
                    <option value="hot">Hot</option>
                    <option value="warm">Warm</option>
                    <option value="cold">Cold</option>
                  </select>
                </div>
                <div className="field">
                  <label>Status</label>
                  <select name="status" defaultValue={lead.status}>
                    {Object.entries(STATUS_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Property type</label>
                <select name="property_type" defaultValue={lead.property_type || ''}>
                  <option value="">— Select —</option>
                  {PROPERTY_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <button className="btn secondary small" type="submit">Update</button>
            </form>
          </div>

          <div className="card">
            <h3>Suggest reassignment</h3>
            <p className="small muted">Propose another agent. An admin makes the final reassignment.</p>
            {lead.suggested?.full_name ? (
              <p className="small">Currently suggested: <span className="badge role">{lead.suggested.full_name}</span></p>
            ) : null}
            <form action={suggestReassign}>
              <input type="hidden" name="lead_id" value={lead.id} />
              <div className="field">
                <select name="suggested_agent_id" defaultValue={lead.suggested?.id || ''}>
                  <option value="">— No suggestion —</option>
                  {(agents || []).map((a) => (
                    <option key={a.id} value={a.id}>{a.full_name}</option>
                  ))}
                </select>
              </div>
              <button className="btn secondary small" type="submit">Save suggestion</button>
            </form>
          </div>
        </div>

        {/* Right column */}
        <div className="stack">
          <div className="card">
            <h3>Log activity</h3>
            <form action={addActivity}>
              <input type="hidden" name="lead_id" value={lead.id} />
              <div className="form-grid">
                <div className="field">
                  <label>Type</label>
                  <select name="type" defaultValue="call">
                    {Object.entries(ACTIVITY_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Date</label>
                  <input type="date" name="occurred_on" defaultValue={today} />
                </div>
              </div>
              <div className="field">
                <label>Notes</label>
                <DictateField name="body" placeholder="What happened? (or tap Dictate and speak)" required />
              </div>
              <div className="field">
                <label>Set next follow-up (optional)</label>
                <input type="date" name="next_follow_up" />
              </div>
              <button className="btn small" type="submit">Add activity</button>
            </form>
          </div>

          <div className="card">
            <h3>Timeline</h3>
            {activities && activities.length ? (
              <div className="stack" style={{ gap: 10 }}>
                {activities.map((a) => (
                  <div key={a.id} style={{ borderLeft: '2px solid var(--border)', paddingLeft: 12 }}>
                    <div className="spread">
                      <span className="badge status">{ACTIVITY_LABELS[a.type]}</span>
                      <span className="small muted">{formatDate(a.occurred_on)}</span>
                    </div>
                    <div className="small" style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{a.body}</div>
                    {a.body ? <TranslateButton text={a.body} /> : null}
                    <div className="small muted">{a.agent?.full_name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted small">No activity logged yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Deal section */}
      <div className="card">
        <h3>Close a deal</h3>
        <p className="small muted">
          The deal value counts toward the assigned agent&apos;s target. Commission is split after the
          referral cut: <strong>junior 50/50</strong>, <strong>senior 55/45</strong> (agent/company).
        </p>
        <form action={logDeal}>
          <input type="hidden" name="lead_id" value={lead.id} />
          <div className="form-grid">
            <div className="field">
              <label>Property</label>
              <input name="property" defaultValue={lead.property_interest || ''} />
            </div>
            <div className="field">
              <label>Deal value (AED) *</label>
              <input name="deal_value" type="number" min="0" step="1000" required />
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Gross commission (AED)</label>
              <input name="gross_commission" type="number" min="0" step="100" />
            </div>
            <div className="field">
              <label>Closed on</label>
              <input name="closed_on" type="date" defaultValue={today} />
            </div>
          </div>
          <div className="form-grid">
            <div className="field">
              <label>Referral party (optional)</label>
              <input name="referral_party" placeholder="Who referred it?" />
            </div>
            <div className="field">
              <label>Referral amount (AED, off the top)</label>
              <input name="referral_amount" type="number" min="0" step="100" defaultValue="0" />
            </div>
          </div>
          <button className="btn" type="submit">Log deal &amp; mark won</button>
        </form>

        {deals && deals.length ? (
          <>
            <hr className="divider" />
            <table>
              <thead>
                <tr><th>Closed</th><th>Property</th><th className="right">Value</th><th className="right">Gross</th><th className="right">Referral</th><th className="right">Agent</th><th className="right">Company</th></tr>
              </thead>
              <tbody>
                {deals.map((d) => (
                  <tr key={d.id}>
                    <td className="small">{formatDate(d.closed_on)}</td>
                    <td className="small">{d.property || '—'}</td>
                    <td className="right">{aed(d.deal_value)}</td>
                    <td className="right small">{aed(d.gross_commission)}</td>
                    <td className="right small">{d.referral_amount ? aed(d.referral_amount) : '—'}</td>
                    <td className="right small">{aed(d.agent_commission)}</td>
                    <td className="right small muted">{aed(d.company_commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}
      </div>
    </div>
  );
}
