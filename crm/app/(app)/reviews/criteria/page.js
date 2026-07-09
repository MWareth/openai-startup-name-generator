import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { KPI_CATEGORIES, groupByCategory } from '@/lib/reviews';
import SubmitButton from '@/components/SubmitButton';
import { createCriterion, updateCriterion, deleteCriterion } from '../actions';

export const dynamic = 'force-dynamic';

const CategorySelect = ({ name, value }) => (
  <select name={name} defaultValue={value || ''} style={{ flex: '0 0 180px' }}>
    <option value="">— Category —</option>
    {KPI_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
  </select>
);

export default async function CriteriaPage({ searchParams }) {
  const { supabase } = await requireAdmin();
  const ok = searchParams?.ok;
  const error = searchParams?.error;

  const { data: criteria } = await supabase
    .from('review_criteria')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  const grouped = groupByCategory(criteria);

  return (
    <div className="stack" style={{ maxWidth: 820 }}>
      <div>
        <Link className="small muted" href="/reviews">← KPIs</Link>
        <h1>KPI criteria</h1>
        <p className="muted">
          Rename, reorder, add or retire the KPIs agents are scored on, grouped into the five categories.
          Tick <em>auto from target</em> on the one that should pre-fill from each agent&apos;s target progress.
          Each category is weighted equally toward the score out of 100.
        </p>
      </div>
      {ok ? <div className="alert ok">{ok}</div> : null}
      {error ? <div className="alert error">{error}</div> : null}

      {grouped.map(({ category, items }) => (
        <div key={category} className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <div style={{ padding: '12px 14px 0', fontWeight: 700, color: 'var(--gold-2)', textTransform: 'uppercase', letterSpacing: '.04em', fontSize: '.85rem' }}>
            {category}
          </div>
          <div className="stack" style={{ gap: 0 }}>
            {items.map((c) => (
              <form key={c.id} action={updateCriterion} className="row" style={{ padding: '8px 14px', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border)' }}>
                <input type="hidden" name="criterion_id" value={c.id} />
                <input name="sort_order" type="number" defaultValue={c.sort_order} style={{ width: 60 }} />
                <input name="label" defaultValue={c.label} style={{ flex: '1 1 160px' }} required />
                <input name="hint" defaultValue={c.hint || ''} placeholder="short hint" style={{ flex: '1 1 160px' }} />
                <CategorySelect name="category" value={c.category} />
                <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                  <input type="checkbox" name="auto_from_target" value="true" defaultChecked={c.auto_from_target} style={{ width: 'auto' }} /> auto
                </label>
                <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
                  <input type="checkbox" name="active" value="true" defaultChecked={c.active} style={{ width: 'auto' }} /> active
                </label>
                <SubmitButton className="btn secondary small" pendingLabel="…">Save</SubmitButton>
              </form>
            ))}
          </div>
        </div>
      ))}
      {grouped.length === 0 ? <div className="card muted">No KPIs yet — run migration 0022, or add one below.</div> : null}

      <div className="card">
        <h3>Add KPI</h3>
        <form action={createCriterion} className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <input name="sort_order" type="number" placeholder="#" defaultValue={((criteria?.length || 0) + 1) * 10} style={{ width: 60 }} />
          <input name="label" placeholder="New KPI name" style={{ flex: '1 1 160px' }} required />
          <input name="hint" placeholder="short hint" style={{ flex: '1 1 160px' }} />
          <CategorySelect name="category" value="" />
          <label className="small" style={{ display: 'flex', alignItems: 'center', gap: 6, margin: 0 }}>
            <input type="checkbox" name="auto_from_target" value="true" style={{ width: 'auto' }} /> auto from target
          </label>
          <SubmitButton className="btn small" pendingLabel="Adding…">Add</SubmitButton>
        </form>
      </div>

      <div className="card">
        <h3>Remove a KPI</h3>
        <p className="small muted">Removing a KPI keeps it on past scorecards (the label is stored on each score). It just won&apos;t appear on new scorecards. To hide one without deleting, untick <em>active</em> above.</p>
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
