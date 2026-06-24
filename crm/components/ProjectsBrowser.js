'use client';

import { useState } from 'react';
import { aed } from '@/lib/format';

export default function ProjectsBrowser({ projects, developers }) {
  const [tab, setTab] = useState('projects');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [dev, setDev] = useState('');

  const devNames = Array.from(new Set(projects.map((p) => p.developer).filter(Boolean))).sort();
  const filtered = projects.filter((p) => {
    if (status && p.status !== status) return false;
    if (dev && p.developer !== dev) return false;
    if (q) {
      const s = q.toLowerCase();
      if (!`${p.name} ${p.developer || ''} ${p.area || ''}`.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  return (
    <div className="stack">
      <div className="row" style={{ gap: 8 }}>
        <button type="button" className={`btn small ${tab === 'projects' ? '' : 'secondary'}`} onClick={() => setTab('projects')}>Projects</button>
        <button type="button" className={`btn small ${tab === 'developers' ? '' : 'secondary'}`} onClick={() => setTab('developers')}>Developers</button>
      </div>

      {tab === 'projects' ? (
        <>
          <div className="card">
            <div className="row" style={{ gap: 10, alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 200px' }}><label>Search</label><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Project, developer, area…" /></div>
              <div style={{ flex: '1 1 140px' }}><label>Developer</label><select value={dev} onChange={(e) => setDev(e.target.value)}><option value="">All</option>{devNames.map((d) => <option key={d} value={d}>{d}</option>)}</select></div>
              <div style={{ flex: '1 1 120px' }}><label>Status</label><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option><option value="Off-plan">Off-plan</option><option value="Ready">Ready</option></select></div>
            </div>
          </div>

          <div className="grid grid-2">
            {filtered.map((p) => (
              <div key={p.id} className="card">
                {p.image_url ? <img src={p.image_url} alt={p.name} style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} /> : null}
                <div className="spread"><h3 style={{ margin: 0 }}>{p.name}</h3><span className="badge status">{p.status}</span></div>
                <div className="small muted">{p.developer}{p.area ? ` · ${p.area}` : ''}</div>
                {p.description ? <p className="small" style={{ marginTop: 6 }}>{p.description}</p> : null}
                <div className="small" style={{ marginTop: 6 }}>
                  {p.starting_price ? <div><span className="muted">From:</span> {aed(p.starting_price)}</div> : null}
                  {p.handover ? <div><span className="muted">Handover:</span> {p.handover}</div> : null}
                  {p.payment_plan ? <div><span className="muted">Payment plan:</span> {p.payment_plan}</div> : null}
                </div>
                {p.brochure_url ? <a className="btn secondary small" href={p.brochure_url} target="_blank" rel="noopener noreferrer" style={{ marginTop: 8 }}>Brochure / details</a> : null}
              </div>
            ))}
            {filtered.length === 0 ? <div className="card muted">No projects match.</div> : null}
          </div>
        </>
      ) : (
        <div className="grid grid-2">
          {developers.map((d) => (
            <div key={d.id} className="card">
              <h3 style={{ margin: 0 }}>{d.name}</h3>
              {d.about ? <p className="small" style={{ marginTop: 6 }}>{d.about}</p> : null}
              {d.website ? <a className="small" href={d.website} target="_blank" rel="noopener noreferrer">{d.website.replace(/^https?:\/\//, '')}</a> : null}
            </div>
          ))}
          {developers.length === 0 ? <div className="card muted">No developers added.</div> : null}
        </div>
      )}
    </div>
  );
}
