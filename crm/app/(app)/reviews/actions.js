'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { averageStars } from '@/lib/reviews';

// Read a star value per active criterion from the form (fields named crit_<id>).
async function collectScores(supabase, formData) {
  const { data: criteria } = await supabase
    .from('review_criteria')
    .select('id, label')
    .eq('active', true);
  const scores = [];
  for (const c of criteria || []) {
    const n = Number(formData.get(`crit_${c.id}`));
    if (n >= 1 && n <= 5) scores.push({ criterion_id: c.id, criterion: c.label, stars: Math.round(n) });
  }
  return scores;
}

export async function createReview(formData) {
  const { user, supabase } = await requireAdmin();
  const agentId = String(formData.get('agent_id') || '');
  if (!agentId) redirect('/reviews');

  const scores = await collectScores(supabase, formData);
  const errorTo = `/reviews/${agentId}?error=`;
  if (!scores.length) redirect(errorTo + encodeURIComponent('Give at least one star rating.'));

  const overall = averageStars(scores.map((s) => s.stars));

  const { data: review, error } = await supabase
    .from('agent_reviews')
    .insert({
      agent_id: agentId,
      reviewer_id: user.id,
      period_label: String(formData.get('period_label') || '').trim(),
      reviewed_on: String(formData.get('reviewed_on') || new Date().toISOString().slice(0, 10)),
      overall,
      comment: emptyToNull(formData.get('comment')),
    })
    .select('id')
    .single();
  if (error) redirect(errorTo + encodeURIComponent(error.message));

  const { error: sErr } = await supabase
    .from('agent_review_scores')
    .insert(scores.map((s) => ({ ...s, review_id: review.id })));
  if (sErr) redirect(errorTo + encodeURIComponent(sErr.message));

  revalidatePath('/reviews');
  revalidatePath(`/reviews/${agentId}`);
  redirect(`/reviews/${agentId}?ok=` + encodeURIComponent('Review saved.'));
}

export async function updateReview(formData) {
  const { supabase } = await requireAdmin();
  const reviewId = String(formData.get('review_id'));
  const agentId = String(formData.get('agent_id'));
  const errorTo = `/reviews/edit/${reviewId}?error=`;

  const scores = await collectScores(supabase, formData);
  if (!scores.length) redirect(errorTo + encodeURIComponent('Give at least one star rating.'));
  const overall = averageStars(scores.map((s) => s.stars));

  const { error } = await supabase
    .from('agent_reviews')
    .update({
      period_label: String(formData.get('period_label') || '').trim(),
      reviewed_on: String(formData.get('reviewed_on') || new Date().toISOString().slice(0, 10)),
      overall,
      comment: emptyToNull(formData.get('comment')),
    })
    .eq('id', reviewId);
  if (error) redirect(errorTo + encodeURIComponent(error.message));

  // Replace the score rows.
  await supabase.from('agent_review_scores').delete().eq('review_id', reviewId);
  const { error: sErr } = await supabase
    .from('agent_review_scores')
    .insert(scores.map((s) => ({ ...s, review_id: reviewId })));
  if (sErr) redirect(errorTo + encodeURIComponent(sErr.message));

  revalidatePath('/reviews');
  revalidatePath(`/reviews/${agentId}`);
  redirect(`/reviews/${agentId}?ok=` + encodeURIComponent('Review updated.'));
}

export async function deleteReview(formData) {
  const { supabase } = await requireAdmin();
  const reviewId = String(formData.get('review_id'));
  const agentId = String(formData.get('agent_id'));
  const { error } = await supabase.from('agent_reviews').delete().eq('id', reviewId);
  if (error) redirect(`/reviews/${agentId}?error=` + encodeURIComponent(error.message));
  revalidatePath('/reviews');
  revalidatePath(`/reviews/${agentId}`);
  redirect(`/reviews/${agentId}?ok=` + encodeURIComponent('Review deleted.'));
}

// ---------- Criteria management ----------
const CRIT = '/reviews/criteria';
const cback = (msg, ok) => redirect(`${CRIT}?${ok ? 'ok' : 'error'}=` + encodeURIComponent(msg));

export async function createCriterion(formData) {
  const { supabase } = await requireAdmin();
  const label = String(formData.get('label') || '').trim();
  if (!label) cback('Criterion name is required');
  const { error } = await supabase.from('review_criteria').insert({
    label,
    sort_order: Number(formData.get('sort_order') || 0),
    auto_from_target: !!formData.get('auto_from_target'),
  });
  if (error) cback(error.message);
  revalidatePath(CRIT);
  cback(`Added "${label}"`, true);
}

export async function updateCriterion(formData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from('review_criteria')
    .update({
      label: String(formData.get('label') || '').trim(),
      sort_order: Number(formData.get('sort_order') || 0),
      auto_from_target: !!formData.get('auto_from_target'),
      active: !!formData.get('active'),
    })
    .eq('id', String(formData.get('criterion_id')));
  if (error) cback(error.message);
  revalidatePath(CRIT);
  cback('Criterion updated', true);
}

export async function deleteCriterion(formData) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from('review_criteria').delete().eq('id', String(formData.get('criterion_id')));
  if (error) cback(error.message);
  revalidatePath(CRIT);
  cback('Criterion removed', true);
}

function emptyToNull(v) {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}
