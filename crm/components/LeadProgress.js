import { LEAD_PIPELINE } from '@/lib/format';

// Lead progress stepper — mirrors the lead's real Status through the sales
// pipeline (New → Contacted → Viewing → Negotiation → Closed). `reached` is the
// index of the furthest completed stage (-1 = none yet); the next stage is the
// one the agent is on now. `lost` paints a red "Lost" marker for a dead lead.
export default function LeadProgress({ reached = -1, lost = false }) {
  const stages = LEAD_PIPELINE.map((s) => s.label);
  const wonAll = !lost && reached >= stages.length - 1;
  return (
    <div className="lead-progress" role="list" aria-label="Lead progress">
      {stages.map((label, i) => {
        const done = !lost && i <= reached;
        const current = !lost && i === reached + 1;
        const isFinal = i === stages.length - 1;
        const cls = ['lp-step', done ? 'done' : '', current ? 'current' : ''].join(' ').trim();
        const mark = done ? (isFinal ? '★' : '✓') : i + 1;
        return (
          <div className={cls} role="listitem" key={label}>
            <span className="dot">{mark}</span>
            <span className="lbl">{label}</span>
          </div>
        );
      })}
      {lost ? (
        <span className="lp-cheer" style={{ color: 'var(--red)' }}>Lost</span>
      ) : wonAll ? (
        <span className="lp-cheer">Closed — great work! 🎉</span>
      ) : null}
    </div>
  );
}
