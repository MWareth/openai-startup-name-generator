import Link from 'next/link';
import { requireStaff } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { groupProjectNames } from '@/lib/projectNames';
import { mergeProjectNames } from './actions';

export const dynamic = 'force-dynamic';

// Project-name cleanup. Agents type the same project many ways; this groups the
// variants, shows how many leads each has, and renames them to one master name
// — but only when the user hits Merge on that specific group. Nothing is
// changed automatically.

export default async function ProjectNamesPage({ searchParams }) {
  await requireStaff();
  const admin = createAdminClient();

  const { data: rows } = await admin.from('leads').select('property_interest');
  const counts = new Map();
  for (const r of rows || []) {
    const name = String(r.property_interest || '').trim();
    if (!name) continue;
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  const groups = groupProjectNames([...counts.entries()].map(([name, count]) => ({ name, count })));

  const dupes = groups.filter((g) => g.variants.length > 1);
  const clean = groups.filter((g) => g.variants.length === 1);
  const blank = (rows || []).filter((r) => !String(r.property_interest || '').trim()).length;

  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <div>
        <h1 style={{ marginBottom: 4 }}>🏗️ Project names</h1>
        <p className="muted small" style={{ margin: 0 }}>
          The same project typed different ways splits your reports and the Leads filter. Review each
          group, set the correct name, and merge. <strong>Nothing changes until you press Merge.</strong>
        </p>
      </div>
      {searchParams?.ok ? <div className="alert ok">{searchParams.ok}</div> : null}
      {searchParams?.error ? <div className="alert error">{searchParams.error}</div> : null}

      <div className="grid grid-3">
        <div className="card stat"><span className="muted small">Projects on leads</span><span className="value">{groups.length}</span></div>
        <div className="card stat">
          <span className="muted small">Need merging</span>
          <span className="value" style={{ color: dupes.length ? 'var(--red)' : undefined }}>{dupes.length}</span>
        </div>
        <div className="card stat"><span className="muted small">Leads with no project</span><span className="value">{blank}</span></div>
      </div>

      {dupes.length ? (
        dupes.map((g) => (
          <form key={g.key} action={mergeProjectNames} className="card" style={{ borderColor: 'var(--amber, var(--border))' }}>
            <div className="spread" style={{ flexWrap: 'wrap', gap: 8, alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ margin: 0 }}>{g.suggested}</h3>
                <p className="small muted" style={{ margin: '2px 0 0' }}>
                  {g.variants.length} spellings · {g.total} lead{g.total === 1 ? '' : 's'} in total
                </p>
                {g.hasTypo ? (
                  <p className="small" style={{ margin: '4px 0 0', color: 'var(--amber, var(--gold))' }}>
                    ✏️ Includes a near-match (one letter different, e.g. Lyvia / Livia) — double-check
                    these really are the same project before merging.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="stack" style={{ gap: 4, margin: '10px 0' }}>
              {g.variants.map((v) => (
                <label key={v.name} className="small" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="checkbox" name="variant" value={v.name} defaultChecked />
                  <span>{v.name}</span>
                  <span className="muted">· {v.count} lead{v.count === 1 ? '' : 's'}</span>
                  <Link className="small no-print" href={`/leads?project=${encodeURIComponent(v.name)}`} style={{ marginLeft: 'auto' }}>
                    view →
                  </Link>
                </label>
              ))}
            </div>
            <p className="small muted" style={{ margin: '0 0 8px' }}>
              Untick any spelling that is genuinely a different project — it will be left alone.
            </p>

            <div className="row" style={{ gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <label className="small muted" style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 240px' }}>
                Correct name (edit if you like)
                <input name="master" defaultValue={g.suggested} list={`opts-${g.key}`} autoComplete="off" />
                <datalist id={`opts-${g.key}`}>
                  {g.variants.map((v) => <option key={v.name} value={v.name} />)}
                </datalist>
              </label>
              <button className="btn" type="submit">Merge</button>
            </div>
          </form>
        ))
      ) : (
        <div className="card">
          <p className="muted small" style={{ margin: 0 }}>
            ✅ No duplicate project names found — every project on your leads is spelled one way.
          </p>
        </div>
      )}

      {clean.length ? (
        <details className="card">
          <summary className="small muted">All clean project names ({clean.length})</summary>
          <div className="stack" style={{ gap: 2, marginTop: 8 }}>
            {clean.map((g) => (
              <div key={g.key} className="small">
                {g.variants[0].name} <span className="muted">· {g.total} lead{g.total === 1 ? '' : 's'}</span>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}
