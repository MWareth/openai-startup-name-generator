import Link from 'next/link';
import { requireUser, canRouteLeads } from '@/lib/auth';
import { QUAL_LABELS, STATUS_LABELS, formatDate } from '@/lib/format';
import LeadFilters from '@/components/LeadFilters';
import { originMeta, deriveOrigin } from '@/lib/leadOrigin';
import OriginPicker from '@/components/OriginPicker';

export const dynamic = 'force-dynamic';

export default async function LeadsPage({ searchParams }) {
  const { profile, supabase } = await requireUser();
  const isAdmin = canRouteLeads(profile); // admin + support + marketing see all leads + assigned column
  const ok = searchParams?.ok;
  const error = searchParams?.error;

  const values = {
    name: searchParams?.name || '',
    agent: searchParams?.agent || '',
    type: searchParams?.type || '',
    beds: searchParams?.beds || '',
    project: searchParams?.project || '',
    qual: searchParams?.qual || '',
    status: searchParams?.status || '',
    budget: searchParams?.budget || '',
    sort: searchParams?.sort || 'recent',
    origin: searchParams?.origin || '',
  };

  // Agents (and the selling owner) for the Agent filter dropdown.
  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['agent', 'admin'])
    .order('full_name');

  // Fake / spam leads are hidden from everyone's working list. Staff can pull
  // them up with ?fake=1 to review or un-flag; they stay in the DB either way
  // so the marketing report can still count them.
  const showingFake = isAdmin && searchParams?.fake === '1';
  const activeOrigin = originMeta(searchParams?.origin || '');

  // Built as a function so the whole query can be re-run without the is_fake
  // filter if migration 0037 hasn't been applied — the Leads list must never
  // break over an optional column.
  const buildQuery = (withFakeFilter, withOrigin = true) => {
    let q = supabase
      .from('leads')
      .select(
        '*, assigned:profiles!leads_assigned_agent_id_fkey(full_name), suggested:profiles!leads_suggested_agent_id_fkey(full_name)'
      );
    if (withFakeFilter) {
      if (showingFake) q = q.eq('is_fake', true);
      else q = q.or('is_fake.is.null,is_fake.eq.false');
    }
    return applyFilters(q, withOrigin);
  };

  const applyFilters = (q0, withOrigin = true) => {
    let q = q0;
    if (withOrigin && values.origin) q = q.eq('origin', values.origin);
    if (values.name) q = q.ilike('name', `%${values.name}%`);
    if (values.agent) q = q.eq('assigned_agent_id', values.agent);
    if (values.type) q = q.eq('property_type', values.type);
    if (values.project) q = q.ilike('property_interest', `%${values.project}%`);
    if (values.beds) q = q.eq('bedrooms', values.beds);
    if (values.qual) q = q.eq('qualification', values.qual);
    if (values.status) q = q.eq('status', values.status);

    if (values.budget === 'lt1m') q = q.lt('budget', 1000000);
    else if (values.budget === '1-2m') q = q.gte('budget', 1000000).lt('budget', 2000000);
    else if (values.budget === '2-5m') q = q.gte('budget', 2000000).lt('budget', 5000000);
    else if (values.budget === '5m+') q = q.gte('budget', 5000000);

    switch (values.sort) {
      case 'new':
        q = q.order('created_at', { ascending: false });
        break;
      case 'old':
        q = q.order('created_at', { ascending: true });
        break;
      case 'name':
        q = q.order('name', { ascending: true });
        break;
      case 'name_desc':
        q = q.order('name', { ascending: false });
        break;
      case 'budget_high':
        q = q.order('budget', { ascending: false, nullsFirst: false });
        break;
      case 'budget_low':
        q = q.order('budget', { ascending: true, nullsFirst: false });
        break;
      case 'project':
        q = q.order('property_interest', { ascending: true, nullsFirst: false });
        break;
      default:
        q = q.order('updated_at', { ascending: false });
    }
    return q;
  };

  let { data: leads, error: leadsErr } = await buildQuery(true);
  if (leadsErr && /is_fake/.test(leadsErr.message || '')) {
    ({ data: leads, error: leadsErr } = await buildQuery(false)); // migration 0037 not applied yet
  }
  // Migration 0040 not applied yet. The filter could not be applied, so the
  // ONLY honest answer for a filtered tab is an empty list: falling back to the
  // unfiltered query would show every lead under a "Follow Ups" heading, which
  // reads as "these are all follow-ups" and is worse than showing nothing.
  let originUnavailable = false;
  if (leadsErr && /origin/.test(leadsErr.message || '')) {
    originUnavailable = true;
    leads = [];
  }

  // Distinct client names (visible to this user) for the search autocomplete.
  const { data: nameRows } = await supabase
    .from('leads')
    .select('name')
    .order('name', { ascending: true });
  const names = [...new Set((nameRows || []).map((r) => r.name).filter(Boolean))];

  // Project options for the filter: every project already on a lead, plus the
  // directory, so agents can pick a name instead of guessing the spelling.
  const [{ data: projectRows }, { data: dirProjects }] = await Promise.all([
    supabase.from('leads').select('property_interest'),
    supabase.from('projects').select('name').then((r) => r, () => ({ data: [] })),
  ]);
  const projects = [
    ...new Set([
      ...(projectRows || []).map((r) => r.property_interest),
      ...(dirProjects || []).map((r) => r.name),
    ].map((s) => (s || '').trim()).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b));

  return (
    <div className="stack">
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}
      <div className="spread">
        <div>
          <h1>
            {showingFake ? '🚫 Fake / spam leads' : activeOrigin ? `${activeOrigin.icon} ${activeOrigin.tab}` : 'Recent Leads'}
          </h1>
          <p className="muted">
            {showingFake
              ? 'Flagged as junk and hidden from the working list — still counted in the marketing report.'
              : activeOrigin
                ? `${activeOrigin.hint} Tagged from Recent Leads or when the lead is added.`
                : isAdmin
                  ? 'Every lead across the team. Tag one as a follow-up or a cold lead with the “Type of lead” column.'
                  : 'Every lead assigned to you. Tag one as a follow-up or a cold lead with the “Type of lead” column.'}
          </p>
        </div>
        <div className="row" style={{ gap: 8 }}>
          {showingFake ? (
            <Link className="btn secondary" href="/leads">← Back to leads</Link>
          ) : (
            <>
              {isAdmin ? <Link className="btn secondary" href="/leads?fake=1">🚫 Fake / spam</Link> : null}
              {isAdmin ? <Link className="btn secondary" href="/leads/import">⬆️ Import</Link> : null}
              <Link className="btn secondary" href="/leads/paste">📋 Paste lead</Link>
              <Link className="btn" href="/leads/new">+ New lead</Link>
            </>
          )}
        </div>
      </div>

      {originUnavailable ? (
        <div className="alert" style={{ background: '#fde4e4', border: '1px solid var(--red)', color: '#7f1d1d', padding: '10px 14px', borderRadius: 10 }}>
          <strong>⚠️ Lead types are not set up yet.</strong> Run migration{' '}
          <code>0040_lead_origin.sql</code> to switch this on. Showing nothing rather than
          every lead, which would look like they were all {activeOrigin?.tab?.toLowerCase() || 'tagged'}.
        </div>
      ) : null}

      <LeadFilters agents={agents || []} values={values} names={names} projects={projects} />

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {leads && leads.length ? (
          <table>
            <thead>
              <tr>
                <th>Added</th>
                <th>Name</th>
                <th>Qual</th>
                <th>Status</th>
                <th>Type of lead</th>
                <th>Type</th>
                <th>Bedrooms</th>
                <th>Project</th>
                <th>Budget</th>
                {isAdmin ? <th>Assigned</th> : null}
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td className="small muted" style={{ whiteSpace: 'nowrap' }}>{formatDate(l.created_at)}</td>
                  <td>
                    <Link href={`/leads/${l.id}`}>{l.name}</Link>
                    {l.phone ? <div className="small muted">{l.phone}</div> : null}
                    {l.email ? <div className="small muted">{l.email}</div> : null}
                  </td>
                  <td><span className={`badge ${l.qualification}`}>{QUAL_LABELS[l.qualification]}</span></td>
                  <td><span className={`badge ${l.status === 'won' ? 'won' : l.status === 'lost' ? 'lost' : 'status'}`}>{STATUS_LABELS[l.status]}</span></td>
                  <td><OriginPicker leadId={l.id} leadName={l.name} value={l.origin || deriveOrigin(l.source)} /></td>
                  <td className="small">{l.property_type || <span className="muted">—</span>}</td>
                  <td className="small">{l.bedrooms || <span className="muted">—</span>}</td>
                  <td className="small">{l.property_interest || <span className="muted">—</span>}</td>
                  <td className="small">{l.budget ? `AED ${Number(l.budget).toLocaleString()}` : <span className="muted">—</span>}</td>
                  {isAdmin ? <td className="small">{l.assigned?.full_name || <span className="muted">Unassigned</span>}</td> : null}
                  <td className="small muted">{formatDate(l.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 24 }} className="muted">
            {activeOrigin && !originUnavailable ? (
              <>
                Nothing here yet. A lead appears in {activeOrigin.tab} once it&apos;s tagged{' '}
                <strong>{activeOrigin.icon} {activeOrigin.label}</strong> — set that in the{' '}
                “Type of lead” column on <Link href="/leads">Recent Leads</Link>, or when you{' '}
                <Link href="/leads/new">add the lead</Link>.
              </>
            ) : (
              <>
                No leads match these filters. <Link href="/leads">Clear filters</Link> or{' '}
                <Link href="/leads/new">add a lead</Link>.
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
