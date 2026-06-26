'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { REVIEW_CRITERIA, averageStars } from '@/lib/reviews';

export async function createReview(formData) {
  const { user, supabase } = await requireAdmin();
  const agentId = String(formData.get('agent_id') || '');
  if (!agentId) redirect('/reviews');

  // Collect a star value per criterion (skips any left blank).
  const scores = [];
  for (const c of REVIEW_CRITERIA) {
    const raw = formData.get(`stars_${c.key}`);
    const n = Number(raw);
    if (n >= 1 && n <= 5) scores.push({ criterion: c.key, stars: Math.round(n) });
  }

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

function emptyToNull(v) {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
}
