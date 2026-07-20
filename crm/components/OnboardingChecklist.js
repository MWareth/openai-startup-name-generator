import { toggleOnboardingItem } from '@/app/(app)/onboarding/actions';
import { formatDate } from '@/lib/format';

// Week-by-week newcomer program checklist. Server component; manual items are
// tap-to-toggle forms (agent on their own list, staff anywhere), auto items
// show live count/target. `currentWeek` highlights where the person is now.
export default function OnboardingChecklist({ weeks, userId, back, canToggle, currentWeek }) {
  return (
    <div className="stack" style={{ gap: 12 }}>
      {weeks.map((w) => {
        const isNow = w.week === currentWeek;
        return (
          <div key={w.week} className="card" style={isNow ? { borderColor: 'var(--gold)' } : undefined}>
            <div className="spread" style={{ marginBottom: 6 }}>
              <strong>
                Week {w.week}
                {isNow ? <span className="badge" style={{ background: 'var(--gold)', color: '#1a1407', marginLeft: 8 }}>this week</span> : null}
              </strong>
              <span className="small muted">
                {formatDate(w.from.toISOString().slice(0, 10))} → {formatDate(new Date(w.to.getTime() - 86400000).toISOString().slice(0, 10))} · {w.done}/{w.total}
              </span>
            </div>

            {/* Progress bar */}
            <div style={{ height: 8, borderRadius: 6, background: 'var(--panel-2)', overflow: 'hidden', marginBottom: 10 }}>
              <div style={{ width: `${w.pct}%`, height: '100%', background: w.pct === 100 ? '#16a34a' : 'var(--brand)', transition: 'width .2s' }} />
            </div>

            <div className="stack" style={{ gap: 6 }}>
              {w.items.map((item) => (
                <div key={item.key} className="row" style={{ gap: 8, alignItems: 'flex-start', flexWrap: 'nowrap' }}>
                  {item.auto ? (
                    <span title="Counted automatically" style={{ fontSize: 18, lineHeight: '22px' }}>{item.done ? '✅' : '⚙️'}</span>
                  ) : canToggle ? (
                    <form action={toggleOnboardingItem} style={{ margin: 0 }}>
                      <input type="hidden" name="item_key" value={item.key} />
                      <input type="hidden" name="user_id" value={userId} />
                      <input type="hidden" name="back" value={back} />
                      <button
                        type="submit"
                        aria-label={item.done ? 'Untick' : 'Tick'}
                        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontSize: 18, lineHeight: '22px' }}
                      >
                        {item.done ? '✅' : '⬜'}
                      </button>
                    </form>
                  ) : (
                    <span style={{ fontSize: 18, lineHeight: '22px' }}>{item.done ? '✅' : '⬜'}</span>
                  )}
                  <div style={{ minWidth: 0 }}>
                    <span className="small" style={item.done ? { color: 'var(--muted)' } : undefined}>{item.label}</span>
                    {item.auto ? (
                      <span className="small muted"> — <strong>{item.count}/{item.target}</strong> auto-counted</span>
                    ) : item.tick ? (
                      <span className="small muted"> — ticked {formatDate(item.tick.checked_at)}{item.tick.checker?.full_name ? ` by ${item.tick.checker.full_name}` : ''}</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <p className="small muted" style={{ margin: 0 }}>
        ⚙️ = counted automatically from logged calls (client responded), 🤝 meetings, and leads moved to Negotiation — no ticking needed.
      </p>
    </div>
  );
}
