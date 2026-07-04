import Link from 'next/link';
import { requireUser, hasAdminAccess } from '@/lib/auth';
import { pct, formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function TrainingPage({ searchParams }) {
  const { user, profile, supabase } = await requireUser();
  const isAdmin = hasAdminAccess(profile);
  const ok = searchParams?.ok;
  const error = searchParams?.error;

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('user_id', user.id);
  const attemptByQuiz = new Map((attempts || []).map((a) => [a.quiz_id, a]));

  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <div className="spread">
        <div>
          <h1>Training &amp; tests</h1>
          <p className="muted">Complete your onboarding test. Your result is saved to your record.</p>
        </div>
        {isAdmin ? <Link className="btn secondary small" href="/admin/training">All results</Link> : null}
      </div>
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      {(quizzes || []).length ? (
        <div className="stack">
          {quizzes.map((q) => {
            const a = attemptByQuiz.get(q.id);
            return (
              <div key={q.id} className="card">
                <div className="spread">
                  <div>
                    <h3 style={{ margin: 0 }}>{q.title}</h3>
                    <p className="small muted" style={{ margin: '4px 0 0' }}>
                      {q.time_limit_minutes} min · pass mark {pct(q.pass_mark)}
                    </p>
                  </div>
                  {a ? (
                    <div className="right">
                      <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>
                        {a.correct}/{a.total} · {pct(a.score_pct)}
                      </div>
                      <span className={`badge ${a.passed ? 'won' : 'lost'}`}>{a.passed ? 'Passed' : 'Not passed'}</span>
                      <div className="small muted">{formatDate(a.submitted_at)}</div>
                    </div>
                  ) : (
                    <Link className="btn" href={`/training/${q.id}/take`}>Start test</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card muted">No tests available right now.</div>
      )}
    </div>
  );
}
