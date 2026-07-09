import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripForClient } from '@/lib/quiz';
import QuizRunner from '@/components/QuizRunner';

export const dynamic = 'force-dynamic';

export default async function TakeQuizPage({ params }) {
  const { user, supabase } = await requireUser();

  const { data: quiz } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', params.id)
    .eq('is_active', true)
    .maybeSingle();
  if (!quiz) notFound();

  // One attempt only — if already taken, send back to the results view.
  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('id')
    .eq('quiz_id', quiz.id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (attempt) redirect('/training');

  // Questions (with answers) are admin-only under RLS — read them with the
  // service-role client on the server, then strip answers before rendering.
  const admin = createAdminClient();
  const { data: allQuestions } = await admin
    .from('quiz_questions')
    .select('*')
    .eq('quiz_id', quiz.id)
    .order('position');

  // Draw a random subset (default 25) and shuffle it, so every attempt is
  // different. Fisher–Yates on a copy; falls back to the whole bank if fewer.
  const pool = [...(allQuestions || [])];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const count = Math.min(quiz.question_count || 25, pool.length);
  const questions = pool.slice(0, count);

  const safe = stripForClient(questions);

  return (
    <div className="stack" style={{ maxWidth: 720 }}>
      <div>
        <Link className="small muted" href="/training">← Training</Link>
        <h1>{quiz.title}</h1>
        <p className="muted">
          {quiz.description ? quiz.description + ' ' : ''}
          You have <strong>{quiz.time_limit_minutes} minutes</strong>. One attempt only — answer all questions, then submit.
        </p>
      </div>
      <QuizRunner quizId={quiz.id} questions={safe} timeLimitMinutes={quiz.time_limit_minutes} />
    </div>
  );
}
