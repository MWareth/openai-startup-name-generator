import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import SubmitButton from '@/components/SubmitButton';
import DateField from '@/components/DateField';
import { updateReview } from '../../actions';

export const dynamic = 'force-dynamic';

export default async function EditReviewPage({ params, searchParams }) {
  const { supabase } = await requireAdmin();
  const error = searchParams?.error;

  const { data: review } = await supabase
    .from('agent_reviews')
    .select('*, agent:profiles!agent_reviews_agent_id_fkey(full_name), agent_review_scores(criterion_id, criterion, stars)')
    .eq('id', params.reviewId)
    .single();
  if (!review) notFound();

  const { data: criteria } = await supabase
    .from('review_criteria')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  // Existing star value per criterion (match by id, fall back to label).
  const byId = {};
  const byLabel = {};
  for (const s of review.agent_review_scores || []) {
    if (s.criterion_id) byId[s.criterion_id] = s.stars;
    if (s.criterion) byLabel[s.criterion] = s.stars;
  }

  return (
    <div className="stack" style={{ maxWidth: 560 }}>
      <div>
        <Link className="small muted" href={`/reviews/${review.agent_id}`}>← Back to {review.agent?.full_name || 'agent'}</Link>
        <h1>Edit review</h1>
      </div>
      {error ? <div className="alert error">{error}</div> : null}

      <form action={updateReview} className="card">
        <input type="hidden" name="review_id" value={review.id} />
        <input type="hidden" name="agent_id" value={review.agent_id} />
        <div className="form-grid">
          <div className="field">
            <label>Period</label>
            <input name="period_label" defaultValue={review.period_label || ''} />
          </div>
          <div className="field">
            <label>Date</label>
            <DateField name="reviewed_on" defaultValue={review.reviewed_on} />
          </div>
        </div>
        {(criteria || []).map((c) => {
          const current = byId[c.id] ?? byLabel[c.label] ?? '';
          return (
            <div className="field" key={c.id}>
              <label>{c.label}</label>
              <select name={`crit_${c.id}`} defaultValue={current ? String(current) : ''}>
                <option value="">— No rating —</option>
                {[5, 4, 3, 2, 1].map((n) => (
                  <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>
                ))}
              </select>
            </div>
          );
        })}
        <div className="field">
          <label>Comment (optional)</label>
          <textarea name="comment" defaultValue={review.comment || ''} />
        </div>
        <SubmitButton className="btn" pendingLabel="Saving…">Save changes</SubmitButton>
      </form>
    </div>
  );
}
