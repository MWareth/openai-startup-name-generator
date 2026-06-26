import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { formatDate, SENIORITY_NAMES } from '@/lib/format';
import { REVIEW_CRITERIA, CRITERION_LABEL, starString, averageStars } from '@/lib/reviews';
import SubmitButton from '@/components/SubmitButton';
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

  const { data: reviews } = await supabase
    .from('agent_reviews')
    .select('*, reviewer:profiles!agent_reviews_reviewer_id_fkey(full_name), agent_review_scores(criterion, stars)')
    .eq('agent_id', agent.id)
    .order('reviewed_on', { ascending: false })
    .order('created_at', { ascending: false });

  const avg = averageStars((reviews || []).map((r) => r.overall));

  return (
    <div className="stack">
      <div>
        <Link className="small muted" href="/reviews">← All reviews</Link>
        <div className="spread">
          <h1>{agent.full_name}</h1>
          <div className="right">
            {reviews && reviews.length ? (
              <>
                <div style={{ color: 'var(--gold)', fontSize: '1.3rem', letterSpacing: 1 }}>{starString(avg)}</div>
                <div className="small muted">{avg.toFixed(2)} / 5 · {reviews.length} review(s)</div>
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
        {/* New review */}
        <div className="card">
          <h3>New review</h3>
          <form action={createReview}>
            <input type="hidden" name="agent_id" value={agent.id} />
            <div className="form-grid">
              <div className="field">
                <label>Period</label>
                <input name="period_label" placeholder="e.g. Q2 2026, June" />
              </div>
              <div className="field">
                <label>Date</label>
                <input name="reviewed_on" type="date" defaultValue={today} />
              </div>
            </div>
            {REVIEW_CRITERIA.map((c) => (
              <div className="field" key={c.key}>
                <label>{c.label}</label>
                <select name={`stars_${c.key}`} defaultValue="">
                  <option value="">— No rating —</option>
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>
                  ))}
                </select>
              </div>
            ))}
            <div className="field">
              <label>Comment (optional)</label>
              <textarea name="comment" placeholder="Strengths, areas to improve, notes for the review meeting…" />
            </div>
            <SubmitButton className="btn" pendingLabel="Saving…">Save review</SubmitButton>
          </form>
        </div>

        {/* History */}
        <div className="card">
          <h3>Review history</h3>
          {reviews && reviews.length ? (
            <div className="stack" style={{ gap: 12 }}>
              {reviews.map((r) => {
                const scoreMap = Object.fromEntries((r.agent_review_scores || []).map((s) => [s.criterion, s.stars]));
                return (
                  <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                    <div className="spread">
                      <div>
                        <strong>{r.period_label || 'Review'}</strong>{' '}
                        <span style={{ color: 'var(--gold)' }}>{starString(r.overall)}</span>{' '}
                        <span className="small muted">{Number(r.overall).toFixed(1)}</span>
                      </div>
                      <span className="small muted">{formatDate(r.reviewed_on)}</span>
                    </div>
                    <div className="small" style={{ marginTop: 4 }}>
                      {REVIEW_CRITERIA.filter((c) => scoreMap[c.key]).map((c) => (
                        <div key={c.key} className="spread" style={{ maxWidth: 360 }}>
                          <span className="muted">{CRITERION_LABEL[c.key]}</span>
                          <span style={{ color: 'var(--gold)' }}>{starString(scoreMap[c.key])}</span>
                        </div>
                      ))}
                    </div>
                    {r.comment ? <div className="small" style={{ marginTop: 6, whiteSpace: 'pre-wrap' }}>{r.comment}</div> : null}
                    <div className="spread" style={{ marginTop: 6 }}>
                      <span className="small muted">by {r.reviewer?.full_name || '—'}</span>
                      <form action={deleteReview}>
                        <input type="hidden" name="review_id" value={r.id} />
                        <input type="hidden" name="agent_id" value={agent.id} />
                        <button className="btn ghost small" type="submit">Delete</button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="muted small">No reviews yet. Add the first one.</p>
          )}
        </div>
      </div>
    </div>
  );
}
