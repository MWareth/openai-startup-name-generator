import Link from 'next/link';
import { requireUser, hasAdminAccess } from '@/lib/auth';
import { QUAL_LABELS, STATUS_LABELS, formatDate } from '@/lib/format';
import LeadFilters from '@/components/LeadFilters';

export const dynamic = 'force-dynamic';

export default async function LeadsPage({ searchParams }) {
  const { profile, supabase } = await requireUser();
  const isAdmin = hasAdminAccess(profile);
  const ok = searchParams?.ok;
  const error = searchParams?.error;

  const values = {
    name: searchParams?.name || '',
    agent: searchParams?.agent || '',
    type: searchParams?.type || '',
    beds: searchParams?.beds || '',
    qual: searchParams?.qual || '',
    status: searchParams?.status || '',
    budget: searchParams?.budget || '',
    sort: searchParams?.sort || 'recent',
  };

  // Agents (and the selling owner) for the Agent filter dropdown.
  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('role', ['agent', 'admin'])
    .order('full_name');

  let q = supabase
    .from('leads')
    .select(
      '*, assigned:profiles!leads_assigned_agent_id_fkey(full_name), suggested:profiles!leads_suggested_agent_id_fkey(full_name)'
    );

  if (values.name) q = q.ilike('name', `%${values.name}%`);
  if (values.agent) q = q.eq('assigned_agent_id', values.agent);
  if (values.type) q = q.eq('property_type', values.type);
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
    default:
      q = q.order('updated_at', { ascending: false });
  }

  const { data: leads } = await q;

  // Distinct client names (visible to this user) for the search autocomplete.
  const { data: nameRows } = await supabase
    .from('leads')
    .select('name')
    .order('name', { ascending: true });
  const names = [...new Set((nameRows || []).map((r) => r.name).filter(Boolean))];

  return (
    <div className="stack">
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}
      <div className="spread">
        <div>
          <h1>Leads</h1>
          <p className="muted">{isAdmin ? 'All leads across the team.' : 'Leads assigned to you.'}</p>
        </div>
        <Link className="btn" href="/leads/new">+ New lead</Link>
      </div>

      <LeadFilters agents={agents || []} values={values} names={names} />

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {leads && leads.length ? (
          <table>
            <thead>
              <tr>
                <th>Added</th>
                <th>Name</th>
                <th>Qual</th>
                <th>Status</th>
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
            No leads match these filters. <Link href="/leads">Clear filters</Link> or{' '}
            <Link href="/leads/new">add a lead</Link>.
          </div>
        )}
      </div>
    </div>
  );
}
