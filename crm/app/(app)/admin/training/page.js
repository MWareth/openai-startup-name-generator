import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { pct, formatDate, SENIORITY_NAMES } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function AdminTrainingPage() {
  const { supabase } = await requireAdmin();

  const { data: quizzes } = await supabase
    .from('quizzes')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: attempts } = await supabase
    .from('quiz_attempts')
    .select('*, agent:profiles(full_name, seniority, role)')
    .order('submitted_at', { ascending: false });

  const byQuiz = new Map();
  for (const a of attempts || []) {
    if (!byQuiz.has(a.quiz_id)) byQuiz.set(a.quiz_id, []);
    byQuiz.get(a.quiz_id).push(a);
  }

  return (
    <div className="stack">
      <div>
        <Link className="small muted" href="/admin">← Admin</Link>
        <h1>Training results</h1>
        <p className="muted">Test scores for the whole team. Only admins can see this.</p>
      </div>

      {(quizzes || []).map((q) => {
        const rows = byQuiz.get(q.id) || [];
        const passed = rows.filter((r) => r.passed).length;
        const avg = rows.length ? rows.reduce((s, r) => s + Number(r.score_pct || 0), 0) / rows.length : 0;
        return (
          <div key={q.id} className="card" style={{ padding: 0 }}>
            <div className="spread" style={{ padding: '14px 16px' }}>
              <div>
                <h3 style={{ margin: 0 }}>{q.title} {q.is_active ? null : <span className="badge role">inactive</span>}</h3>
                <p className="small muted" style={{ margin: '4px 0 0' }}>
                  {rows.length} taken · {passed} passed · avg {pct(avg)} · pass mark {pct(q.pass_mark)}
                </p>
              </div>
            </div>
            {rows.length ? (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr><th>Agent</th><th>Level</th><th>Score</th><th>Result</th><th>Taken</th></tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>{r.agent?.full_name || '—'}</td>
                        <td className="small muted">{r.agent?.role === 'agent' ? (SENIORITY_NAMES[r.agent?.seniority] || r.agent?.seniority) : r.agent?.role}</td>
                        <td><strong>{r.correct}/{r.total}</strong> <span className="small muted">({pct(r.score_pct)})</span></td>
                        <td><span className={`badge ${r.passed ? 'won' : 'lost'}`}>{r.passed ? 'Passed' : 'Not passed'}</span></td>
                        <td className="small muted">{formatDate(r.submitted_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="muted small" style={{ padding: '0 16px 16px' }}>No one has taken this test yet.</p>
            )}
          </div>
        );
      })}
      {(quizzes || []).length === 0 ? <div className="card muted">No quizzes yet.</div> : null}
    </div>
  );
}
