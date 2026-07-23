import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser, canRouteLeads } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { aed, formatDate, QUAL_LABELS, STATUS_LABELS } from '@/lib/format';
import PrintButton from '@/components/PrintButton';

export const dynamic = 'force-dynamic';

// Marketing feedback report: what actually happened to the leads the campaigns
// brought in — day by day, source by source, and lead by lead with the agents'
// own notes. Visible to staff + marketing (no money data shown).
//
// Scope: ONLINE-CAMPAIGN leads only — source says Online Campaign (or legacy
// "Website") or names a paid/social platform. Portal subscriptions (Bayut,
// Property Finder) and self-generated leads (Cold Call, Referral, Walk-in)
// are not marketing-campaign traffic and stay out of this report.
const ONLINE_SOURCE_RX = /campaign|website|instagram|insta\b|facebook|\bfb\b|\bmeta\b|google|tiktok|snapchat|youtube/i;

const PERIODS = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This week' },
  { key: 'lastweek', label: 'Last week' },
  { key: '30d', label: 'Last 30 days' },
];

const DUBAI_MS = 4 * 3600000; // UTC+4, no DST

// The Dubai calendar date (yyyy-mm-dd) an instant falls on.
const dubaiDay = (ts) => new Date(new Date(ts).getTime() + DUBAI_MS).toISOString().slice(0, 10);

// UTC instant when a Dubai calendar date starts.
const dayStartUtc = (isoDay) => new Date(new Date(isoDay + 'T00:00:00Z').getTime() - DUBAI_MS);

function periodRange(key) {
  const todayDubai = dubaiDay(Date.now());
  const shifted = new Date(Date.now() + DUBAI_MS);
  const monOffset = (shifted.getUTCDay() + 6) % 7; // Mon=0 … Sun=6
  const monday = new Date(shifted.getTime() - monOffset * 86400000).toISOString().slice(0, 10);
  if (key === 'today') return { start: dayStartUtc(todayDubai), end: null };
  if (key === 'week') return { start: dayStartUtc(monday), end: null };
  if (key === 'lastweek') {
    const lastMon = new Date(dayStartUtc(monday).getTime() - 7 * 86400000);
    return { start: lastMon, end: dayStartUtc(monday) };
  }
  return { start: new Date(Date.now() - 30 * 86400000), end: null };
}

function Stat({ label, value }) {
  return (
    <div className="card stat">
      <span className="muted small">{label}</span>
      <span className="value" style={{ fontSize: '1.5rem' }}>{value}</span>
    </div>
  );
}

