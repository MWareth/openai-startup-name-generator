import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { formatDate, pct, SENIORITY_NAMES } from '@/lib/format';
import { starString, starsFromTargetFraction, scoreOutOf100, scoreColor, groupByCategory } from '@/lib/reviews';
import { computeKpiStats } from '@/lib/audit';
import { computeNewcomerProgress, getOnboardingConfig, currentWeek } from '@/lib/onboarding';
import { getTargetProgress } from '@/lib/targets';
import SubmitButton from '@/components/SubmitButton';
import DateField from '@/components/DateField';
import StarRating from '@/components/StarRating';
import { createReview, deleteReview } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AgentReviewPage({ params, searchParams }) {
  const { supabase } = await requireAdmin();
  const ok = searchParams?.ok;
  const error = searchParams?.error;
  const today = new Date().toISOString().slice(0, 10);

  const { data: agent } = await supabase
    .from('profiles')
    .select('id, full_name, seniority, role, joined_on')
    .eq('id', params.id)
    .single();
  if (!agent) notFound();

  const { data: criteria } = await supabase
    .from('review_criteria')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  // Auto-suggest the "goal achievement" star from the agent's active target %.
  const { data: target } = await supabase
    .from('targets')
    .select('*')
    .eq('agent_id', agent.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const progress = target ? await getTargetProgress(supabase, target) : null;
  const goalStars = progress ? starsFromTargetFraction(progress.progress) : null;

  const { data: reviews } = await supabase
    .from('agent_reviews')
    .select('*, reviewer:profiles!agent_reviews_reviewer_id_fkey(full_name), agent_review_scores(criterion, stars)')
    .eq('agent_id', agent.id)
    .order('reviewed_on', { ascending: false })
    .order('created_at', { ascending: false });

  const overalls = (reviews || []).map((r) => Number(r.overall) || 0);
  const avg = overalls.length ? Math.round(overalls.reduce((a, b) => a + b, 0) / overalls.length) : 0;
  const grouped = groupByCategory(criteria);

  const adminCli = createAdminClient();

  // Newcomer 4-week KPI — shown during (and just after) the first month.
  let newcomer = null;
  if (agent.joined_on && currentWeek(agent.joined_on) <= 6) {
    const config = await getOnboardingConfig(adminCli);
    const weeks = await computeNewcomerProgress(adminCli, { agentId: agent.id, joinedOn: agent.joined_on, config });
    newcomer = { config, weeks, week: currentWeek(agent.joined_on) };
  }

  // Auto-counted evidence for THIS quarter — real actions to rate against.
  const now = new Date();
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  const stats = await computeKpiStats(adminCli, { agentId: agent.id, startIso: quarterStart.toISOString() });
  const evidence = [
    ['Leads touched', stats.leadsTouched],
    ['📞 Calls', stats.calls],
    ['🤝 Meetings', stats.meetings],
    ['🏠 Viewings', stats.viewings],
    ['📝 Notes', stats.notes],
    ['📅 Follow-ups set', stats.followupsSet],
    ['✅ Follow-ups done', stats.followupsDone],
    ['🔀 Status changes', stats.statusChanges],
    ['✏️ Contact edits', stats.contactEdits],
  ];

  return (
    <div className="stack">
      <div>
        <Link className="small muted" href="/reviews">← All KPIs</Link>
        <div className="spread">
          <h1>{agent.full_name}</h1>
          <div className="right">
            {reviews && reviews.length ? (
              <>
                <div style={{ color: scoreColor(avg), fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }}>
                  {avg}<span className="muted" style={{ fontSize: '1rem', fontWeight: 500 }}> / 100</span>
                </div>
                <div className="small muted">{reviews.length} scorecard(s)</div>
              </>
            ) : (
              <span className="muted small">Not rated yet</span>
            )}
          </div>
        </div>
        <p className="muted small">{SENIORITY_NAMES[agent.seniority] || agent.seniority} · private to management</p>
      </div>
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      {/* Newcomer 4-week KPI (first month) */}
      {newcomer ? (
        <div className="card" style={{ borderColor: 'var(--gold)' }}>
          <div className="spread">
            <h3 style={{ margin: 0 }}>🌱 Newcomer 4-week KPI</h3>
            <span className="small muted">
              Joined {formatDate(agent.joined_on)} · {newcomer.week > 4 ? 'first month complete' : `week ${newcomer.week} of 4`}
            </span>
          </div>
          <p className="small muted" style={{ marginTop: 4 }}>
            Targets/week — {newcomer.config.weekly_leads} leads worked · {newcomer.config.weekly_followups} follow-ups done · respond to new leads in ≤ {newcomer.config.target_response_min} min.
            <Link className="small" href="/reviews" style={{ marginLeft: 6 }}>Edit targets →</Link>
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr><th>Week</th><th>Leads worked</th><th>Follow-ups done</th><th>Avg response</th></tr>
              </thead>
              <tbody>
                {newcomer.weeks.map((w) => {
                  const cell = (ok) => (ok == null ? 'var(--muted)' : ok ? '#16a34a' : '#dc2626');
                  return (
                    <tr key={w.week}>
                      <td className="small">
                        <strong>Week {w.week}</strong>
                        <div className="small muted">{formatDate(w.from.toISOString().slice(0, 10))}</div>
                      </td>
                      <td style={{ color: cell(w.leadsOk), fontWeight: 700 }}>{w.leadsWorked} <span className="small muted" style={{ fontWeight: 500 }}>/ {newcomer.config.weekly_leads}</span></td>
                      <td style={{ color: cell(w.followupsOk), fontWeight: 700 }}>{w.followupsDone} <span className="small muted" style={{ fontWeight: 500 }}>/ {newcomer.config.weekly_followups}</span></td>
                      <td style={{ color: cell(w.responseOk), fontWeight: 700 }}>
                        {w.avgResponseMin == null ? <span className="small muted">—</span> : <>{w.avgResponseMin}m <span className="small muted" style={{ fontWeight: 500 }}>/ ≤{newcomer.config.target_response_min}m</span></>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Auto-counted evidence — the real numbers to rate against */}
      <div className="card">
        <div className="spread">
          <h3 style={{ margin: 0 }}>📊 Auto evidence · this quarter</h3>
          <span className="small">
            <Link href={`/one-on-one?agent=${agent.id}&period=quarter`}>📋 1:1 report</Link>
            {' · '}
            <Link href={`/activity?agent=${agent.id}&period=quarter`}>Full activity log →</Link>
          </span>
        </div>
        <p className="small muted" style={{ marginTop: 4 }}>Real actions recorded on leads — rate the KPIs below with these in front of you.</p>
        <div className="row" style={{ gap: 18, flexWrap: 'wrap', alignItems: 'flex-end', marginTop: 6 }}>
          {evidence.map(([label, val]) => (
            <div key={label}>
              <div className="small muted">{label}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{val}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-2">
        {/* New scorecard */}
        <div className="card">
          <div className="spread">
            <h3>New scorecard</h3>
            <Link className="small" href="/reviews/criteria">Manage KPIs →</Link>
          </div>
          <p className="small muted" style={{ marginTop: 0 }}>
            Rate each KPI 1–5 stars, or leave it <strong>N/A</strong> if it doesn&apos;t apply yet.
            Score is out of 100, each category weighted equally.
          </p>
          {progress ? (
            <p className="small muted">
              Target progress: <strong>{pct(progress.progress)}</strong>
              {goalStars ? <> → “Bookings / units sold” pre-filled to {goalStars}★ (you can change it)</> : null}
            </p>
          ) : null}
          <form action={createReview}>
            <input type="hidden" name="agent_id" value={agent.id} />
            <div className="form-grid">
              <div className="field">
                <label>Period</label>
                <input name="period_label" placeholder="e.g. Q2 2026, June" />
              </div>
              <div className="field">
                <label>Date</label>
                <DateField name="reviewed_on" defaultValue={today} />
              </div>
            </div>
            {grouped.map(({ category, items }) => (
              <div key={category} style={{ marginTop: 14 }}>
                <div className="small" style={{ fontWeight: 700, color: 'var(--gold-2)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>
                  {category}
                </div>
                {items.map((c) => {
                  const preset = c.auto_from_target && goalStars ? String(goalStars) : '';
                  return (
                    <div className="kpi-item" key={c.id}>
                      <div className="kpi-label">
                        <div className="name">{c.label}</div>
                        {c.hint ? <div className="small muted">{c.hint}</div> : null}
                      </div>
                      <StarRating name={`crit_${c.id}`} defaultValue={preset} />
                    </div>
                  );
                })}
              </div>
            ))}
            <div className="field" style={{ marginTop: 14 }}>
              <label>Comment (optional)</label>
              <textarea name="comment" placeholder="Strengths, areas to improve, notes for the review meeting…" />
            </div>
            <SubmitButton className="btn" pendingLabel="Saving…">Save scorecard</SubmitButton>
          </form>
        </div>

        {/* History */}
        <div className="card">
          <h3>Scorecard history</h3>
          {reviews && reviews.length ? (
            <div className="stack" style={{ gap: 12 }}>
              {reviews.map((r) => (
                <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  <div className="spread">
                    <div>
                      <strong>{r.period_label || 'Scorecard'}</strong>{' '}
                      <span style={{ color: scoreColor(r.overall), fontWeight: 700 }}>{Math.round(Number(r.overall) || 0)}</span>
                      <span className="small muted"> / 100</span>
                    </div>
                    <span className="small muted">{formatDate(r.reviewed_on)}</span>
                  </div>
                  <div className="small" style={{ marginTop: 4 }}>
                    {(r.agent_review_scores || []).map((s, i) => (
                      <div key={i} className="spread" style={{ maxWidth: 360 }}>
                        <span className="muted">{s.criterion}</span>
                        <span style={{ color: 'var(--gold)' }}>{starString(s.stars)}</span>
                      </div>
                    ))}
                  </div>
                  {r.comment ? <div className="small" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{r.comment}</div> : null}
                  <div className="spread" style={{ marginTop: 6 }}>
                    <span className="small muted">by {r.reviewer?.full_name || '—'}</span>
                    <div className="row" style={{ gap: 8 }}>
                      <Link className="btn ghost small" href={`/reviews/edit/${r.id}`}>Edit</Link>
                      <form action={deleteReview}>
                        <input type="hidden" name="review_id" value={r.id} />
                        <input type="hidden" name="agent_id" value={agent.id} />
                        <button className="btn ghost small" type="submit">Delete</button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="muted small">No scorecards yet. Add the first one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
