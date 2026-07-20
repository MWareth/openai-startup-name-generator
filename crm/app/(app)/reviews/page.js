import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { SENIORITY_NAMES } from '@/lib/format';
import { scoreColor } from '@/lib/reviews';
import { getOnboardingConfig } from '@/lib/onboarding';
import { createAdminClient } from '@/lib/supabase/admin';
import { updateOnboardingConfig } from '../admin/actions';

export const dynamic = 'force-dynamic';

export default async function ReviewsPage({ searchParams }) {
  const { supabase } = await requireAdmin();
  const onboarding = await getOnboardingConfig(createAdminClient());

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
      const avg = e && e.n ? Math.round(e.sum / e.n) : 0;
      return { ...a, avg, count: e?.n || 0 };
    })
    .sort((a, b) => b.avg - a.avg);

  return (
    <div className="stack">
      <div>
        <h1>Agent KPIs</h1>
        <p className="muted">
          Private to management. Rate each agent across the KPI scorecard; the score is out of 100,
          each category weighted equally, averaged over their scorecards. Agents cannot see these.
        </p>
      </div>

      {searchParams?.ok ? <div className="alert ok">{searchParams.ok}</div> : null}

      {/* Newcomer 4-week program targets (editable) */}
      <details className="card panel">
        <summary><h2 style={{ display: 'inline' }}>🌱 Newcomer supporting-number targets</h2></summary>
        <div className="panel-body">
          <p className="small muted" style={{ marginTop: 0 }}>
            The newcomer program itself is the fixed 4-week checklist (shown on each newcomer&apos;s KPI page and their
            🌱 My Program page). These three numbers are the <strong>supporting evidence row</strong> under it. Set a
            person&apos;s joining date on the <Link href="/admin">Team page</Link> to start their program.
          </p>
          <form action={updateOnboardingConfig} className="form-grid">
            <div className="field">
              <label>Leads worked / week</label>
              <input name="weekly_leads" type="number" min="0" defaultValue={onboarding.weekly_leads} />
            </div>
            <div className="field">
              <label>Follow-ups done / week</label>
              <input name="weekly_followups" type="number" min="0" defaultValue={onboarding.weekly_followups} />
            </div>
            <div className="field">
              <label>Respond to new leads within (minutes)</label>
              <input name="target_response_min" type="number" min="0" defaultValue={onboarding.target_response_min} />
            </div>
            <div className="field" style={{ alignSelf: 'flex-end' }}>
              <button className="btn secondary" type="submit">Save targets</button>
            </div>
          </form>
        </div>
      </details>

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Agent</th><th>Level</th><th>Score</th><th>Scorecards</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td><Link href={`/reviews/${a.id}`}>{a.full_name}</Link></td>
                <td className="small muted">{SENIORITY_NAMES[a.seniority] || a.seniority}</td>
                <td>
                  {a.count ? (
                    <span style={{ color: scoreColor(a.avg), fontWeight: 700, fontSize: '1.05rem' }}>
                      {a.avg}<span className="muted small" style={{ fontWeight: 500 }}> / 100</span>
                    </span>
                  ) : (
                    <span className="muted small">Not rated yet</span>
                  )}
                </td>
                <td className="small muted">{a.count}</td>
                <td className="right"><Link className="small" href={`/reviews/${a.id}`}>Rate / history →</Link></td>
              </tr>
            ))}
            {rows.length === 0 ? <tr><td colSpan={5} className="muted">No agents to score yet.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
