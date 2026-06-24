import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { QUAL_LABELS, STATUS_LABELS, formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function LeadsPage() {
  const { profile, supabase } = await requireUser();
  const isAdmin = profile?.role === 'admin';

  const { data: leads } = await supabase
    .from('leads')
    .select(
      '*, assigned:profiles!leads_assigned_agent_id_fkey(full_name), suggested:profiles!leads_suggested_agent_id_fkey(full_name)'
    )
    .order('updated_at', { ascending: false });

  return (
    <div className="stack">
      <div className="spread">
        <div>
          <h1>Leads</h1>
          <p className="muted">{isAdmin ? 'All leads across the team.' : 'Leads assigned to you.'}</p>
        </div>
        <Link className="btn" href="/leads/new">+ New lead</Link>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        {leads && leads.length ? (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Qual</th>
                <th>Status</th>
                <th>Property / Budget</th>
                {isAdmin ? <th>Assigned</th> : null}
                <th>Suggested</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td>
                    <Link href={`/leads/${l.id}`}>{l.name}</Link>
                    {l.phone ? <div className="small muted">{l.phone}</div> : null}
                  </td>
                  <td><span className={`badge ${l.qualification}`}>{QUAL_LABELS[l.qualification]}</span></td>
                  <td><span className={`badge ${l.status === 'won' ? 'won' : l.status === 'lost' ? 'lost' : 'status'}`}>{STATUS_LABELS[l.status]}</span></td>
                  <td className="small">
                    {l.property_interest || <span className="muted">—</span>}
                    {l.budget ? <div className="muted">AED {Number(l.budget).toLocaleString()}</div> : null}
                  </td>
                  {isAdmin ? <td className="small">{l.assigned?.full_name || <span className="muted">Unassigned</span>}</td> : null}
                  <td className="small">{l.suggested?.full_name ? <span className="badge role">→ {l.suggested.full_name}</span> : <span className="muted">—</span>}</td>
                  <td className="small muted">{formatDate(l.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: 24 }} className="muted">
            No leads yet. <Link href="/leads/new">Add your first lead</Link>.
          </div>
        )}
      </div>
    </div>
  );
}
