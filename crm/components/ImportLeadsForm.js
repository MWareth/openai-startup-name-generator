'use client';

import { useState } from 'react';
import Link from 'next/link';
import { previewImport, runImport } from '@/app/(app)/leads/import/actions';

// Two-step bulk import: paste (or load a CSV file) → preview what will be
// created, with duplicates flagged → confirm. Nothing is written until the
// second step, so a bad paste can never create junk leads.
export default function ImportLeadsForm({ agents }) {
  const [text, setText] = useState('');
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [agentId, setAgentId] = useState('');
  const [source, setSource] = useState('');
  const [project, setProject] = useState('');

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setText(await file.text());
    setPreview(null);
    setResult(null);
  }

  async function doPreview() {
    setBusy(true); setError(null); setResult(null);
    try {
      const fd = new FormData();
      fd.set('data', text);
      const res = await previewImport(null, fd);
      if (res.error) setError(res.error);
      else setPreview(res);
    } catch (e) {
      setError('Could not read that — check the header row is included.');
    } finally {
      setBusy(false);
    }
  }

  async function doImport() {
    if (!agentId) { setError('Choose the agent who gets these leads.'); return; }
    setBusy(true); setError(null);
    try {
      const fd = new FormData();
      fd.set('data', text);
      fd.set('agent_id', agentId);
      fd.set('source', source);
      fd.set('project', project);
      const res = await runImport(null, fd);
      if (res.error) setError(res.error);
      else { setResult(res); setPreview(null); }
    } catch (e) {
      setError('Import failed: ' + (e?.message || 'unknown error'));
    } finally {
      setBusy(false);
    }
  }

  if (result?.done) {
    return (
      <div className="card">
        <h3 style={{ marginTop: 0 }}>✅ Imported</h3>
        <p>
          <strong>{result.created}</strong> lead{result.created === 1 ? '' : 's'} created and assigned to{' '}
          <strong>{result.agent}</strong>
          {result.skipped ? <> · {result.skipped} skipped as duplicates</> : null}.
        </p>
        <div className="row" style={{ gap: 8 }}>
          <Link className="btn" href="/leads">See the leads →</Link>
          <button className="btn secondary" type="button" onClick={() => { setResult(null); setText(''); }}>
            Import another batch
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stack">
      {error ? <div className="alert error">{error}</div> : null}

      <div className="card">
        <h3 style={{ marginTop: 0 }}>1 · Paste or upload</h3>
        <p className="small muted" style={{ marginTop: 0 }}>
          Export from your other system as CSV, or select the rows in the browser/Excel and copy-paste them
          here. <strong>Include the header row</strong> — that&apos;s how the columns are recognised.
        </p>
        <textarea
          rows={8}
          value={text}
          onChange={(e) => { setText(e.target.value); setPreview(null); }}
          placeholder={'First Name\tLast Name\tMobile\tEmail\tProject\tSource\nAhmed\tKhan\t+971501234567\ta@b.com\tHaven By Aldar\tOnline Campaign'}
          style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.82rem' }}
        />
        <div className="row" style={{ gap: 10, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <input type="file" accept=".csv,.tsv,.txt" onChange={onFile} className="small" />
          <button className="btn" type="button" onClick={doPreview} disabled={busy || !text.trim()}>
            {busy ? 'Reading…' : 'Preview →'}
          </button>
        </div>
      </div>

      {preview ? (
        <>
          <div className="card">
            <h3 style={{ marginTop: 0 }}>2 · Check</h3>
            <p style={{ margin: '0 0 8px' }}>
              <strong style={{ color: 'var(--good, #16a34a)' }}>{preview.newCount} new</strong>
              {preview.dupeCount ? <> · <strong style={{ color: 'var(--amber, #d97706)' }}>{preview.dupeCount} duplicate{preview.dupeCount === 1 ? '' : 's'}</strong> (will be skipped)</> : null}
            </p>
            {preview.unmapped?.length ? (
              <p className="small muted" style={{ marginTop: 0 }}>
                Columns ignored (no matching field): {preview.unmapped.join(', ')}
              </p>
            ) : null}
            <div style={{ maxHeight: 340, overflow: 'auto' }}>
              <table>
                <thead>
                  <tr><th></th><th>Name</th><th>Phone</th><th>Email</th><th>Project</th><th>Type</th><th>Source</th></tr>
                </thead>
                <tbody>
                  {preview.rows.map((r, i) => (
                    <tr key={i} style={{ opacity: r.dupe ? 0.5 : 1 }}>
                      <td className="small">{r.dupe ? '⚠️' : '✅'}</td>
                      <td className="small">{r.name}</td>
                      <td className="small">{r.phone || <span className="muted">—</span>}</td>
                      <td className="small">{r.email || <span className="muted">—</span>}</td>
                      <td className="small">{r.property_interest || <span className="muted">—</span>}</td>
                      <td className="small">{r.property_type || <span className="muted">—</span>}</td>
                      <td className="small">{r.dupe ? <span className="muted">skipped · {r.dupe}</span> : (r.source || <span className="muted">—</span>)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>3 · Assign &amp; import</h3>
            <div className="row" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <label className="small muted" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                Give all of these to
                <select value={agentId} onChange={(e) => setAgentId(e.target.value)} required>
                  <option value="">Pick agent…</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.full_name}</option>
                  ))}
                </select>
              </label>
              <label className="small muted" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                Force source (optional)
                <input value={source} onChange={(e) => setSource(e.target.value)} placeholder="e.g. Online Campaign" />
              </label>
              <label className="small muted" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                Force project (optional)
                <input value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Haven By Aldar" />
              </label>
              <button className="btn" type="button" onClick={doImport} disabled={busy}>
                {busy ? 'Importing…' : `Import ${preview.newCount} lead${preview.newCount === 1 ? '' : 's'}`}
              </button>
            </div>
            <p className="small muted" style={{ marginBottom: 0 }}>
              They arrive as <strong>New</strong>, warm, with the response clock started. Any stage/notes column
              from your file is kept as the lead&apos;s first note.
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
