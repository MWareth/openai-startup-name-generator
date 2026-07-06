// Lead progress stepper — a friendly "how far has this lead come" bar shown at
// the top of each lead. Stages are derived from real data (assignment, logged
// activities, follow-ups) and the closed deal — see the lead page. `reached` is
// the index of the furthest stage completed (-1 = none yet); `lost` paints the
// final marker red instead of green.
const STAGES = ['Assigned', 'Contacted', 'Meeting', 'Follow', 'Closed'];

export default function LeadProgress({ reached = -1, lost = false }) {
  const wonAll = reached >= STAGES.length - 1;
  return (
    <div className="lead-progress" role="list" aria-label="Lead progress">
      {STAGES.map((label, i) => {
        const done = i <= reached;
        const current = i === reached + 1;
        const isFinal = i === STAGES.length - 1;
        const lostHere = lost && current; // where it stalled before being lost
        const cls = ['lp-step', done ? 'done' : '', current ? 'current' : '', lostHere ? 'lost' : ''].join(' ').trim();
        const mark = done ? (isFinal ? '★' : '✓') : lostHere ? '✕' : i + 1;
        return (
          <div className={cls} role="listitem" key={label}>
            <span className="dot">{mark}</span>
            <span className="lbl">{label}</span>
          </div>
        );
      })}
      {wonAll ? <span className="lp-cheer">Closed — great work! 🎉</span> : null}
    </div>
  );
}
