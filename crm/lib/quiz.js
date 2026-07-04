// Grade an attempt server-side. Answers is a map of { questionId: value }.
export function gradeAttempt(questions, answers) {
  let correct = 0;
  const total = questions.length;
  for (const q of questions) {
    const a = answers?.[q.id];
    if (q.kind === 'numeric') {
      const val = Number(String(a ?? '').replace(/[^0-9.\-]/g, ''));
      const target = Number(q.correct_value);
      const tol = Number(q.tolerance || 0);
      if (!Number.isNaN(val) && Math.abs(val - target) <= tol) correct += 1;
    } else {
      if (a != null && String(a) === String(q.correct_key)) correct += 1;
    }
  }
  const pct = total ? correct / total : 0;
  return { correct, total, pct };
}

// Remove correct answers before sending questions to the browser.
export function stripForClient(questions) {
  return (questions || []).map((q) => ({
    id: q.id,
    position: q.position,
    kind: q.kind,
    prompt: q.prompt,
    is_hard: q.is_hard,
    options: q.options || null,
  }));
}
