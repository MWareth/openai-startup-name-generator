import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import SubmitButton from '@/components/SubmitButton';
import { createArea, deleteArea, createBuilding, deleteBuilding } from './actions';

export const dynamic = 'force-dynamic';

export default async function AreasAdminPage({ searchParams }) {
  const { supabase } = await requireAdmin();
  const ok = searchParams?.ok;
  const error = searchParams?.error;

  const { data: areas } = await supabase.from('areas').select('*').order('name');
  const { data: buildings } = await supabase
    .from('buildings')
    .select('*, area:areas(name)')
    .order('name');

  return (
    <div className="stack">
      <div>
        <Link className="small muted" href="/admin">← Admin</Link>
        <h1>Areas &amp; buildings</h1>
        <p className="muted">
          The master location list powering autocomplete on the lead form.
          {areas?.length ? ` ${areas.length} areas` : ''}
          {buildings?.length ? ` · ${buildings.length} buildings` : ''}.
        </p>
      </div>
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      <div className="grid grid-2">
        {/* Areas */}
        <div className="card">
          <h2>Areas / communities</h2>
          <form action={createArea} className="row" style={{ gap: 8, marginBottom: 12 }}>
            <input name="name" placeholder="New area name" style={{ flex: 1 }} required />
            <SubmitButton className="btn small" pendingLabel="Adding…">Add</SubmitButton>
          </form>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table>
              <tbody>
                {(areas || []).map((a) => (
                  <tr key={a.id}>
                    <td>{a.name}</td>
                    <td className="right">
                      <form action={deleteArea}>
                        <input type="hidden" name="area_id" value={a.id} />
                        <SubmitButton className="btn ghost small" pendingLabel="…">✕</SubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
                {(areas || []).length === 0 ? <tr><td className="muted">No areas yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buildings */}
        <div className="card">
          <h2>Buildings / towers</h2>
          <form action={createBuilding} className="stack" style={{ gap: 8, marginBottom: 12 }}>
            <input name="name" placeholder="New building / tower name" required />
            <div className="row" style={{ gap: 8 }}>
              <select name="area_id" style={{ flex: 1 }}>
                <option value="">— Area (optional) —</option>
                {(areas || []).map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <SubmitButton className="btn small" pendingLabel="Adding…">Add</SubmitButton>
            </div>
          </form>
          <div style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table>
              <tbody>
                {(buildings || []).map((b) => (
                  <tr key={b.id}>
                    <td>
                      {b.name}
                      {b.area?.name ? <div className="small muted">{b.area.name}</div> : null}
                    </td>
                    <td className="right">
                      <form action={deleteBuilding}>
                        <input type="hidden" name="building_id" value={b.id} />
                        <SubmitButton className="btn ghost small" pendingLabel="…">✕</SubmitButton>
                      </form>
                    </td>
                  </tr>
                ))}
                {(buildings || []).length === 0 ? (
                  <tr><td className="muted">No buildings yet — add them here or run the DLD importer.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Bulk import from Dubai Land Department</h3>
        <p className="small muted">
          To load every Dubai community and building, download the open dataset from Dubai Pulse
          (data.dubai) as CSV and run <code>node scripts/import_dld_areas.mjs &lt;file.csv&gt;</code> from
          the <code>crm/</code> folder with your service-role key set. See <code>scripts/README.md</code>.
        </p>
      </div>
    </div>
  );
}
