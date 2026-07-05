'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { scoreOutOf100 } from '@/lib/reviews';

// Read a star value per active criterion from the form (fields named crit_<id>).
// Blank / "na" means Not Applicable — no row is stored and it's left out of the
// score. Each stored score also carries its category, used for the /100 weight.
async function collectScores(supabase, formData) {
  const { data: criteria } = await supabase
    .from('review_criteria')
    .select('id, label, category')
    .eq('active', true);
  const scores = [];
  for (const c of criteria || []) {
    const n = Number(formData.get(`crit_${c.id}`));
    if (n >= 1 && n <= 5) {
      scores.push({ criterion_id: c.id, criterion: c.label, category: c.category, stars: Math.round(n) });
    }
  }
  return scores;
}

// Only the columns agent_review_scores has (category is used for scoring only).
const scoreRow = (s, review_id) => ({ review_id, criterion_id: s.criterion_id, criterion: s.criterion, stars: s.stars });

export async function createReview(formData) {
  const { user, supabase } = await requireAdmin();
  const agentId = String(formData.get('agent_id') || '');
  if (!agentId) redirect('/reviews');

  const scores = await collectScores(supabase, formData);
  const errorTo = `/reviews/${agentId}?error=`;
  if (!scores.length) redirect(errorTo + encodeURIComponent('Rate at least one KPI.'));

  const overall = scoreOutOf100(scores);

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
    .insert(scores.map((s) => scoreRow(s, review.id)));
  if (sErr) redirect(errorTo + encodeURIComponent(sErr.message));

  revalidatePath('/reviews');
  revalidatePath(`/reviews/${agentId}`);
  redirect(`/reviews/${agentId}?ok=` + encodeURIComponent('Scorecard saved.'));
}

export async function updateReview(formData) {
  const { supabase } = await requireAdmin();
  const reviewId = String(formData.get('review_id'));
  const agentId = String(formData.get('agent_id'));
  const errorTo = `/reviews/edit/${reviewId}?error=`;

  const scores = await collectScores(supabase, formData);
  if (!scores.length) redirect(errorTo + encodeURIComponent('Rate at least one KPI.'));
  const overall = scoreOutOf100(scores);

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
    .insert(scores.map((s) => scoreRow(s, reviewId)));
  if (sErr) redirect(errorTo + encodeURIComponent(sErr.message));

  revalidatePath('/reviews');
  revalidatePath(`/reviews/${agentId}`);
  redirect(`/reviews/${agentId}?ok=` + encodeURIComponent('Scorecard updated.'));
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
    hint: emptyToNull(formData.get('hint')),
    category: emptyToNull(formData.get('category')),
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
      hint: emptyToNull(formData.get('hint')),
      category: emptyToNull(formData.get('category')),
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
