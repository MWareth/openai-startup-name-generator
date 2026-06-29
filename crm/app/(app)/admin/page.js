import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { aed, formatDate, QUAL_LABELS } from '@/lib/format';
import AddMemberFields from '@/components/AddMemberFields';
import Avatar from '@/components/Avatar';
import DateField from '@/components/DateField';
import {
  createAgent,
  updateAgent,
  deactivateAgent,
  reactivateAgent,
  resetAgentPassword,
  reassignLead,
  createTarget,
  addTier,
  deleteTier,
  archiveTarget,
  createLaunch,
  deleteLaunch,
  createProject,
  deleteProject,
  createDeveloper,
  deleteDeveloper,
  syncProjects,
} from './actions';

export const dynamic = 'force-dynamic';

export default async function AdminPage({ searchParams }) {
  const { supabase } = await requireAdmin();
  const ok = searchParams?.ok;
  const error = searchParams?.error;

  const { data: profiles } = await supabase.from('profiles').select('*').order('full_name');

  // Deactivated agents are simply those whose login is banned in Auth — no DB
  // column needed. A user is inactive while their ban is still in the future.
  const admin = createAdminClient();
  const { data: authList } = await admin.auth.admin.listUsers({ perPage: 200 });
  const now = Date.now();
  const bannedIds = new Set(
    (authList?.users || [])
      .filter((u) => u.banned_until && new Date(u.banned_until).getTime() > now)
      .map((u) => u.id)
  );

  // People who can carry leads: active agents (incl. team leaders) and the
  // selling owner/admin. Deactivated (departed) agents are excluded.
  const agents = (profiles || []).filter(
    (p) => (p.role === 'agent' || p.role === 'admin') && !bannedIds.has(p.id)
  );

  const { data: leads } = await supabase
    .from('leads')
    .select('id, name, qualification, budget, status, assigned_agent_id, suggested_agent_id, assigned:profiles!leads_assigned_agent_id_fkey(full_name), suggested:profiles!leads_suggested_agent_id_fkey(full_name)')
    .order('updated_at', { ascending: false });

  // Pending suggestions first.
  const sortedLeads = (leads || []).sort((a, b) => (b.suggested_agent_id ? 1 : 0) - (a.suggested_agent_id ? 1 : 0));

  // The lead pool: unassigned leads still in play (won/lost are closed history).
  const poolLeads = (leads || []).filter(
    (l) => !l.assigned_agent_id && l.status !== 'won' && l.status !== 'lost'
  );

  const { data: targets } = await supabase
    .from('targets')
    .select('*, agent:profiles(full_name), incentive_tiers(*)')
    .order('created_at', { ascending: false });

  const { data: launches } = await supabase
    .from('launches')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: projects } = await supabase.from('projects').select('*').order('name', { ascending: true });
  const { data: developers } = await supabase.from('developers').select('*').order('name', { ascending: true });

  return (
    <div className="stack">
      <div className="spread">
        <h1>Admin</h1>
        <Link className="btn secondary small" href="/admin/areas">Manage areas &amp; buildings</Link>
      </div>
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
                  <div className="row" style={{ padding: '10px 12px', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <form action={updateAgent} className="row" style={{ gap: 8, flex: '1 1 auto', flexWrap: 'wrap', margin: 0 }}>
                      <input type="hidden" name="agent_id" value={p.id} />
                      <input type="hidden" name="current_email" value={p.email || ''} />
                      <Avatar url={p.avatar_url} name={p.full_name} size="sm" />
                      <input name="full_name" defaultValue={p.full_name} placeholder="Full name" style={{ flex: '1 1 120px' }} />
                      <input name="email" type="email" defaultValue={p.email || ''} placeholder="Email" style={{ flex: '1 1 170px' }} />
                      <input name="avatar_url" defaultValue={p.avatar_url || ''} placeholder="Photo URL" style={{ flex: '1 1 150px' }} />
                      <select name="role" defaultValue={p.role} style={{ width: 130 }}>
                        <option value="agent">Agent</option>
                        <option value="support">Support</option>
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
                    {bannedIds.has(p.id) ? <span className="badge lost">Inactive</span> : null}
                    {p.role !== 'admin' ? (
                      <form action={bannedIds.has(p.id) ? reactivateAgent : deactivateAgent} style={{ margin: 0 }}>
                        <input type="hidden" name="agent_id" value={p.id} />
                        <button className="btn ghost small" type="submit">
                          {bannedIds.has(p.id) ? 'Reactivate' : 'Deactivate'}
                        </button>
                      </form>
                    ) : null}
                    <form action={resetAgentPassword} className="row" style={{ gap: 6, margin: 0 }}>
                      <input type="hidden" name="agent_id" value={p.id} />
                      <input name="password" type="text" placeholder="New temp password" minLength={6} style={{ width: 150 }} />
                      <button className="btn ghost small" type="submit">Reset PW</button>
                    </form>
                  </div>
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

      {/* ---- Lead pool ---- */}
      <div className="card">
        <div className="spread">
          <h2>Lead pool</h2>
          <span className="badge role">{poolLeads.length} available</span>
        </div>
        <p className="small muted">
          Unassigned leads waiting for an owner — including leads freed up when an agent is deactivated
          or taken back from an agent. Assign each one to an active team member.
        </p>
        <table>
          <thead><tr><th>Lead</th><th>Qual</th><th>Budget</th><th>Assign to</th></tr></thead>
          <tbody>
            {poolLeads.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/leads/${l.id}`}>{l.name}</Link></td>
                <td><span className={`badge ${l.qualification}`}>{QUAL_LABELS[l.qualification]}</span></td>
                <td className="small">{l.budget ? aed(l.budget) : <span className="muted">—</span>}</td>
                <td style={{ padding: 0 }}>
                  <form action={reassignLead} className="row" style={{ padding: '8px 12px', gap: 8 }}>
                    <input type="hidden" name="lead_id" value={l.id} />
                    <select name="assigned_agent_id" defaultValue="" style={{ width: 160 }}>
                      <option value="" disabled>Choose agent…</option>
                      {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
                    </select>
                    <button className="btn secondary small" type="submit">Assign</button>
                  </form>
                </td>
              </tr>
            ))}
            {poolLeads.length === 0 ? <tr><td colSpan={4} className="muted">Pool is empty — every lead has an owner.</td></tr> : null}
          </tbody>
        </table>
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
            <div className="field"><label>Target amount (AED gross commission)</label><input name="target_amount" type="number" min="0" step="10000" required /></div>
            <div className="field"><label>Period start</label><DateField name="period_start" /></div>
          </div>
          <div className="field" style={{ maxWidth: 240 }}><label>Period end</label><DateField name="period_end" /></div>
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

      {/* ---- Projects directory ---- */}
      <div className="card">
        <div className="spread">
          <h2>Projects directory</h2>
          <form action={syncProjects}>
            <button className="btn secondary small" type="submit">⟳ Refresh from Google Sheet</button>
          </form>
        </div>
        <p className="small muted">
          Projects are mirrored from your Google Sheet (auto-refreshed daily; click Refresh to pull now).
          Adding below also works for one-offs, but the sheet is the master list.
        </p>
        <form action={createProject}>
          <div className="form-grid">
            <div className="field"><label>Project name</label><input name="name" required /></div>
            <div className="field"><label>Developer</label><input name="developer" /></div>
          </div>
          <div className="form-grid">
            <div className="field"><label>Area / community</label><input name="area" /></div>
            <div className="field">
              <label>Status</label>
              <select name="status" defaultValue="Off-plan"><option value="Off-plan">Off-plan</option><option value="Ready">Ready</option></select>
            </div>
          </div>
          <div className="form-grid">
            <div className="field"><label>Handover</label><input name="handover" placeholder="e.g. Q4 2027" /></div>
            <div className="field"><label>Starting price (AED)</label><input name="starting_price" type="number" min="0" step="10000" /></div>
          </div>
          <div className="field"><label>Payment plan</label><input name="payment_plan" placeholder="e.g. 60/40, 1% monthly" /></div>
          <div className="field"><label>Description</label><textarea name="description" /></div>
          <div className="form-grid">
            <div className="field"><label>Brochure / details URL</label><input name="brochure_url" placeholder="https://…" /></div>
            <div className="field"><label>Image URL</label><input name="image_url" placeholder="https://…/render.jpg" /></div>
          </div>
          <button className="btn" type="submit">Add project</button>
        </form>

        {projects && projects.length ? (
          <>
            <hr className="divider" />
            <div className="stack" style={{ gap: 8 }}>
              {projects.map((p) => (
                <div key={p.id} className="spread" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <div><strong>{p.name}</strong>{p.developer ? <span className="small muted"> · {p.developer}</span> : null} <span className="badge status">{p.status}</span></div>
                  <form action={deleteProject}><input type="hidden" name="project_id" value={p.id} /><button className="btn ghost small" type="submit">Remove</button></form>
                </div>
              ))}
            </div>
          </>
        ) : null}

        <hr className="divider" />
        <h3>Developers</h3>
        <form action={createDeveloper}>
          <div className="form-grid">
            <div className="field"><label>Developer name</label><input name="name" required /></div>
            <div className="field"><label>Website</label><input name="website" placeholder="https://…" /></div>
          </div>
          <div className="field"><label>About</label><textarea name="about" /></div>
          <button className="btn secondary" type="submit">Add developer</button>
        </form>
        {developers && developers.length ? (
          <div className="stack" style={{ gap: 6, marginTop: 10 }}>
            {developers.map((d) => (
              <div key={d.id} className="spread" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>
                <strong>{d.name}</strong>
                <form action={deleteDeveloper}><input type="hidden" name="developer_id" value={d.id} /><button className="btn ghost small" type="submit">Remove</button></form>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
