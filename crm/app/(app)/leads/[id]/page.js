import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser, hasStaffAccess } from '@/lib/auth';
import SubmitButton from '@/components/SubmitButton';
import {
  QUAL_LABELS,
  STATUS_LABELS,
  ACTIVITY_LABELS,
  formatDate,
  aed,
  waLink,
  PROPERTY_TYPES,
  BEDROOM_OPTIONS,
  DEAL_PROPERTY_TYPES,
} from '@/lib/format';
import { addActivity, updateLead, updateLeadDetails, deleteLead, suggestReassign, logDeal, markLeadWon, addFollowUp, completeFollowUp, deleteFollowUp, logCall } from '../actions';
import DictateField from '@/components/DictateField';
import TranslateButton from '@/components/TranslateButton';
import DealMoneyFields from '@/components/DealMoneyFields';
import DateField from '@/components/DateField';
import LeadProgress from '@/components/LeadProgress';

export const dynamic = 'force-dynamic';

export default async function LeadDetail({ params, searchParams }) {
  const { user, profile, supabase } = await requireUser();
  const isAdmin = hasStaffAccess(profile); // admin + support can reassign directly
  const error = searchParams?.error;
  const ok = searchParams?.ok;
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

  const { data: followups } = await supabase
    .from('lead_followups')
    .select('*')
    .eq('lead_id', lead.id)
    .order('due_on', { ascending: true });

  const pendingFollowups = (followups || []).filter((f) => !f.done);
  const doneFollowups = (followups || []).filter((f) => f.done);

  // Lead progress stepper: Assigned → Contacted → Meeting → Follow → Closed.
  // Each stage is inferred from real data (assignment, logged activities,
  // follow-ups) and the closed deal. `reached` = furthest stage completed.
  const acts = activities || [];
  const hasContacted = acts.some((a) => a.type === 'call' || a.type === 'call_update');
  const hasMeeting = acts.some((a) => a.type === 'meeting' || a.type === 'viewing');
  const hasFollow = (followups || []).length > 0;
  let reached = -1;
  if (lead.assigned_agent_id) reached = 0;
  if (hasContacted) reached = Math.max(reached, 1);
  if (hasMeeting) reached = Math.max(reached, 2);
  if (hasFollow) reached = Math.max(reached, 3);
  if (lead.status === 'won') reached = 4;
  const leadLost = lead.status === 'lost';

  // Merge activities + follow-up events into one timeline, newest first.
  const timeline = [
    ...(activities || []).map((a) => ({
      key: `a-${a.id}`,
      when: new Date(a.occurred_on).getTime(),
      kind: 'activity',
      data: a,
    })),
    ...(followups || []).map((f) => ({
      key: `fs-${f.id}`,
      when: new Date(f.created_at).getTime(),
      kind: 'fu_scheduled',
      data: f,
    })),
    ...(followups || []).filter((f) => f.done && f.done_at).map((f) => ({
      key: `fd-${f.id}`,
      when: new Date(f.done_at).getTime(),
      kind: 'fu_done',
      data: f,
    })),
  ].sort((a, b) => b.when - a.when);

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
        <div className="card" style={{ marginTop: 12 }}>
          <LeadProgress reached={reached} lost={leadLost} />
        </div>
      </div>
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      <div className="grid grid-2">
        {/* Left column */}
        <div className="stack">
          <div className="card">
            <h3>Contact details</h3>
            <form action={updateLeadDetails} className="stack" style={{ gap: 10 }}>
              <input type="hidden" name="lead_id" value={lead.id} />
              <div className="field"><label>Full name</label><input name="name" defaultValue={lead.name} required /></div>
              <div className="form-grid">
                <div className="field"><label>Phone</label><input name="phone" defaultValue={lead.phone || ''} /></div>
                <div className="field"><label>Email</label><input name="email" type="email" defaultValue={lead.email || ''} /></div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Source</label>
                  <input name="source" defaultValue={lead.source || ''} list="lead-source-options" autoComplete="off" />
                  <datalist id="lead-source-options">
                    <option value="Cold Call" /><option value="Instagram" /><option value="Referral" />
                    <option value="Bayut" /><option value="Property Finder" /><option value="Website" />
                    <option value="WhatsApp" /><option value="Walk-in" />
                  </datalist>
                </div>
                <div className="field"><label>Budget (AED)</label><input name="budget" type="number" min="0" step="1000" defaultValue={lead.budget || ''} /></div>
              </div>
              <div className="form-grid">
                <div className="field"><label>Community / area</label><input name="community" defaultValue={lead.community || ''} /></div>
                <div className="field"><label>Building / project</label><input name="property_interest" defaultValue={lead.property_interest || ''} /></div>
              </div>
              <button className="btn secondary small" type="submit">Save details</button>
            </form>
            <div className="small muted" style={{ marginTop: 10 }}>Assigned: {lead.assigned?.full_name || 'Unassigned'}</div>
            <div className="row" style={{ gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
              {waLink(lead.phone) ? (
                <a className="btn small" href={waLink(lead.phone)} target="_blank" rel="noopener noreferrer" style={{ background: '#25D366' }}>
                  WhatsApp message
                </a>
              ) : null}
              {lead.phone ? (
                <a className="btn small" href={`tel:${String(lead.phone).replace(/[^\d+]/g, '')}`} style={{ background: '#2563eb' }}>
                  📞 Call
                </a>
              ) : null}
            </div>
            {lead.phone ? (
              <div style={{ marginTop: 8 }}>
                <div className="small muted" style={{ marginBottom: 4 }}>After calling, log the outcome:</div>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {[['answered', '✅ Answered'], ['no_answer', '❌ No answer'], ['voicemail', '📩 Voicemail']].map(([v, l]) => (
                    <form key={v} action={logCall}>
                      <input type="hidden" name="lead_id" value={lead.id} />
                      <input type="hidden" name="outcome" value={v} />
                      <button className="btn ghost small" type="submit">{l}</button>
                    </form>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="card">
            <h3>Follow-ups</h3>
            {pendingFollowups.length ? (
              <div className="stack" style={{ gap: 8, marginBottom: 12 }}>
                {pendingFollowups.map((f) => (
                  <div key={f.id} className="spread" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8, gap: 8 }}>
                    <div>
                      <span className="small"><strong>{formatDate(f.due_on)}</strong></span>
                      {f.due_on <= today ? <span className="badge hot" style={{ marginLeft: 8 }}>{f.due_on < today ? 'Overdue' : 'Due'}</span> : null}
                      {f.note ? <div className="small muted" style={{ whiteSpace: 'pre-wrap' }}>{f.note}</div> : null}
                    </div>
                    <div className="row" style={{ gap: 6 }}>
                      <form action={completeFollowUp}>
                        <input type="hidden" name="lead_id" value={lead.id} />
                        <input type="hidden" name="followup_id" value={f.id} />
                        <button className="btn secondary small" type="submit">Done</button>
                      </form>
                      <form action={deleteFollowUp}>
                        <input type="hidden" name="lead_id" value={lead.id} />
                        <input type="hidden" name="followup_id" value={f.id} />
                        <button className="btn ghost small" type="submit">✕</button>
                      </form>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="small muted">No follow-ups scheduled.</p>
            )}

            <form action={addFollowUp} className="stack" style={{ gap: 8 }}>
              <input type="hidden" name="lead_id" value={lead.id} />
              <div className="row" style={{ gap: 8 }}>
                <DateField name="due_on" defaultValue={today} style={{ maxWidth: 180 }} />
                <button className="btn secondary small" type="submit">+ Add follow-up</button>
              </div>
              <input name="note" placeholder="Note (optional) — e.g. call after he sees the brochure" />
            </form>

            {doneFollowups.length ? (
              <p className="small muted" style={{ marginTop: 10 }}>
                ✅ {doneFollowups.length} completed — see the timeline for details.
              </p>
            ) : null}
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
              <div className="form-grid">
                <div className="field">
                  <label>Property type</label>
                  <select name="property_type" defaultValue={lead.property_type || ''}>
                    <option value="">— Select —</option>
                    {PROPERTY_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>Bedrooms</label>
                  <select name="bedrooms" defaultValue={lead.bedrooms || ''}>
                    <option value="">— Select —</option>
                    {BEDROOM_OPTIONS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>
              <button className="btn secondary small" type="submit">Update</button>
            </form>
          </div>

          <div className="card">
            <h3>{isAdmin ? 'Reassign lead' : 'Suggest reassignment'}</h3>
            <p className="small muted">
              {isAdmin
                ? 'Assign this lead to another agent, or send it to the Lead Pool. Takes effect immediately.'
                : 'Propose another agent. An admin makes the final reassignment.'}
            </p>
            {!isAdmin && lead.suggested?.full_name ? (
              <p className="small">Currently suggested: <span className="badge role">{lead.suggested.full_name}</span></p>
            ) : null}
            <form action={suggestReassign}>
              <input type="hidden" name="lead_id" value={lead.id} />
              <div className="field">
                <select name="suggested_agent_id" defaultValue={isAdmin ? (lead.assigned?.id || '') : (lead.suggested?.id || '')}>
                  <option value="">{isAdmin ? '📥 Lead Pool (unassign)' : '— No suggestion —'}</option>
                  {(agents || []).map((a) => (
                    <option key={a.id} value={a.id}>{a.full_name}</option>
                  ))}
                </select>
              </div>
              <button className="btn secondary small" type="submit">{isAdmin ? 'Reassign' : 'Save suggestion'}</button>
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
                  <DateField name="occurred_on" defaultValue={today} />
                </div>
              </div>
              <div className="field">
                <label>Notes</label>
                <DictateField name="body" placeholder="What happened? (or tap Dictate and speak)" required />
              </div>
              <div className="field">
                <label>Set next follow-up (optional)</label>
                <DateField name="next_follow_up" />
              </div>
              <SubmitButton className="btn small" pendingLabel="Saving…">Add activity</SubmitButton>
            </form>
          </div>

          <div className="card">
            <h3>Timeline</h3>
            {timeline.length ? (
              <div className="stack" style={{ gap: 10 }}>
                {timeline.map((item) => {
                  if (item.kind === 'activity') {
                    const a = item.data;
                    return (
                      <div key={item.key} style={{ borderLeft: '2px solid var(--border)', paddingLeft: 12 }}>
                        <div className="spread">
                          <span className="badge status">{ACTIVITY_LABELS[a.type]}</span>
                          <span className="small muted">{formatDate(a.occurred_on)}</span>
                        </div>
                        <div className="small" style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}>{a.body}</div>
                        {a.body ? <TranslateButton text={a.body} /> : null}
                        <div className="small muted">{a.agent?.full_name}</div>
                      </div>
                    );
                  }
                  if (item.kind === 'fu_scheduled') {
                    const f = item.data;
                    return (
                      <div key={item.key} style={{ borderLeft: '2px solid var(--brand)', paddingLeft: 12 }}>
                        <div className="spread">
                          <span className="badge role">📅 Follow-up</span>
                          <span className="small muted">{formatDate(f.created_at)}</span>
                        </div>
                        <div className="small" style={{ marginTop: 4 }}>
                          Scheduled for <strong>{formatDate(f.due_on)}</strong>
                          {!f.done ? null : <span className="small muted"> · completed</span>}
                        </div>
                        {f.note ? <div className="small muted" style={{ whiteSpace: 'pre-wrap' }}>{f.note}</div> : null}
                      </div>
                    );
                  }
                  // fu_done
                  const f = item.data;
                  return (
                    <div key={item.key} style={{ borderLeft: '2px solid var(--won, #16a34a)', paddingLeft: 12 }}>
                      <div className="spread">
                        <span className="badge won">✅ Follow-up done</span>
                        <span className="small muted">{formatDate(f.done_at)}</span>
                      </div>
                      <div className="small" style={{ marginTop: 4 }}>Completed (was due {formatDate(f.due_on)})</div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="muted small">No activity logged yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Deal section — full deal entry is support/management only. */}
      {isAdmin ? (
      <div className="card">
        <h3>Close a deal</h3>
        <p className="small muted">
          The deal value counts toward the assigned agent&apos;s target. Commission is split after the
          referral cut: <strong>junior 50/50</strong>, <strong>senior 55/45</strong>, <strong>team leader 60/40</strong>.
          An <strong>own-referral</strong> lead pays the agent <strong>60/40</strong> regardless of seniority.
        </p>
        <form action={logDeal}>
          <input type="hidden" name="lead_id" value={lead.id} />
          <div className="form-grid">
            <div className="field">
              <label>Property type (sold)</label>
              <select name="property_type" defaultValue="">
                <option value="">— Select —</option>
                {DEAL_PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Property / reference</label>
              <input name="property" defaultValue={lead.property_interest || ''} />
            </div>
          </div>
          <DealMoneyFields />
          <div className="form-grid">
            <div className="field">
              <label>Referral party (optional)</label>
              <input name="referral_party" placeholder="Who referred it?" />
            </div>
            <div className="field">
              <label>Closed on</label>
              <DateField name="closed_on" defaultValue={today} />
            </div>
          </div>
          <div className="field">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" name="self_sourced" value="true" defaultChecked={!!lead.self_sourced} style={{ width: 'auto' }} />
              Own referral — agent brought this lead{isAdmin ? ' (60/40 split)' : ''}
            </label>
          </div>
          <SubmitButton className="btn" pendingLabel="Logging…">Log deal &amp; mark won</SubmitButton>
        </form>

        {deals && deals.length ? (
          <>
            <hr className="divider" />
            <table>
              <thead>
                <tr><th>Closed</th><th>Type</th><th>Property</th><th className="right">Value</th><th className="right">Gross</th><th className="right">Referral</th><th className="right">Agent</th><th className="right">Company</th><th></th></tr>
              </thead>
              <tbody>
                {deals.map((d) => (
                  <tr key={d.id}>
                    <td className="small">{formatDate(d.closed_on)}</td>
                    <td className="small">{d.property_type || '—'}</td>
                    <td className="small">{d.property || '—'}</td>
                    <td className="right">{aed(d.deal_value)}</td>
                    <td className="right small">{aed(d.gross_commission)}</td>
                    <td className="right small">{d.referral_amount ? aed(d.referral_amount) : '—'}</td>
                    <td className="right small">{aed(d.agent_commission)}</td>
                    <td className="right small muted">{aed(d.company_commission)}</td>
                    <td className="right"><Link className="small" href={`/deals/${d.id}/edit`}>Open · docs &amp; notes →</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : null}
      </div>
      ) : (
        <div className="card">
          <h3>Mark as closed</h3>
          {lead.status === 'won' ? (
            <p className="small muted">✅ This lead is marked <strong>won</strong>. Support will collect the deal details from you and record the value &amp; commission.</p>
          ) : (
            <>
              <p className="small muted">Closed the deal? Mark it won — support will then take the details from you and record the value &amp; commission.</p>
              <form action={markLeadWon}>
                <input type="hidden" name="lead_id" value={lead.id} />
                <SubmitButton className="btn" pendingLabel="Marking…">Mark as closed / won</SubmitButton>
              </form>
            </>
          )}
        </div>
      )}

      {isAdmin ? (
        <div className="card" style={{ borderColor: 'var(--red)' }}>
          <h3 style={{ color: 'var(--red)' }}>Danger zone</h3>
          <details>
            <summary className="small" style={{ cursor: 'pointer' }}>Delete this lead</summary>
            <p className="small muted" style={{ marginTop: 8 }}>
              Permanently removes this lead and its activities &amp; follow-ups. Any closed deals are kept (just unlinked). This can&apos;t be undone.
            </p>
            <form action={deleteLead}>
              <input type="hidden" name="lead_id" value={lead.id} />
              <button className="btn" type="submit" style={{ background: 'var(--red)' }}>Delete lead permanently</button>
            </form>
          </details>
        </div>
      ) : null}
    </div>
  );
}
