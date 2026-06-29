import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser, hasAdminAccess } from '@/lib/auth';
import { getTargetProgress } from '@/lib/targets';
import { aed, pct, QUAL_LABELS, formatDate } from '@/lib/format';
import FollowUpCalendar from '@/components/FollowUpCalendar';
import MotivationCard from '@/components/MotivationCard';

// Time-of-day greeting, based on Dubai local time (the whole team is Dubai-based).
function greetingNow() {
  const hour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Dubai', hour: 'numeric', hour12: false }).format(new Date())
  ) % 24;
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const { user, profile, supabase } = await requireUser();
  const isAdmin = hasAdminAccess(profile);

  // Support staff work from the commission queue, not a sales dashboard.
  if (profile?.role === 'support') redirect('/commission');

  if (isAdmin) return <AdminDashboard supabase={supabase} name={profile.full_name} />;

  // ---- Agent home feed ----
  const today = new Date().toISOString().slice(0, 10);
  const now = Date.now();
  const daysSince = (ts) => (ts ? (now - new Date(ts).getTime()) / 86400000 : 9999);

  // Run all independent queries in parallel (one round-trip wave, not six).
  const [
    { data: myLeads },
    { data: target },
    { data: myDeals },
    { data: board },
    { data: launches },
    { data: myFollowups },
  ] = await Promise.all([
    supabase.from('leads')
      .select('id, name, qualification, status, next_follow_up, updated_at, created_at')
      .order('updated_at', { ascending: false }),
    supabase.from('targets').select('*').eq('agent_id', user.id).eq('is_active', true)
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('deals').select('deal_value, gross_commission, agent_commission, closed_on').eq('agent_id', user.id),
    supabase.rpc('agent_leaderboard'),
    supabase.from('launches').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('lead_followups')
      .select('id, due_on, lead_id, lead:leads(name, status)')
      .eq('done', false),
  ]);

  const open = (myLeads || []).filter((l) => l.status !== 'won' && l.status !== 'lost');
  const dueLeads = open
    .filter((l) => l.next_follow_up && l.next_follow_up <= today)
    .sort((a, b) => (a.next_follow_up < b.next_follow_up ? -1 : 1));
  const newLeads = open.filter((l) => l.status === 'new');

  // Follow-ups for the calendar — every pending follow-up (a lead can have several).
  const followupLeads = (myFollowups || [])
    .filter((f) => f.lead && f.lead.status !== 'won' && f.lead.status !== 'lost')
    .map((f) => ({ fu: f.id, lead_id: f.lead_id, name: f.lead?.name || 'Lead', date: f.due_on }));
  const hotQuiet = open.filter((l) => l.qualification === 'hot' && daysSince(l.updated_at) >= 3);
  const aboutToReturn = open
    .filter((l) => daysSince(l.updated_at) >= 8)
    .sort((a, b) => daysSince(b.updated_at) - daysSince(a.updated_at));

  const progress = target ? await getTargetProgress(supabase, target) : null;

  const monthDeals = (myDeals || []).filter((d) => (d.closed_on || '').startsWith(today.slice(0, 7)));
  const monthValue = monthDeals.reduce((s, d) => s + Number(d.deal_value || 0), 0);
  const monthGross = monthDeals.reduce((s, d) => s + Number(d.gross_commission || 0), 0);
  const monthNet = monthDeals.reduce((s, d) => s + Number(d.agent_commission || 0), 0);

  // My sales value by quarter (current year).
  const year = new Date().getFullYear();
  const myQuarters = [0, 0, 0, 0];
  for (const d of myDeals || []) {
    if (!d.closed_on) continue;
    const dt = new Date(d.closed_on);
    if (dt.getFullYear() !== year) continue;
    myQuarters[Math.floor(dt.getMonth() / 3)] += Number(d.deal_value || 0);
  }
  const myYearTotal = myQuarters.reduce((s, v) => s + v, 0);

  const rankIdx = (board || []).findIndex((r) => r.agent_id === user.id);
  const rank = rankIdx >= 0 ? rankIdx + 1 : null;
  const teamCount = (board || []).length;

  const firstName = profile.full_name?.split(' ')[0] || 'there';

  return (
    <div className="stack">
      <h1>{greetingNow()}, {firstName} 👋</h1>

      {/* Daily mood-boost */}
      <MotivationCard />

      {/* Performance */}
      <div className="grid grid-3">
        <div className="card stat"><span className="muted small">Open leads</span><span className="value">{open.length}</span></div>
        <div className="card stat"><span className="muted small">Sales this month</span><span className="value" style={{ fontSize: '1.4rem' }}>{aed(monthValue)}</span></div>
        <div className="card stat"><span className="muted small">Leaderboard rank</span><span className="value">{rank ? `#${rank}` : '—'}{teamCount ? <span className="small muted"> / {teamCount}</span> : null}</span></div>
      </div>

      <div className="grid grid-2">
        <div className="card stat"><span className="muted small">Gross commission (this month)</span><span className="value" style={{ fontSize: '1.4rem' }}>{aed(monthGross)}</span></div>
        <div className="card stat"><span className="muted small">Net commission — your share (this month)</span><span className="value" style={{ fontSize: '1.4rem', color: 'var(--gold-2)' }}>{aed(monthNet)}</span></div>
      </div>

      {/* Follow-up calendar */}
      <FollowUpCalendar leads={followupLeads} />

      {/* Today's to-do */}
      <div className="card">
        <h3>📋 Today&apos;s to-do</h3>
        {dueLeads.length || newLeads.length ? (
          <div className="stack" style={{ gap: 8 }}>
            {dueLeads.map((l) => (
              <div key={l.id} className="spread" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <div><Link href={`/leads/${l.id}`}>{l.name}</Link> <span className={`badge ${l.qualification}`}>{QUAL_LABELS[l.qualification]}</span></div>
                <span className="small" style={{ color: l.next_follow_up < today ? 'var(--red)' : 'var(--muted)' }}>
                  {l.next_follow_up < today ? 'overdue · ' : ''}follow up {formatDate(l.next_follow_up)}
                </span>
              </div>
            ))}
            {newLeads.slice(0, 8).map((l) => (
              <div key={l.id} className="spread" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <div><Link href={`/leads/${l.id}`}>{l.name}</Link> <span className="badge status">New</span></div>
                <span className="small muted">new lead — make first contact</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted small">Nothing due today — you&apos;re on top of it. 🎉</p>
        )}
      </div>

      {/* Needs attention */}
      {hotQuiet.length || aboutToReturn.length ? (
        <div className="card" style={{ borderColor: 'var(--amber)' }}>
          <h3>⚠️ Needs attention</h3>
          <div className="stack" style={{ gap: 6 }}>
            {hotQuiet.length ? (
              <div className="small">🔥 <strong>{hotQuiet.length}</strong> hot lead{hotQuiet.length > 1 ? 's' : ''} with no update in 3+ days — {hotQuiet.slice(0, 4).map((l, i) => (<span key={l.id}>{i > 0 ? ', ' : ''}<Link href={`/leads/${l.id}`}>{l.name}</Link></span>))}</div>
            ) : null}
            {aboutToReturn.length ? (
              <div className="small">⏳ <strong>{aboutToReturn.length}</strong> lead{aboutToReturn.length > 1 ? 's' : ''} idle 8+ days — returns to admin at 10 days: {aboutToReturn.slice(0, 4).map((l, i) => (<span key={l.id}>{i > 0 ? ', ' : ''}<Link href={`/leads/${l.id}`}>{l.name}</Link> ({Math.floor(daysSince(l.updated_at))}d)</span>))}</div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Target */}
      {progress ? (
        <div className="card">
          <div className="spread"><h3>{target.name}</h3><span className="small muted">{pct(progress.progress)} of {aed(progress.goal)}</span></div>
          <div className="progress"><div style={{ width: pct(progress.progress) }} /></div>
          <p className="small muted" style={{ marginTop: 8 }}>
            {aed(progress.achieved)} achieved · {aed(progress.remaining)} to go
            {progress.nextTier ? <> · next reward at {aed(progress.nextTier.threshold_amount)}: <strong>{progress.nextTier.reward_label}</strong></> : null}
          </p>
          <Link className="small" href="/targets">View targets &amp; incentives →</Link>
        </div>
      ) : null}

      {/* My sales by quarter */}
      <div className="card">
        <div className="spread">
          <h3>My sales by quarter — {year}</h3>
          <span className="small muted">Year total: <strong style={{ color: 'var(--text)' }}>{aed(myYearTotal)}</strong></span>
        </div>
        <div className="grid grid-3" style={{ marginTop: 8 }}>
          {['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'].map((label, i) => (
            <div key={label} className="card stat" style={{ background: 'var(--panel-2)', boxShadow: 'none' }}>
              <span className="muted small">{label}</span>
              <span className="value" style={{ fontSize: '1.2rem' }}>{aed(myQuarters[i])}</span>
            </div>
          ))}
          <div className="card stat" style={{ background: 'var(--brand)' }}>
            <span className="small" style={{ color: 'rgba(255,255,255,0.7)' }}>Total {year}</span>
            <span className="value" style={{ fontSize: '1.2rem', color: '#fff' }}>{aed(myYearTotal)}</span>
          </div>
        </div>
      </div>

      {/* New launches */}
      <div className="card">
        <div className="spread"><h3>🏗️ New launches</h3></div>
        {launches && launches.length ? (
          <div className="stack" style={{ gap: 10 }}>
            {launches.map((p) => (
              <div key={p.id} className="row" style={{ gap: 12, borderBottom: '1px solid var(--border)', paddingBottom: 10, flexWrap: 'nowrap', alignItems: 'flex-start' }}>
                {p.image_url ? <img src={p.image_url} alt={p.title} style={{ width: 72, height: 54, objectFit: 'cover', borderRadius: 8, flex: '0 0 auto' }} /> : null}
                <div>
                  <div style={{ fontWeight: 600 }}>{p.title}{p.developer ? <span className="small muted"> · {p.developer}</span> : null}</div>
                  {p.note ? <div className="small muted" style={{ whiteSpace: 'pre-wrap' }}>{p.note}</div> : null}
                  <div className="small muted">{formatDate(p.created_at)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted small">No new launches posted yet.</p>
        )}
      </div>
    </div>
  );
}

async function AdminDashboard({ supabase, name }) {
  const [
    { count: leadCount },
    { count: agentCount },
    { data: deals },
    { data: suggested },
    { data: followups },
    { data: agentList },
  ] = await Promise.all([
    supabase.from('leads').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'agent'),
    supabase.from('deals').select('deal_value, company_commission, agent_commission, closed_on'),
    supabase
      .from('leads')
      .select('id, name, suggested:profiles!leads_suggested_agent_id_fkey(full_name), assigned:profiles!leads_assigned_agent_id_fkey(full_name)')
      .not('suggested_agent_id', 'is', null)
      .limit(10),
    supabase
      .from('lead_followups')
      .select('id, due_on, lead_id, lead:leads(name, status, assigned_agent_id, assigned:profiles!leads_assigned_agent_id_fkey(full_name))')
      .eq('done', false),
    supabase.from('profiles').select('id, full_name').in('role', ['agent', 'admin']).order('full_name'),
  ]);

  // All agents' pending follow-ups for the team calendar (a lead can have several).
  const followupLeads = (followups || [])
    .filter((f) => f.lead && f.lead.status !== 'won' && f.lead.status !== 'lost')
    .map((f) => ({
      fu: f.id,
      lead_id: f.lead_id,
      name: f.lead?.name || 'Lead',
      date: f.due_on,
      agent_id: f.lead?.assigned_agent_id,
      agent_name: f.lead?.assigned?.full_name || 'Unassigned',
    }));

  const totalValue = (deals || []).reduce((s, d) => s + Number(d.deal_value || 0), 0);
  const companyCommission = (deals || []).reduce((s, d) => s + Number(d.company_commission || 0), 0);

  // Sales value by quarter for the current year.
  const year = new Date().getFullYear();
  const quarters = [0, 0, 0, 0];
  for (const d of deals || []) {
    if (!d.closed_on) continue;
    const dt = new Date(d.closed_on);
    if (dt.getFullYear() !== year) continue;
    quarters[Math.floor(dt.getMonth() / 3)] += Number(d.deal_value || 0);
  }
  const yearTotal = quarters.reduce((s, v) => s + v, 0);

  return (
    <div className="stack">
      <h1>{greetingNow()}, {name?.split(' ')[0] || 'there'} 👋</h1>
      <MotivationCard />
      <div className="grid grid-3">
        <div className="card stat"><span className="muted small">Agents</span><span className="value">{agentCount ?? 0}</span></div>
        <div className="card stat"><span className="muted small">Leads</span><span className="value">{leadCount ?? 0}</span></div>
        <div className="card stat"><span className="muted small">Deals closed</span><span className="value">{deals?.length ?? 0}</span></div>
        <div className="card stat"><span className="muted small">Total sales value (all-time)</span><span className="value">{aed(totalValue)}</span></div>
        <div className="card stat"><span className="muted small">Company commission</span><span className="value">{aed(companyCommission)}</span></div>
      </div>

      {/* Team follow-up calendar */}
      <FollowUpCalendar leads={followupLeads} agents={agentList || []} showAgentFilter />

      <div className="card">
        <div className="spread">
          <h3>Sales value by quarter — {year}</h3>
          <span className="small muted">Year total: <strong style={{ color: 'var(--text)' }}>{aed(yearTotal)}</strong></span>
        </div>
        <div className="grid grid-3" style={{ marginTop: 8 }}>
          {['Q1 (Jan–Mar)', 'Q2 (Apr–Jun)', 'Q3 (Jul–Sep)', 'Q4 (Oct–Dec)'].map((label, i) => (
            <div key={label} className="card stat" style={{ background: 'var(--panel-2)', boxShadow: 'none' }}>
              <span className="muted small">{label}</span>
              <span className="value" style={{ fontSize: '1.25rem' }}>{aed(quarters[i])}</span>
            </div>
          ))}
          <div className="card stat" style={{ background: 'var(--brand)' }}>
            <span className="small" style={{ color: 'rgba(255,255,255,0.7)' }}>Total {year}</span>
            <span className="value" style={{ fontSize: '1.25rem', color: '#fff' }}>{aed(yearTotal)}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="spread"><h3>Reassignment suggestions</h3><Link className="small" href="/admin">Manage →</Link></div>
        {suggested && suggested.length ? (
          <table>
            <thead><tr><th>Lead</th><th>Currently</th><th>Suggested</th></tr></thead>
            <tbody>
              {suggested.map((l) => (
                <tr key={l.id}>
                  <td><Link href={`/leads/${l.id}`}>{l.name}</Link></td>
                  <td className="small muted">{l.assigned?.full_name || 'Unassigned'}</td>
                  <td><span className="badge role">→ {l.suggested?.full_name}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted small">No pending suggestions.</p>
        )}
      </div>
    </div>
  );
}
