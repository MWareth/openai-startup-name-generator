'use client';

import { useEffect, useRef, useState } from 'react';
import { submitAttempt } from '@/app/(app)/training/actions';

export default function QuizRunner({ quizId, questions, timeLimitMinutes = 15 }) {
  const total = timeLimitMinutes * 60;
  const [left, setLeft] = useState(total);
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  useEffect(() => {
    const started = Date.now();
    const id = setInterval(() => {
      const remaining = total - Math.floor((Date.now() - started) / 1000);
      setLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        if (formRef.current && !submitting) {
          setSubmitting(true);
          formRef.current.requestSubmit();
        }
      }
    }, 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const mm = String(Math.max(0, Math.floor(left / 60))).padStart(2, '0');
  const ss = String(Math.max(0, left % 60)).padStart(2, '0');
  const low = left <= 60;

  // Money/number fields: show digits grouped with commas as the person types,
  // keeping any decimal part intact. Grading strips the commas server-side.
  function formatWithCommas(raw) {
    let v = String(raw).replace(/[^0-9.]/g, '');
    const firstDot = v.indexOf('.');
    if (firstDot !== -1) {
      v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, '');
    }
    const [intPart, decPart] = v.split('.');
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decPart !== undefined ? `${grouped}.${decPart}` : grouped;
  }

  return (
    <form action={submitAttempt} ref={formRef} onSubmit={() => setSubmitting(true)}>
      <input type="hidden" name="quiz_id" value={quizId} />
      <input type="hidden" name="qids" value={questions.map((q) => q.id).join(',')} />

      <div
        style={{
          position: 'sticky', top: 0, zIndex: 5, background: 'var(--bg)',
          padding: '10px 0', marginBottom: 8, display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
        }}
      >
        <span className="small muted">{questions.length} questions</span>
        <span className="badge" style={{ background: low ? 'var(--red)' : 'var(--panel-2)', color: low ? '#fff' : 'var(--text)', fontSize: '0.95rem' }}>
          ⏱ {mm}:{ss}
        </span>
      </div>

      <div className="stack" style={{ gap: 12 }}>
        {questions.map((q, i) => (
          <div className="card" key={q.id}>
            <div className="small muted">
              Question {i + 1}{q.is_hard ? ' · calculation' : ''}
            </div>
            <div style={{ fontWeight: 600, margin: '4px 0 10px' }}>{q.prompt}</div>

            {q.kind === 'numeric' ? (
              <input
                name={`q_${q.id}`}
                inputMode="decimal"
                autoComplete="off"
                placeholder="Type your answer (e.g. 2,000,000)"
                style={{ maxWidth: 320 }}
                onInput={(e) => { e.target.value = formatWithCommas(e.target.value); }}
              />
            ) : (
              <div className="stack" style={{ gap: 6 }}>
                {(q.options || []).map((opt) => (
                  <label key={opt.key} className="row" style={{ gap: 8, cursor: 'pointer', margin: 0 }}>
                    <input type="radio" name={`q_${q.id}`} value={opt.key} style={{ width: 'auto' }} />
                    <span><strong>{opt.key}.</strong> {opt.text}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit test'}
        </button>
        <p className="small muted" style={{ marginTop: 6 }}>The test auto-submits when the timer reaches 0:00.</p>
      </div>
    </form>
  );
}
