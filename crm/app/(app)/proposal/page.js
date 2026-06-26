import { requireUser } from '@/lib/auth';
import { aed } from '@/lib/format';

export const dynamic = 'force-dynamic';

const UNIT_TYPES = ['Studio', '1 Bedroom', '2 Bedrooms', '3 Bedrooms', '4 Bedrooms', 'Villa'];

export default async function ProposalPage({ searchParams }) {
  const { supabase } = await requireUser();
  const client = searchParams?.client || '';
  const budget = searchParams?.budget || '';
  const unit = searchParams?.unit || '';
  const searched = budget || unit;

  let matches = [];
  if (searched) {
    let q = supabase.from('projects').select('*');
    if (budget) q = q.or(`starting_price.lte.${Number(budget) || 0},starting_price.is.null`);
    if (unit) q = q.ilike('unit_types', `%${unit}%`);
    q = q.order('starting_price', { ascending: true, nullsFirst: false });
    const { data } = await q;
    matches = data || [];
  }

  return (
    <div className="stack">
      <div>
        <h1>Client proposal builder</h1>
        <p className="muted">Enter the client&apos;s brief, pick the best-fit projects, and generate a branded PDF to share.</p>
      </div>

      <form className="card" method="get">
        <div className="form-grid">
          <div className="field"><label>Client name</label><input name="client" defaultValue={client} placeholder="e.g. Mr. Ahmed" /></div>
          <div className="field"><label>Budget up to (AED)</label><input name="budget" type="number" defaultValue={budget} placeholder="850000" /></div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Unit type</label>
            <select name="unit" defaultValue={unit}>
              <option value="">Any</option>
              {UNIT_TYPES.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div className="field" style={{ alignSelf: 'flex-end' }}>
            <button className="btn" type="submit">Find matches</button>
          </div>
        </div>
      </form>

      {searched ? (
        matches.length ? (
          <form className="stack" method="get" action="/proposal/print">
            <input type="hidden" name="client" value={client} />
            <input type="hidden" name="budget" value={budget} />
            <input type="hidden" name="unit" value={unit} />
            <div className="card">
              <div className="spread">
                <h3>{matches.length} matching project{matches.length > 1 ? 's' : ''}</h3>
                <button className="btn" type="submit">Generate proposal PDF →</button>
              </div>
              <p className="small muted">Tick the ones to include, then generate.</p>
            </div>
            <div className="grid grid-2">
              {matches.map((p) => (
                <label key={p.id} className="card" style={{ cursor: 'pointer' }}>
                  <div className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                    <input type="checkbox" name="ids" value={p.id} defaultChecked style={{ width: 'auto' }} />
                    <strong>{p.name}</strong>
                  </div>
                  <div className="small muted">{p.developer}{p.area ? ` · ${p.area}` : ''}</div>
                  <div className="small" style={{ marginTop: 6 }}>
                    {p.unit_types ? <div><span className="muted">Units:</span> {p.unit_types}</div> : null}
                    {p.starting_price ? <div><span className="muted">From:</span> {aed(p.starting_price)}</div> : null}
                    {p.payment_plan ? <div><span className="muted">Payment:</span> {p.payment_plan}</div> : null}
                    {p.handover ? <div><span className="muted">Handover:</span> {p.handover}</div> : null}
                  </div>
                </label>
              ))}
            </div>
          </form>
        ) : (
          <div className="card muted">No projects match. Try a higher budget or a different unit type.</div>
        )
      ) : null}
    </div>
  );
}
