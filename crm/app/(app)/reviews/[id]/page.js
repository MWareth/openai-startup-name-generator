import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { formatDate, pct, SENIORITY_NAMES } from '@/lib/format';
import { starString, starsFromTargetFraction, scoreOutOf100, scoreColor, groupByCategory } from '@/lib/reviews';
import { getTargetProgress } from '@/lib/targets';
import SubmitButton from '@/components/SubmitButton';
import DateField from '@/components/DateField';
import { createReview, deleteReview } from '../actions';

export const dynamic = 'force-dynamic';

export default async function AgentReviewPage({ params, searchParams }) {
  const { supabase } = await requireAdmin();
  const ok = searchParams?.ok;
  const error = searchParams?.error;
  const today = new Date().toISOString().slice(0, 10);

  const { data: agent } = await supabase
    .from('profiles')
    .select('id, full_name, seniority, role')
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
                    <div className="field" key={c.id}>
                      <label>
                        {c.label}
                        {c.hint ? <span className="small muted"> — {c.hint}</span> : null}
                      </label>
                      <select name={`crit_${c.id}`} defaultValue={preset}>
                        <option value="">N/A — not applicable</option>
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>
                        ))}
                      </select>
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
