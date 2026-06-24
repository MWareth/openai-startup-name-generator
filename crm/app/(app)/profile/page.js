import { requireUser } from '@/lib/auth';
import Avatar from '@/components/Avatar';
import { ROLE_LABELS, SENIORITY_NAMES } from '@/lib/format';
import { updateMyAvatar } from './actions';

export const dynamic = 'force-dynamic';

export default async function ProfilePage({ searchParams }) {
  const { user, profile } = await requireUser();

  return (
    <div className="stack" style={{ maxWidth: 520 }}>
      <h1>My profile</h1>
      {searchParams?.ok ? <div className="alert ok">Photo updated. ✅</div> : null}
      {searchParams?.error ? <div className="alert error">{searchParams.error}</div> : null}

      <div className="card">
        <div className="row" style={{ gap: 14, flexWrap: 'nowrap' }}>
          <Avatar url={profile?.avatar_url} name={profile?.full_name} size="md" />
          <div>
            <div style={{ fontWeight: 600 }}>{profile?.full_name || user.email}</div>
            <div className="small muted">{profile?.email || user.email}</div>
            <div className="small muted">
              {ROLE_LABELS[profile?.role] || profile?.role}
              {profile?.role === 'agent' ? ` · ${SENIORITY_NAMES[profile?.seniority] || profile?.seniority}` : ''}
            </div>
          </div>
        </div>

        <hr className="divider" />

        <h3>Your photo</h3>
        <p className="small muted">
          Paste a <strong>direct image link</strong> (ending in .jpg / .png). Tip: right-click an image
          online → &ldquo;Copy image address&rdquo;.
        </p>
        <form action={updateMyAvatar}>
          <div className="field">
            <label>Photo URL</label>
            <input name="avatar_url" defaultValue={profile?.avatar_url || ''} placeholder="https://…/me.jpg" />
          </div>
          <button className="btn" type="submit">Save photo</button>
        </form>
      </div>
    </div>
  );
}
