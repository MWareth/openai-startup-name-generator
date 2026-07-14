import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import Avatar from '@/components/Avatar';
import { ROLE_LABELS, SENIORITY_NAMES } from '@/lib/format';
import { updateMyProfile } from './actions';
import { changeMyPassword } from '../../set-password/actions';
import EnableNotifications from '@/components/EnableNotifications';
import TestPushButton from '@/components/TestPushButton';
import { sendTestPush } from './actions';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ searchParams }) {
  const { user, profile, supabase } = await requireUser();

  // Video avatar status (tolerant if migration 0030 isn't applied yet).
  const { data: myAvatar } = await supabase
    .from('avatar_profiles')
    .select('consent_at, avatar_id, voice_id')
    .eq('user_id', user.id)
    .maybeSingle()
    .then((r) => r, () => ({ data: null }));

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
              <span className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>🏢 {profile?.team || 'Offplan'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Dream goals — the fun bit */}
      <div className="grid grid-2">
        <div className="card stat">
          <span className="muted small" style={{ fontWeight: 700 }}>🎯 My dream this week</span>
          <span style={{ fontWeight: 600, marginTop: 4 }}>{profile?.dream_week || <span className="muted small">Set it below…</span>}</span>
        </div>
        <div className="card stat">
          <span className="muted small" style={{ fontWeight: 700 }}>🏎️ Dream car by year-end</span>
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
            <label>🏢 Team <span className="small muted">— set by your admin (view only)</span></label>
            <input value={profile?.team || 'Offplan'} disabled readOnly style={{ opacity: 0.65, cursor: 'not-allowed' }} />
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

      {/* Notifications */}
      <div className="card">
        <h3>🔔 Notifications</h3>
        <EnableNotifications vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''} />
        <div style={{ marginTop: 10 }}>
          <TestPushButton action={sendTestPush} />
        </div>
        <details className="small muted" style={{ marginTop: 12 }}>
          <summary>Not getting notifications? Read this</summary>
          <div className="stack" style={{ gap: 8, marginTop: 8 }}>
            <div>
              <strong>iPhone / iPad:</strong> web notifications only work from the installed app.
              <ol style={{ margin: '4px 0 0 18px' }}>
                <li>Open the CRM in <strong>Safari</strong> (not Chrome).</li>
                <li>Tap the <strong>Share</strong> icon → <strong>Add to Home Screen</strong>.</li>
                <li>Open the app from the new <strong>home-screen icon</strong>.</li>
                <li>Go to Profile → tap <strong>Enable notifications</strong> → <strong>Allow</strong>.</li>
                <li>Send the test above. (Requires iOS 16.4 or newer.)</li>
              </ol>
            </div>
            <div>
              <strong>Samsung / Android:</strong> notifications only survive in the background when the app is <strong>installed</strong>.
              <ol style={{ margin: '4px 0 0 18px' }}>
                <li>Open the CRM in <strong>Chrome</strong>.</li>
                <li>Menu <strong>⋮</strong> → <strong>Install app / Add to Home screen</strong>.</li>
                <li>Open it from the installed icon, then <strong>Enable notifications</strong>.</li>
                <li>In phone Settings, allow notifications for the app and turn <strong>off battery optimization</strong> for it.</li>
              </ol>
            </div>
          </div>
        </details>
      </div>

      {/* Video avatar */}
      <div className="card">
        <h3>🎥 My video avatar</h3>
        {myAvatar?.avatar_id && myAvatar?.voice_id ? (
          <p className="small" style={{ margin: 0 }}>
            ✅ <strong>Ready.</strong> Open <Link href="/content">Content Studio</Link>, pick an approved script,
            and tap <strong>🎥 Make my video</strong>.
          </p>
        ) : (
          <div className="spread" style={{ flexWrap: 'wrap', gap: 8 }}>
            <p className="small muted" style={{ margin: 0 }}>
              {myAvatar?.consent_at
                ? 'Setup in progress — everything you need is in the recording studio.'
                : 'One 2-minute recording lets the CRM make videos of you presenting projects, in your own voice.'}
            </p>
            <Link className="btn secondary small" href="/content/avatar">🎬 Open the recording studio →</Link>
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="card">
        <h3>🔒 Change password</h3>
        <p className="small muted">Set a new password for your account. You&apos;ll keep using it to log in.</p>
        <form action={changeMyPassword} className="stack" style={{ gap: 10 }}>
          <input type="hidden" name="back" value="/profile" />
          <input type="hidden" name="next" value="/profile?ok=1" />
          <div className="field">
            <label>New password</label>
            <input name="password" type="password" minLength={6} required placeholder="At least 6 characters" />
          </div>
          <button className="btn secondary" type="submit">Update password</button>
        </form>
      </div>
    </div>
  );
}
