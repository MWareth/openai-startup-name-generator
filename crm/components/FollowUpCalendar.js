'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDate } from '@/lib/format';

// Month calendar of lead follow-ups. Green = today/upcoming, red = overdue.
// Tap a highlighted day to see the leads due then. Admins get an agent filter.
//
// Props:
//   leads: [{ id, name, date: 'YYYY-MM-DD', agent_id?, agent_name? }]
//   agents: [{ id, full_name }]   (only used when showAgentFilter)
//   showAgentFilter: boolean

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const pad = (n) => String(n).padStart(2, '0');
const ymd = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

export default function FollowUpCalendar({ leads = [], agents = [], showAgentFilter = false }) {
  const today = new Date();
  const todayStr = ymd(today.getFullYear(), today.getMonth(), today.getDate());

  const [view, setView] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [agentFilter, setAgentFilter] = useState('');
  const [selected, setSelected] = useState(todayStr);

  const filtered = agentFilter ? leads.filter((l) => l.agent_id === agentFilter) : leads;

  // Group leads by their follow-up date.
  const byDate = {};
  for (const l of filtered) {
    if (!l.date) continue;
    (byDate[l.date] ||= []).push(l);
  }

  const startOffset = new Date(view.y, view.m, 1).getDay();
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prev = () => setView((v) => (v.m === 0 ? { y: v.y - 1, m: 11 } : { y: v.y, m: v.m - 1 }));
  const next = () => setView((v) => (v.m === 11 ? { y: v.y + 1, m: 0 } : { y: v.y, m: v.m + 1 }));

  const selectedLeads = byDate[selected] || [];

  return (
    <div className="card">
      <div className="spread" style={{ flexWrap: 'wrap', gap: 8 }}>
        <h3>📅 Follow-up calendar</h3>
        <div className="row" style={{ gap: 8, alignItems: 'center' }}>
          {showAgentFilter ? (
            <select value={agentFilter} onChange={(e) => setAgentFilter(e.target.value)} style={{ width: 150 }}>
              <option value="">All agents</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
          ) : null}
          <button type="button" className="btn ghost small" onClick={prev} aria-label="Previous month">←</button>
          <span className="small" style={{ minWidth: 120, textAlign: 'center', fontWeight: 600 }}>{MONTHS[view.m]} {view.y}</span>
          <button type="button" className="btn ghost small" onClick={next} aria-label="Next month">→</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginTop: 12 }}>
        {WEEKDAYS.map((w) => (
          <div key={w} className="small muted" style={{ textAlign: 'center', fontWeight: 600 }}>{w}</div>
        ))}
        {cells.map((d, i) => {
          if (d === null) return <div key={`b${i}`} />;
          const ds = ymd(view.y, view.m, d);
          const due = byDate[ds];
          const isToday = ds === todayStr;
          const overdue = due && ds < todayStr;
          const upcoming = due && ds >= todayStr;
          const isSelected = ds === selected;

          let bg = 'transparent';
          let color = 'var(--text)';
          let border = '1px solid transparent';
          if (overdue) { bg = 'rgba(220,38,38,0.15)'; color = 'var(--red)'; }
          else if (upcoming) { bg = 'rgba(22,163,74,0.18)'; color = '#15803d'; }
          if (isToday) border = '2px solid var(--brand)';
          if (isSelected && due) border = '2px solid var(--text)';

          return (
            <button
              key={ds}
              type="button"
              onClick={() => due && setSelected(ds)}
              title={due ? `${due.length} follow-up${due.length > 1 ? 's' : ''}` : ''}
              style={{
                aspectRatio: '1 / 1',
                minHeight: 34,
                borderRadius: 8,
                border,
                background: bg,
                color,
                fontWeight: due ? 700 : 400,
                cursor: due ? 'pointer' : 'default',
                position: 'relative',
                padding: 0,
              }}
            >
              {d}
              {due ? (
                <span style={{ position: 'absolute', bottom: 3, left: '50%', transform: 'translateX(-50%)', fontSize: 10, lineHeight: 1 }}>
                  {due.length > 1 ? `•${due.length}` : '•'}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="row small muted" style={{ gap: 16, marginTop: 10 }}>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'rgba(22,163,74,0.6)', marginRight: 5, verticalAlign: 'middle' }} />Upcoming</span>
        <span><span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: 'rgba(220,38,38,0.6)', marginRight: 5, verticalAlign: 'middle' }} />Overdue</span>
      </div>

      {/* Selected day detail */}
      <div style={{ marginTop: 12 }}>
        {selectedLeads.length ? (
          <>
            <div className="small muted" style={{ marginBottom: 6 }}>
              {selected < todayStr ? 'Overdue · ' : selected === todayStr ? 'Today · ' : ''}
              Follow-ups on {formatDate(selected)}
            </div>
            <div className="stack" style={{ gap: 6 }}>
              {selectedLeads.map((l, i) => (
                <div key={l.fu || `${l.lead_id || l.id}-${i}`} className="spread" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                  <Link href={`/leads/${l.lead_id || l.id}`}>{l.name}</Link>
                  {l.agent_name ? <span className="small muted">{l.agent_name}</span> : null}
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="small muted">No follow-ups on this date — tap a highlighted day.</p>
        )}
      </div>
    </div>
  );
}
