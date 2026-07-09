'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { gradeAttempt } from '@/lib/quiz';
import { notify } from '@/lib/notify';

// Submit a quiz attempt. Grading uses the service-role client so answers stay
// secret and the score can't be forged from the browser. One attempt per user.
export async function submitAttempt(formData) {
  const { user } = await requireUser();
  const quizId = String(formData.get('quiz_id') || '');
  if (!quizId) redirect('/training');

  const admin = createAdminClient();

  // Already attempted? Don't allow a retake.
  const { data: existing } = await admin
    .from('quiz_attempts')
    .select('id')
    .eq('quiz_id', quizId)
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing) redirect('/training?ok=' + encodeURIComponent('You have already taken this test.'));

  const { data: quiz } = await admin.from('quizzes').select('pass_mark').eq('id', quizId).single();
  const { data: allQuestions } = await admin
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quizId)
    .order('position');

  // Grade only the questions that were actually shown this attempt (the random
  // subset). qids is set by the runner; fall back to the whole set if missing.
  const shown = String(formData.get('qids') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const questions = shown.length
    ? (allQuestions || []).filter((q) => shown.includes(q.id))
    : (allQuestions || []);

  const answers = {};
  for (const q of questions || []) {
    const v = formData.get(`q_${q.id}`);
    if (v != null && String(v).trim() !== '') answers[q.id] = String(v);
  }

  const { correct, total, pct } = gradeAttempt(questions || [], answers);
  const passed = pct >= Number(quiz?.pass_mark ?? 0.7);

  const { error } = await admin.from('quiz_attempts').insert({
    quiz_id: quizId,
    user_id: user.id,
    submitted_at: new Date().toISOString(),
    correct,
    total,
    score_pct: pct,
    passed,
    answers,
  });
  if (error) redirect('/training?error=' + encodeURIComponent(error.message));

  // Notify the member of their result.
  await notify({
    userId: user.id,
    type: 'test_result',
    title: `Your test result: ${correct}/${total} (${Math.round(pct * 100)}%)`,
    body: passed ? 'You passed — well done! 🎉' : 'Not passed this time — review the material and try again with your manager.',
    link: '/training',
  });

  revalidatePath('/training');
  revalidatePath('/admin/training');
  revalidatePath('/teams');
  redirect('/training?ok=' + encodeURIComponent(`Submitted — you scored ${correct}/${total}.`));
}
