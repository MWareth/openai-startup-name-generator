import { requireUser } from '@/lib/auth';
import Avatar from '@/components/Avatar';
import { ROLE_LABELS, SENIORITY_NAMES } from '@/lib/format';
import { updateMyProfile } from './actions';

export const dynamic = 'force-dynamic';

const TEAMS = ['Offplan team', 'Secondary team', 'Commercial team', 'Rentals team', 'Property management'];

export default async function ProfilePage({ searchParams }) {
  const { user, profile } = await requireUser();

  return (
    <div className="stack" style={{ maxWidth: 560 }}>
      {searchParams?.ok ? <div className="alert ok">Saved. ✅</div> : null}
      {searchParams?.error ? <div className="alert error">{searchParams.error}</div> : null}

      {/* Fun header banner */}
      <div className="card" style={{ background: 'linear-gradient(135deg, var(--brand), #0a2540)', color: '#fff', border: 'none' }}>
        <div className="row" style={{ gap: 16, flexWrap: 'nowrap', alignItems: 'center' }}>
          <Avatar url={profile?.avatar_url} name={profile?.full_name} size="md" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.3rem' }}>{profile?.full_name || user.email} ✨</div>
            <div className="small" style={{ opacity: 0.85 }}>
              {ROLE_LABELS[profile?.role] || profile?.role}
              {profile?.role === 'agent' ? ` · ${SENIORITY_NAMES[profile?.seniority] || profile?.seniority}` : ''}
            </div>
            <div style={{ marginTop: 8 }}>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>🏢 {profile?.team || 'Offplan team'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dream goals — the fun bit */}
      <div className="grid grid-2">
        <div className="card stat">
          <span className="muted small">🎯 My dream this week</span>
          <span style={{ fontWeight: 600, marginTop: 4 }}>{profile?.dream_week || <span className="muted small">Set it below…</span>}</span>
        </div>
        <div className="card stat">
          <span className="muted small">🏎️ Dream car by year-end</span>
          <span style={{ fontWeight: 600, marginTop: 4 }}>{profile?.dream_car || <span className="muted small">Set it below…</span>}</span>
        </div>
      </div>

      {/* Edit form */}
      <div className="card">
        <h3>Edit my profile 🚀</h3>
        <form action={updateMyProfile} className="stack" style={{ gap: 12 }}>
          <div className="field">
            <label>📱 Phone number</label>
            <input name="phone" type="tel" defaultValue={profile?.phone || ''} placeholder="+971 50 123 4567" />
          </div>

          <div className="field">
            <label>📧 Email <span className="small muted">— set by your admin (view only)</span></label>
            <input value={profile?.email || user.email} disabled readOnly style={{ opacity: 0.65, cursor: 'not-allowed' }} />
          </div>

          <div className="field">
            <label>🏢 Team</label>
            <select name="team" defaultValue={profile?.team || 'Offplan team'}>
              {TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div className="field">
            <label>🎯 My dream this week</label>
            <input name="dream_week" defaultValue={profile?.dream_week || ''} placeholder="e.g. Close 2 deals and book 5 viewings" />
          </div>

          <div className="field">
            <label>🏎️ Dream car by the end of this year</label>
            <input name="dream_car" defaultValue={profile?.dream_car || ''} placeholder="e.g. Porsche 911 🤩" />
          </div>

          <div className="field">
            <label>🖼️ Photo URL</label>
            <input name="avatar_url" defaultValue={profile?.avatar_url || ''} placeholder="https://…/me.jpg" />
            <span className="small muted">Paste a direct image link (.jpg / .png) — right-click an image online → &ldquo;Copy image address&rdquo;.</span>
          </div>

          <button className="btn" type="submit">Save my profile</button>
        </form>
      </div>
    </div>
  );
}