export default async function MarketingReportPage({ searchParams }) {
  const { profile } = await requireUser();
  if (!canRouteLeads(profile)) redirect('/dashboard');
  const admin = createAdminClient();

  const period = PERIODS.some((p) => p.key === searchParams?.period) ? searchParams.period : 'week';
  const periodLabel = PERIODS.find((p) => p.key === period)?.label;
  const { start, end } = periodRange(period);

  let leadsQ = admin
    .from('leads')
    .select('id, name, source, status, qualification, budget, property_type, created_at, assigned_at, assigned:profiles!leads_assigned_agent_id_fkey(full_name)')
    .gte('created_at', start.toISOString())
    .order('created_at', { ascending: false });
  if (end) leadsQ = leadsQ.lt('created_at', end.toISOString());
  const { data: leads } = await leadsQ;
  const cohort = (leads || []).filter((l) => ONLINE_SOURCE_RX.test(l.source || ''));

  // Everything the team did on this cohort (any date — the lead belongs to the
  // period it arrived in, even if it was worked later).
  const actByLead = new Map();
  if (cohort.length) {
    const ids = cohort.map((l) => l.id);
    const { data: acts } = await admin
      .from('lead_activities')
      .select('lead_id, type, body, created_at, agent:profiles(full_name)')
      .in('lead_id', ids)
      .order('created_at', { ascending: true });
    for (const a of acts || []) {
      if (!actByLead.has(a.lead_id)) actByLead.set(a.lead_id, []);
      actByLead.get(a.lead_id).push(a);
    }
  }

  // Per-lead derived facts.
  const rows = cohort.map((l) => {
    const acts = actByLead.get(l.id) || [];
    const first = acts[0] || null;
    const noted = [...acts].reverse().find((a) => (a.body || '').trim());
    const baseTs = l.assigned_at || l.created_at;
    const respMin = first && baseTs ? Math.max(0, Math.round((new Date(first.created_at) - new Date(baseTs)) / 60000)) : null;
    const meetings = acts.filter((a) => a.type === 'meeting' || a.type === 'viewing').length;
    return { ...l, acts, contacted: acts.length > 0, respMin, meetings, lastNote: noted || null };
  });

  const contacted = rows.filter((r) => r.contacted);
  const respTimes = rows.map((r) => r.respMin).filter((m) => m != null);
  const avgResp = respTimes.length ? Math.round(respTimes.reduce((a, b) => a + b, 0) / respTimes.length) : null;
  const fmtMins = (m) => (m == null ? '—' : m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`);
  const count = (fn) => rows.filter(fn).length;
  const pctOf = (n) => (rows.length ? Math.round((n / rows.length) * 100) : 0);

  // Day-by-day (Dubai days, newest first).
  const byDay = new Map();
  for (const r of rows) {
    const d = dubaiDay(r.created_at);
    if (!byDay.has(d)) byDay.set(d, []);
    byDay.get(d).push(r);
  }
  const days = [...byDay.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));

  // Source scorecard (the campaign feedback), biggest source first.
  const bySource = new Map();
  for (const r of rows) {
    const s = r.source || 'No source';
    if (!bySource.has(s)) bySource.set(s, []);
    bySource.get(s).push(r);
  }
  const sources = [...bySource.entries()].sort((a, b) => b[1].length - a[1].length);

  const qualBadge = (q) => (q ? <span className={`badge ${q}`}>{QUAL_LABELS[q] || q}</span> : <span className="muted small">—</span>);

  return (
    <div className="stack" style={{ maxWidth: 900 }}>
      <div className="spread" style={{ flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ margin: 0 }}>📣 Marketing report</h1>
        <PrintButton />
      </div>
      <p className="muted small" style={{ marginTop: 0 }}>
        Online-campaign leads only (Online Campaign, Instagram, Meta, Google, TikTok…) — portals and
        self-generated leads are excluded. What happened after they came in, {periodLabel.toLowerCase()}:
        response times, quality, outcomes and the agents&apos; own words, by day and by source.
      </p>

      <div className="row no-print" style={{ gap: 6, flexWrap: 'wrap' }}>
        {PERIODS.map((p) => (
          <Link
            key={p.key}
            className={`btn small ${p.key === period ? '' : 'secondary'}`}
            href={`/marketing-report?period=${p.key}`}
          >
            {p.label}
          </Link>
        ))}
      </div>

      {/* Headline numbers */}
      <div className="grid grid-3">
        <Stat label="Leads in" value={rows.length} />
        <Stat label="Contacted" value={`${contacted.length} (${pctOf(contacted.length)}%)`} />
        <Stat label="Avg first response" value={fmtMins(avgResp)} />
      </div>
      <div className="grid grid-3">
        <Stat label="🔥 Hot" value={count((r) => r.qualification === 'hot')} />
        <Stat label="Meetings / viewings" value={rows.reduce((s, r) => s + r.meetings, 0)} />
        <Stat label="Won / Lost" value={`${count((r) => r.status === 'won')} / ${count((r) => r.status === 'lost')}`} />
      </div>

      {/* Day-by-day */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <div style={{ padding: '14px 16px 0' }}><h3 style={{ margin: 0 }}>📆 Day by day</h3></div>
        <table>
          <thead>
            <tr><th>Day</th><th>Leads in</th><th>Contacted</th><th>Hot</th><th>Meetings</th><th>Lost</th></tr>
          </thead>
          <tbody>
            {days.length ? days.map(([d, list]) => (
              <tr key={d}>
                <td>{formatDate(d)}</td>
                <td>{list.length}</td>
                <td>{list.filter((r) => r.contacted).length}</td>
                <td>{list.filter((r) => r.qualification === 'hot').length}</td>
                <td>{list.reduce((s, r) => s + r.meetings, 0)}</td>
                <td>{list.filter((r) => r.status === 'lost').length}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} className="muted small">No leads in this period.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Source scorecard */}
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <div style={{ padding: '14px 16px 0' }}>
          <h3 style={{ margin: 0 }}>🎯 By source</h3>
          <p className="muted small" style={{ margin: '4px 0 0' }}>Which campaigns bring leads that actually convert.</p>
        </div>
        <table>
          <thead>
            <tr><th>Source</th><th>Leads</th><th>Contacted</th><th>Hot</th><th>Avg response</th><th>Meetings</th><th>Won</th><th>Lost</th></tr>
          </thead>
          <tbody>
            {sources.length ? sources.map(([s, list]) => {
              const resp = list.map((r) => r.respMin).filter((m) => m != null);
              return (
                <tr key={s}>
                  <td><strong>{s}</strong></td>
                  <td>{list.length}</td>
                  <td>{list.filter((r) => r.contacted).length}/{list.length}</td>
                  <td>{list.filter((r) => r.qualification === 'hot').length}</td>
                  <td>{fmtMins(resp.length ? Math.round(resp.reduce((a, b) => a + b, 0) / resp.length) : null)}</td>
                  <td>{list.reduce((sum, r) => sum + r.meetings, 0)}</td>
                  <td>{list.filter((r) => r.status === 'won').length}</td>
                  <td>{list.filter((r) => r.status === 'lost').length}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan={8} className="muted small">No leads in this period.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Lead-by-lead feedback */}
      <div className="card">
        <h3 style={{ marginTop: 0 }}>🗒️ Lead-by-lead feedback</h3>
        <p className="muted small" style={{ marginTop: 0 }}>
          Every lead from the period with its latest agent note — the ground truth on lead quality.
        </p>
        <div className="stack" style={{ gap: 10 }}>
          {rows.length ? rows.map((r) => (
            <div key={r.id} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <div className="row" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Link href={`/leads/${r.id}`}><strong>{r.name}</strong></Link>
                {qualBadge(r.qualification)}
                <span className="badge status">{STATUS_LABELS[r.status] || r.status}</span>
                <span className="small muted">
                  {r.source || 'No source'} · {formatDate(r.created_at)}
                  {r.assigned?.full_name ? ` · ${r.assigned.full_name}` : ' · unassigned'}
                  {r.budget ? ` · ${aed(r.budget)}` : ''}
                  {r.respMin != null ? ` · replied in ${fmtMins(r.respMin)}` : ' · no contact yet'}
                </span>
              </div>
              {r.lastNote ? (
                <div className="small" style={{ marginTop: 4 }}>
                  “{String(r.lastNote.body).slice(0, 180)}{String(r.lastNote.body).length > 180 ? '…' : ''}”
                  <span className="muted"> — {r.lastNote.agent?.full_name || 'agent'}, {formatDate(r.lastNote.created_at)}</span>
                </div>
              ) : (
                <div className="small muted" style={{ marginTop: 4 }}>No agent notes yet.</div>
              )}
            </div>
          )) : (
            <p className="muted small">No leads in this period.</p>
          )}
        </div>
      </div>
    </div>
  );
}
