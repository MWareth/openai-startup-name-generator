import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { aed, formatDate } from '@/lib/format';
import AddMemberFields from '@/components/AddMemberFields';
import Avatar from '@/components/Avatar';
import {
  createAgent,
  updateAgent,
  reassignLead,
  createTarget,
  addTier,
  deleteTier,
  archiveTarget,
  createLaunch,
  deleteLaunch,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }) {
  const { supabase } = await requireAdmin();
  const ok = searchParams?.ok;
  const error = searchParams?.error;

  const { data: profiles } = await supabase.from('profiles').select('*').order('full_name');
  // People who carry leads: agents (incl. team leaders) and the selling owner/admin.
  const agents = (profiles || []).filter((p) => p.role === 'agent' || p.role === 'admin');

  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, suggested_agent_id, assigned:profiles!leads_assigned_agent_id_fkey(full_name), suggested:profiles!leads_suggested_agent_id_fkey(full_name)')
    .order('updated_at', { ascending: false });

  // Pending suggestions first.
  const sortedLeads = (leads || []).sort((a, b) => (b.suggested_agent_id ? 1 : 0) - (a.suggested_agent_id ? 1 : 0));

  const { data: targets } = await supabase
    .from('targets')
    .select('*, agent:profiles(full_name), incentive_tiers(*)')
    .order('created_at', { ascending: false });

  const { data: launches } = await supabase
    .from('launches')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="stack">
      <h1>Admin</h1>
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      {/* ---- Agents ---- */}
      <div className="card">
        <h2>Team</h2>
        <table>
          <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Seniority</th><th></th></tr></thead>
          <tbody>
            {(profiles || []).map((p) => (
              <tr key={p.id}>
                <td colSpan={5} style={{ padding: 0 }}>
                  <form action={updateAgent} className="row" style={{ padding: '10px 12px', gap: 8 }}>
                    <input type="hidden" name="agent_id" value={p.id} />
                    <Avatar url={p.avatar_url} name={p.full_name} size="sm" />
                    <input name="full_name" defaultValue={p.full_name} style={{ flex: '1 1 120px' }} />
                    <span className="small muted" style={{ flex: '1 1 160px' }}>{p.email}</span>
                    <input name="avatar_url" defaultValue={p.avatar_url || ''} placeholder="Photo URL" style={{ flex: '1 1 150px' }} />
                    <select name="role" defaultValue={p.role} style={{ width: 130 }}>
                      <option value="agent">Agent</option>
                      <option value="director">Director</option>
                      <option value="c_suite">C-Suite</option>
                      <option value="admin">Admin (Owner)</option>
                    </select>
                    <select name="seniority" defaultValue={p.seniority} style={{ width: 140 }}>
                      <option value="junior">Junior 50/50</option>
                      <option value="senior">Senior 55/45</option>
                      <option value="team_leader">Team Leader 60/40</option>
                    </select>
                    <button className="btn secondary small" type="submit">Save</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr className="divider" />
        <h3>Add team member</h3>
        <form action={createAgent}>
          <AddMemberFields />
        </form>
      </div>

      {/* ---- Reassign ---- */}
      <div className="card">
        <h2>Reassign leads</h2>
        <p className="small muted">Suggested reassignments are highlighted. Only you can change the assigned agent.</p>
        <table>
          <thead><tr><th>Lead</th><th>Assigned</th><th>Suggested</th><th>Reassign to</th></tr></thead>
          <tbody>
            {sortedLeads.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/leads/${l.id}`}>{l.name}</Link></td>
                <td className="small muted">{l.assigned?.full_name || 'Unassigned'}</td>
                <td>{l.suggested?.full_name ? <span className="badge role">→ {l.suggested.full_name}</span> : <span className="muted small">—</span>}</td>
                <td style={{ padding: 0 }}>
                  <form action={reassignLead} className="row" style={{ padding: '8px 12px', gap: 8 }}>
                    <input type="hidden" name="lead_id" value={l.id} />
                    <select name="assigned_agent_id" style={{ width: 160 }}>
                      <option value="">Unassigned</option>
                      {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                    </select>
                    <button className="btn secondary small" type="submit">Apply</button>
                  </form>
                </td>
              </tr>
            ))}
            {sortedLeads.length === 0 ? <tr><td colSpan={4} className="muted">No leads yet.</td></tr> : null}
          </tbody>
        </table>
      </div>

      {/* ---- Targets & incentives ---- */}
      <div className="card">
        <h2>Targets &amp; incentives</h2>

        <h3>Set a target</h3>
        <form action={createTarget}>
          <div className="form-grid">
            <div className="field">
              <label>Agent</label>
              <select name="agent_id" required>
                {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name} ({a.seniority})</option>)}
              </select>
            </div>
            <div className="field"><label>Target name</label><input name="name" placeholder="Q3 2026 sales target" required /></div>
          </div>
          <div className="form-grid">
            <div className="field"><label>Target amount (AED sales value)</label><input name="target_amount" type="number" min="0" step="10000" required /></div>
            <div className="field"><label>Period start</label><input name="period_start" type="date" /></div>
          </div>
          <div className="field" style={{ maxWidth: 240 }}><label>Period end</label><input name="period_end" type="date" /></div>
          <button className="btn" type="submit">Create target</button>
        </form>

        <hr className="divider" />

        {(targets || []).length ? (
          <div className="stack">
            {targets.map((t) => (
              <div key={t.id} className="card" style={{ background: 'var(--panel-2)' }}>
                <div className="spread">
                  <div>
                    <strong>{t.agent?.full_name}</strong> — {t.name} · {aed(t.target_amount)}
                    {t.is_active ? null : <span className="badge role" style={{ marginLeft: 8 }}>archived</span>}
                    <div className="small muted">{formatDate(t.period_start)} → {formatDate(t.period_end)}</div>
                  </div>
                  {t.is_active ? (
                    <form action={archiveTarget}>
                      <input type="hidden" name="target_id" value={t.id} />
                      <button className="btn ghost small" type="submit">Archive</button>
                    </form>
                  ) : null}
                </div>

                <div style={{ marginTop: 8 }}>
                  {(t.incentive_tiers || [])
                    .sort((a, b) => a.threshold_amount - b.threshold_amount)
                    .map((tier) => (
                      <div key={tier.id} className="tier">
                        <div style={{ flex: 1 }} className="small">
                          <strong>{tier.reward_label}</strong> — at {aed(tier.threshold_amount)}
                          {Number(tier.reward_amount) > 0 ? ` · ${aed(tier.reward_amount)}` : ''}
                        </div>
                        <form action={deleteTier}>
                          <input type="hidden" name="tier_id" value={tier.id} />
                          <button className="btn ghost small" type="submit">✕</button>
                        </form>
                      </div>
                    ))}
                </div>

                <form action={addTier} className="row" style={{ marginTop: 10, gap: 8 }}>
                  <input type="hidden" name="target_id" value={t.id} />
                  <input name="reward_label" placeholder="Reward (e.g. Bali trip)" style={{ flex: '1 1 160px' }} required />
                  <input name="threshold_amount" type="number" min="0" step="10000" placeholder="Threshold AED" style={{ width: 150 }} required />
                  <input name="reward_amount" type="number" min="0" step="500" placeholder="Bonus AED (opt)" style={{ width: 140 }} />
                  <button className="btn secondary small" type="submit">+ Tier</button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted small">No targets yet.</p>
        )}
      </div>

      {/* ---- New launches ---- */}
      <div className="card">
        <h2>New launches</h2>
        <p className="small muted">Post a new project/development — it appears on every agent&apos;s home feed.</p>
        <form action={createLaunch}>
          <div className="form-grid">
            <div className="field"><label>Project title</label><input name="title" placeholder="e.g. South Square — Tower B" required /></div>
            <div className="field"><label>Developer</label><input name="developer" placeholder="e.g. Dubai South" /></div>
          </div>
          <div className="field"><label>Note (optional)</label><textarea name="note" placeholder="Launch price, handover, commission, key selling points…" /></div>
          <div className="field"><label>Image URL (optional)</label><input name="image_url" placeholder="https://…/render.jpg" /></div>
          <button className="btn" type="submit">Post launch</button>
        </form>

        {launches && launches.length ? (
          <>
            <hr className="divider" />
            <div className="stack" style={{ gap: 10 }}>
              {launches.map((p) => (
                <div key={p.id} className="spread" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
                  <div>
                    <strong>{p.title}</strong>{p.developer ? <span className="small muted"> · {p.developer}</span> : null}
                    {p.note ? <div className="small muted">{p.note}</div> : null}
                    <div className="small muted">{formatDate(p.created_at)}</div>
                  </div>
                  <form action={deleteLaunch}>
                    <input type="hidden" name="launch_id" value={p.id} />
                    <button className="btn ghost small" type="submit">Remove</button>
                  </form>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
