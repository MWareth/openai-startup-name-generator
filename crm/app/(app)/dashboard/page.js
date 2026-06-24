import Link from 'next/link';
import { requireUser, hasAdminAccess } from '@/lib/auth';
import { getTargetProgress } from '@/lib/targets';
import { aed, pct, QUAL_LABELS, formatDate } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const { user, profile, supabase } = await requireUser();
  const isAdmin = hasAdminAccess(profile);

  if (isAdmin) return <AdminDashboard supabase={supabase} name={profile.full_name} />;

  // Agent dashboard
  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, qualification, status, updated_at')
    .order('updated_at', { ascending: false })
    .limit(6);

  const openLeads = (leads || []).filter((l) => l.status !== 'won' && l.status !== 'lost').length;

  // Follow-ups due today or overdue (open leads only).
  const today = new Date().toISOString().slice(0, 10);
  const { data: dueRaw } = await supabase
    .from('leads')
    .select('id, name, qualification, status, next_follow_up')
    .not('next_follow_up', 'is', null)
    .lte('next_follow_up', today)
    .order('next_follow_up', { ascending: true })
    .limit(15);
  const dueLeads = (dueRaw || []).filter((l) => l.status !== 'won' && l.status !== 'lost');

  const { data: target } = await supabase
    .from('targets')
    .select('*')
    .eq('agent_id', user.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const progress = target ? await getTargetProgress(supabase, target) : null;

  return (
    <div className="stack">
      <h1>Welcome back, {profile.full_name?.split(' ')[0] || 'agent'} 👋</h1>

      <div className="grid grid-3">
        <div className="card stat"><span className="muted small">Open leads</span><span className="value">{openLeads}</span></div>
        <div className="card stat"><span className="muted small">Deals won</span><span className="value">{progress?.dealCount ?? 0}</span></div>
        <div className="card stat"><span className="muted small">Your commission</span><span className="value">{aed(progress?.commission ?? 0)}</span></div>
      </div>

      <div className="card">
        <div className="spread">
          <h3>📋 Follow-ups due {dueLeads.length ? <span className="badge hot">{dueLeads.length}</span> : null}</h3>
        </div>
        {dueLeads.length ? (
          <div className="stack" style={{ gap: 8 }}>
            {dueLeads.map((l) => (
              <div key={l.id} className="spread" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                <div>
                  <Link href={`/leads/${l.id}`}>{l.name}</Link>{' '}
                  <span className={`badge ${l.qualification}`}>{QUAL_LABELS[l.qualification]}</span>
                </div>
                <span className="small muted">due {formatDate(l.next_follow_up)}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted small">You&apos;re all caught up — no follow-ups due. 🎉</p>
        )}
      </div>

      {progress ? (
        <div className="card">
          <div className="spread">
            <h3>{target.name}</h3>
            <span className="small muted">{pct(progress.progress)} of {aed(progress.goal)}</span>
          </div>
          <div className="progress"><div style={{ width: pct(progress.progress) }} /></div>
          <p className="small muted" style={{ marginTop: 8 }}>
            {aed(progress.achieved)} achieved · {aed(progress.remaining)} to go
            {progress.nextTier ? <> · next reward at {aed(progress.nextTier.threshold_amount)}: <strong>{progress.nextTier.reward_label}</strong></> : null}
          </p>
          <Link className="small" href="/targets">View targets &amp; incentives →</Link>
        </div>
      ) : (
        <div className="card muted">No active target set yet. Your admin will assign one.</div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="spread" style={{ padding: '16px 18px 0' }}>
          <h3>Recent leads</h3>
          <Link className="small" href="/leads">All leads →</Link>
        </div>
        {leads && leads.length ? (
          <table>
            <thead><tr><th>Name</th><th>Qual</th><th>Status</th><th>Updated</th></tr></thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td><Link href={`/leads/${l.id}`}>{l.name}</Link></td>
                  <td><span className={`badge ${l.qualification}`}>{QUAL_LABELS[l.qualification]}</span></td>
                  <td className="small" style={{ textTransform: 'capitalize' }}>{l.status}</td>
                  <td className="small muted">{formatDate(l.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="muted" style={{ padding: 18 }}>No leads yet. <Link href="/leads/new">Add one</Link>.</p>
        )}
      </div>
    </div>
  );
}

async function AdminDashboard({ supabase, name }) {
  const { count: leadCount } = await supabase.from('leads').select('id', { count: 'exact', head: true });
  const { count: agentCount } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'agent');
  const { data: deals } = await supabase.from('deals').select('deal_value, company_commission, agent_commission');

  const totalValue = (deals || []).reduce((s, d) => s + Number(d.deal_value || 0), 0);
  const companyCommission = (deals || []).reduce((s, d) => s + Number(d.company_commission || 0), 0);

  const { data: suggested } = await supabase
    .from('leads')
    .select('id, name, suggested:profiles!leads_suggested_agent_id_fkey(full_name), assigned:profiles!leads_assigned_agent_id_fkey(full_name)')
    .not('suggested_agent_id', 'is', null)
    .limit(10);

  return (
    <div className="stack">
      <h1>Admin overview</h1>
      <div className="grid grid-3">
        <div className="card stat"><span className="muted small">Agents</span><span className="value">{agentCount ?? 0}</span></div>
        <div className="card stat"><span className="muted small">Leads</span><span className="value">{leadCount ?? 0}</span></div>
        <div className="card stat"><span className="muted small">Deals closed</span><span className="value">{deals?.length ?? 0}</span></div>
        <div className="card stat"><span className="muted small">Total sales value</span><span className="value">{aed(totalValue)}</span></div>
        <div className="card stat"><span className="muted small">Company commission</span><span className="value">{aed(companyCommission)}</span></div>
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
