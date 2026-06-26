import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import SubmitButton from '@/components/SubmitButton';
import { createCriterion, updateCriterion, deleteCriterion } from '../actions';

export const dynamic = 'force-dynamic';

export default async function CriteriaPage({ searchParams }) {
  const { supabase } = await requireAdmin();
  const ok = searchParams?.ok;
  const error = searchParams?.error;

  const { data: criteria } = await supabase
    .from('review_criteria')
    .select('*')
    .order('sort_order', { ascending: true });

  return (
    <div className="stack" style={{ maxWidth: 760 }}>
      <div>
        <Link className="small muted" href="/reviews">← Reviews</Link>
        <h1>Review criteria</h1>
        <p className="muted">
          Rename, reorder, add or retire the criteria agents are rated on. Tick <em>auto from target</em>
          on the one that should pre-fill from each agent&apos;s target progress.
        </p>
      </div>
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table>
          <thead>
            <tr><th>Order</th><th>Criterion</th><th>Auto&nbsp;from&nbsp;target</th><th>Active</th><th></th></tr>
          </thead>
          <tbody>
            {(criteria || []).map((c) => (
              <tr key={c.id}>
                <td colSpan={5} style={{ padding: 0 }}>
                  <form action={updateCriterion} className="row" style={{ padding: '8px 12px', gap: 8 }}>
                    <input type="hidden" name="criterion_id" value={c.id} />
                    <input name="sort_order" type="number" defaultValue={c.sort_order} style={{ width: 64 }} />
                    <input name="label" defaultValue={c.label} style={{ flex: '1 1 220px' }} required />
                    <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                      <input type="checkbox" name="auto_from_target" value="true" defaultChecked={c.auto_from_target} style={{ width: 'auto' }} /> auto
                    </label>
                    <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                      <input type="checkbox" name="active" value="true" defaultChecked={c.active} style={{ width: 'auto' }} /> active
                    </label>
                    <SubmitButton className="btn secondary small" pendingLabel="…">Save</SubmitButton>
                  </form>
                </td>
              </tr>
            ))}
            {(criteria || []).length === 0 ? <tr><td colSpan={5} className="muted">No criteria yet.</td></tr> : null}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Add criterion</h3>
        <form action={createCriterion} className="row" style={{ gap: 8 }}>
          <input name="sort_order" type="number" placeholder="#" defaultValue={(criteria?.length || 0) + 1} style={{ width: 64 }} />
          <input name="label" placeholder="New criterion name" style={{ flex: 1 }} required />
          <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
            <input type="checkbox" name="auto_from_target" value="true" style={{ width: 'auto' }} /> auto from target
          </label>
          <SubmitButton className="btn small" pendingLabel="Adding…">Add</SubmitButton>
        </form>
      </div>

      <div className="card">
        <h3>Remove a criterion</h3>
        <p className="small muted">Removing a criterion keeps it on past reviews (the label is stored on each score). It just won&apos;t appear on new reviews.</p>
        <div className="stack" style={{ gap: 6 }}>
          {(criteria || []).map((c) => (
            <form key={c.id} action={deleteCriterion} className="spread">
              <span className="small">{c.label}</span>
              <input type="hidden" name="criterion_id" value={c.id} />
              <button className="btn ghost small" type="submit">Remove</button>
            </form>
          ))}
        </div>
      </div>
    </div>
  );
}
