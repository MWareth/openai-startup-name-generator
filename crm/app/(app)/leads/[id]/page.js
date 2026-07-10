import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser, hasStaffAccess, hasMarketingAccess, canRouteLeads, canCarryLeads } from '@/lib/auth';
import SubmitButton from '@/components/SubmitButton';
import {
  QUAL_LABELS,
  STATUS_LABELS,
  PIPELINE_ORDER,
  ACTIVITY_LABELS,
  formatDate,
  aed,
  waLink,
  DEAL_PROPERTY_TYPES,
} from '@/lib/format';
import { addActivity, updateLeadDetails, deleteLead, suggestReassign, logDeal, markLeadWon, markLeadFake } from '../actions';
import DictateField from '@/components/DictateField';
import TranslateButton from '@/components/TranslateButton';
import DealMoneyFields from '@/components/DealMoneyFields';
import MoneyInput from '@/components/MoneyInput';
import DateField from '@/components/DateField';
import LeadProgress from '@/components/LeadProgress';
import QualStatusForm from '@/components/QualStatusForm';

export const dynamic = 'force-dynamic';

export default async function LeadDetail({ params, searchParams }) {
  const { user, profile, supabase } = await requireUser();
  const isAdmin = hasStaffAccess(profile); // admin + support: money + direct reassign
  const isMarketing = hasMarketingAccess(profile); // triages leads, no money
  const canRoute = canRouteLeads(profile); // admin + support + marketing route leads directly
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

  // Lead progress stepper, driven by the lead's real Status through the sales
  // pipeline (New → Contacted → Viewing → Negotiation → Closed). The stage the
  // agent is currently on is highlighted; earlier stages are ticked done.
  let reached;
  let leadLost = false;
  if (lead.status === 'won') reached = PIPELINE_ORDER.length - 1; // all done
  else if (lead.status === 'lost') { reached = -1; leadLost = true; }
  else reached = PIPELINE_ORDER.indexOf(lead.status) - 1; // current stage = highlighted

  // Contact fields: agents may only fill blanks (a filled field is locked);
  // admin/support can change anything.
  const lockField = (v) => !isAdmin && v != null && String(v).trim() !== '';
  const contactAllFilled = [lead.name, lead.phone, lead.email, lead.source, lead.budget, lead.community, lead.property_interest]
    .every((v) => v != null && String(v).trim() !== '');
  const canSaveContact = isAdmin || !contactAllFilled;

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

  // Follow-up due date, with the calling time if one was set.
  const fmtDue = (f) => {
    if (f.due_at) {
      const time = new Intl.DateTimeFormat('en-GB', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Dubai' }).format(new Date(f.due_at));
      return `${formatDate(f.due_on)} · ${time}`;
    }
    return formatDate(f.due_on);
  };

  // Timeline rows as clean bullet points (newest first).
  const timelineRows = timeline.map((item) => {
    if (item.kind === 'activity') {
      const a = item.data;
      const icon = a.type === 'call' || a.type === 'call_update' ? '📞'
        : a.type === 'meeting' ? '🤝' : a.type === 'viewing' ? '🏠' : '📝';
      return { key: item.key, icon, title: ACTIVITY_LABELS[a.type] || 'Activity', when: a.occurred_on, note: a.body, by: a.agent?.full_name, translate: a.body };
    }
    if (item.kind === 'fu_scheduled') {
      const f = item.data;
      return { key: item.key, icon: '📅', title: 'Follow-up scheduled', when: f.created_at, note: `Due ${fmtDue(f)}${f.note ? ' — ' + f.note : ''}` };
    }
    const f = item.data;
    return { key: item.key, icon: '✅', title: 'Follow-up done', when: f.done_at, note: `Was due ${fmtDue(f)}` };
  });

  // Other agents to suggest the lead to (non-selling admins like Zoheb excluded).
  const { data: agentsRaw } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['agent', 'admin'])
    .neq('id', user.id)
    .order('full_name');
  const agents = (agentsRaw || []).filter(canCarryLeads);

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

      {/* Timeline — step-by-step at the top of the page. */}
      <div className="card">
        <h3>Timeline</h3>
        {timelineRows.length ? (
          <ul className="timeline">
            {timelineRows.map((r) => (
              <li key={r.key} className="timeline-item">
                <span className="ti-dot">{r.icon}</span>
                <div className="ti-body">
                  <div className="ti-head">
                    <strong>{r.title}</strong>
                    <span className="small muted">{formatDate(r.when)}</span>
                  </div>
                  {r.note ? <div className="small" style={{ marginTop: 2, whiteSpace: 'pre-wrap' }}>{r.note}</div> : null}
                  {r.translate ? <TranslateButton text={r.translate} /> : null}
                  {r.by ? <div className="small muted" style={{ marginTop: 2 }}>{r.by}</div> : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">No activity yet. Log the first call or meeting below.</p>
        )}
      </div>

      <div className="grid grid-2">
        {/* Left column */}
        <div className="stack">
          <div className="card">
            <h3>Contact details</h3>
            {!isAdmin ? (
              <p className="small muted" style={{ marginTop: 0 }}>
                You can fill in blank fields. Details already saved are locked — ask an admin to change them.
              </p>
            ) : null}
            <form action={updateLeadDetails} className="stack" style={{ gap: 10 }}>
              <input type="hidden" name="lead_id" value={lead.id} />
              <div className="field"><label>Full name</label>
                <input name="name" defaultValue={lead.name} required readOnly={lockField(lead.name)} className={lockField(lead.name) ? 'locked' : undefined} />
              </div>
              <div className="form-grid">
                <div className="field"><label>Phone</label>
                  <input name="phone" defaultValue={lead.phone || ''} inputMode="tel" autoComplete="off" readOnly={lockField(lead.phone)} className={lockField(lead.phone) ? 'locked' : undefined} />
                </div>
                <div className="field"><label>Email</label>
                  <input name="email" type="email" defaultValue={lead.email || ''} readOnly={lockField(lead.email)} className={lockField(lead.email) ? 'locked' : undefined} />
                </div>
              </div>
              <div className="form-grid">
                <div className="field">
                  <label>Source</label>
                  <input name="source" defaultValue={lead.source || ''} list="lead-source-options" autoComplete="off" readOnly={lockField(lead.source)} className={lockField(lead.source) ? 'locked' : undefined} />
                  <datalist id="lead-source-options">
                    <option value="Cold Call" /><option value="Instagram" /><option value="Referral" />
                    <option value="Bayut" /><option value="Property Finder" /><option value="Website" />
                    <option value="WhatsApp" /><option value="Walk-in" />
                  </datalist>
                </div>
                <div className="field"><label>Budget (AED)</label>
                  <MoneyInput name="budget" defaultValue={lead.budget || ''} readOnly={lockField(lead.budget)} className={lockField(lead.budget) ? 'locked' : undefined} />
                </div>
              </div>
              <div className="form-grid">
                <div className="field"><label>Community / area</label>
                  <input name="community" defaultValue={lead.community || ''} readOnly={lockField(lead.community)} className={lockField(lead.community) ? 'locked' : undefined} />
                </div>
                <div className="field"><label>Building / project</label>
                  <input name="property_interest" defaultValue={lead.property_interest || ''} readOnly={lockField(lead.property_interest)} className={lockField(lead.property_interest) ? 'locked' : undefined} />
                </div>
              </div>
              {canSaveContact ? <button className="btn secondary small" type="submit">Save details</button> : null}
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
          </div>

          <div className="card">
            <h3>Qualification & status</h3>
            <QualStatusForm
              leadId={lead.id}
              qualification={lead.qualification}
              status={lead.status}
              propertyType={lead.property_type}
              bedrooms={lead.bedrooms}
            />
            {lead.status !== 'lost' ? (
              <form action={markLeadFake} style={{ marginTop: 10 }}>
                <input type="hidden" name="lead_id" value={lead.id} />
                <button className="btn ghost small" type="submit" style={{ borderColor: 'var(--red)', color: 'var(--red)' }}>
                  🚫 Flag as fake / spam
                </button>
              </form>
            ) : null}
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
                <label>Set next follow-up — date &amp; time (optional)</label>
                <input type="datetime-local" name="next_follow_up" />
              </div>
              <SubmitButton className="btn small" pendingLabel="Saving…">Add activity</SubmitButton>
            </form>
          </div>

        </div>
      </div>

      {/* Deal section — hidden from Marketing (no money); staff enter the deal. */}
      {isMarketing ? null : isAdmin ? (
      <div className="card">
        <h3>Close a deal</h3>
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
              Own referral — agent brought this lead
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

      {/* Reassignment — Admin / Support / Marketing only (hidden from agents). */}
      {canRoute ? (
        <div className="card">
          <h3>Reassign lead</h3>
          <p className="small muted">
            Assign this lead to another agent, or send it to the Lead Pool. Takes effect immediately.
          </p>
          <form action={suggestReassign}>
            <input type="hidden" name="lead_id" value={lead.id} />
            <div className="field">
              <select name="suggested_agent_id" defaultValue={lead.assigned?.id || ''}>
                <option value="">📥 Lead Pool (unassign)</option>
                {(agents || []).map((a) => (
                  <option key={a.id} value={a.id}>{a.full_name}</option>
                ))}
              </select>
            </div>
            <button className="btn secondary small" type="submit">Reassign</button>
          </form>
        </div>
      ) : null}

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
