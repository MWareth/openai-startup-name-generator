import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { SENIORITY_NAMES } from '@/lib/format';
import { starString } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage() {
  const { supabase } = await requireAdmin();

  const { data: agents } = await supabase
    .from('profiles')
    .select('id, full_name, seniority')
    .eq('role', 'agent')
    .order('full_name');

  const { data: reviews } = await supabase
    .from('agent_reviews')
    .select('agent_id, overall');

  // Average + count per agent.
  const byAgent = new Map();
  for (const r of reviews || []) {
    const e = byAgent.get(r.agent_id) || { sum: 0, n: 0 };
    e.sum += Number(r.overall || 0);
    e.n += 1;
    byAgent.set(r.agent_id, e);
  }

  const rows = (agents || [])
    .map((a) => {
      const e = byAgent.get(a.id);
      const avg = e && e.n ? e.sum / e.n : 0;
      return { ...a, avg, count: e?.n || 0 };
    })
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="stack">
      <div>
        <h1>Agent reviews</h1>
        <p className="muted">
          Private to management. Rate each agent across criteria; the score is the average of all
          their reviews. Agents cannot see these.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Agent</th><th>Level</th><th>Average</th><th>Reviews</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/reviews/${a.id}`}>{a.full_name}</Link></td>
                <td className="small muted">{SENIORITY_NAMES[a.seniority] || a.seniority}</td>
                <td>
                  {a.count ? (
                    <span title={`${a.avg.toFixed(2)} / 5`}>
                      <span style={{ color: 'var(--gold)', letterSpacing: 1 }}>{starString(a.avg)}</span>{' '}
                      <span className="small muted">{a.avg.toFixed(1)}</span>
                    </span>
                  ) : (
                    <span className="muted small">Not rated yet</span>
                  )}
                </td>
                <td className="small muted">{a.count}</td>
                <td className="right"><Link className="small" href={`/reviews/${a.id}`}>Rate / history →</Link></td>
              </tr>
            ))}
            {rows.length === 0 ? <tr><td colSpan={5} className="muted">No agents to review yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
