'use client';

import { useState } from 'react';
import { PROPERTY_TYPES, BEDROOM_OPTIONS } from '@/lib/format';
import SubmitButton from '@/components/SubmitButton';
import { createLead } from '@/app/(app)/leads/actions';

// Turn a pasted blob (WhatsApp / email / portal enquiry) into lead fields.
function parseLead(text) {
  const out = { name: '', phone: '', email: '', source: '', community: '', project: '', bedrooms: '', budget: '', note: '', agent: '' };
  const lines = String(text || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const extras = [];
  const leftovers = [];

  const labels = [
    [/^name\s*[:\-]\s*/i, 'name'],
    [/^(?:phone(?:\s*no)?|mobile|contact|tel|number)\s*[:\-]\s*/i, 'phone'],
    [/^(?:e-?mail)\s*[:\-]\s*/i, 'email'],
    [/^(?:bedrooms?|beds?|br)\s*[:\-]\s*/i, 'bedrooms'],
    [/^(?:source|lead source)\s*[:\-]\s*/i, 'source'],
    [/^(?:community|area|location)\s*[:\-]\s*/i, 'community'],
    [/^(?:project|building|development|tower|unit)\s*[:\-]\s*/i, 'project'],
    [/^(?:budget|price)\s*[:\-]\s*/i, 'budget'],
    [/^(?:lead notes?|notes?|remarks?|comments?|message)\s*[:\-]\s*/i, 'note'],
  ];

  for (const line of lines) {
    const forMatch = line.match(/^(?:add\s+lead\s+for|assign(?:ed)?\s+to|agent)\s*[:\-]?\s*(.+)$/i);
    if (forMatch) { out.agent = forMatch[1].trim(); continue; }

    let done = false;
    for (const [re, key] of labels) {
      if (re.test(line)) { out[key] = line.replace(re, '').trim(); done = true; break; }
    }
    if (done) continue;

    const client = line.match(/^client\s*[:\-]\s*(.+)$/i);
    if (client) { extras.push('Client: ' + client[1].trim()); continue; }
    const received = line.match(/^received\s*[:\-]\s*(.+)$/i);
    if (received) { extras.push('Received: ' + received[1].trim()); continue; }

    if (!out.source && /register interest|walk[- ]?in|referral|instagram|whats\s?app|portal|website|bayut|dubizzle|property\s?finder|cold call/i.test(line)) {
      out.source = line; continue;
    }
    if (!out.email && /\S+@\S+\.\S+/.test(line)) { out.email = line.match(/\S+@\S+\.\S+/)[0]; continue; }
    if (!out.phone && /(\+?\d[\d\s\-]{6,}\d)/.test(line)) { out.phone = line.match(/(\+?\d[\d\s\-]{6,}\d)/)[1].trim(); continue; }
    leftovers.push(line);
  }

  // First leftover line is usually the project/development name (e.g. "South square").
  if (!out.project && leftovers.length) out.project = leftovers.shift();
  if (!out.community && leftovers.length) out.community = leftovers.shift();

  // Fold client/received context into the note so nothing is lost.
  const noteParts = [];
  if (out.note) noteParts.push(out.note);
  if (extras.length) noteParts.push(extras.join(' · '));
  out.note = noteParts.join(' · ');
  out.budget = (out.budget.match(/[\d,]+/) || [''])[0].replace(/,/g, '');
  return out;
}

export default function PasteLeadForm({ agents = [], isStaff = false }) {
  const [raw, setRaw] = useState('');
  const [f, setF] = useState({
    name: '', phone: '', email: '', source: '', community: '', project: '',
    bedrooms: '', property_type: '', budget: '', qualification: 'hot', status: 'new',
    assigned_agent_id: '', note: '',
  });
  const [agentWarn, setAgentWarn] = useState('');

  function set(k, v) { setF((s) => ({ ...s, [k]: v })); }

  function handleParse() {
    const p = parseLead(raw);
    let assigned = '';
    let warn = '';
    if (p.agent && isStaff) {
      const match = agents.find((a) => a.full_name && a.full_name.toLowerCase().includes(p.agent.toLowerCase()));
      if (match) assigned = match.id;
      else warn = `Couldn't match "${p.agent}" to an agent — pick one below.`;
    }
    setAgentWarn(warn);
    setF((s) => ({
      ...s,
      name: p.name || s.name,
      phone: p.phone || s.phone,
      email: p.email || s.email,
      source: p.source || s.source,
      community: p.community || s.community,
      project: p.project || s.project,
      bedrooms: p.bedrooms || s.bedrooms,
      budget: p.budget || s.budget,
      note: p.note || s.note,
      assigned_agent_id: assigned || s.assigned_agent_id,
    }));
  }

  return (
    <div className="stack">
      <div className="card">
        <label htmlFor="raw">Paste the enquiry</label>
        <textarea
          id="raw"
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          rows={8}
          placeholder={'Paste anything, e.g.\n\nAdd lead for Danish\nRegister Interest\nSouth Square\nName: Retheesh Kumar\nPhone: +971505844034\nEmail: retheeshk@me.com\nBedroom: 2 Bedrooms\nLead Notes: Today 3 pm is okay'}
        />
        <button type="button" className="btn" onClick={handleParse} style={{ marginTop: 10 }}>
          ↳ Read &amp; fill the form
        </button>
        <p className="small muted" style={{ marginTop: 6 }}>Then review below and Save. Nothing is created until you hit Save.</p>
      </div>

      <form action={createLead} className="card">
        {isStaff ? (
          <div className="field">
            <label>Assign to</label>
            <select value={f.assigned_agent_id} onChange={(e) => set('assigned_agent_id', e.target.value)} name="assigned_agent_id">
              <option value="">— Me / unassigned —</option>
              {agents.map((a) => <option key={a.id} value={a.id}>{a.full_name}</option>)}
            </select>
            {agentWarn ? <p className="small" style={{ color: 'var(--amber)' }}>{agentWarn}</p> : null}
          </div>
        ) : null}

        <div className="field">
          <label>Full name *</label>
          <input name="name" value={f.name} onChange={(e) => set('name', e.target.value)} required />
        </div>
        <div className="form-grid">
          <div className="field"><label>Phone</label><input name="phone" value={f.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          <div className="field"><label>Email</label><input name="email" type="email" value={f.email} onChange={(e) => set('email', e.target.value)} /></div>
        </div>
        <div className="form-grid">
          <div className="field"><label>Source</label><input name="source" value={f.source} onChange={(e) => set('source', e.target.value)} /></div>
          <div className="field"><label>Budget (AED)</label><input name="budget" type="text" inputMode="numeric" value={f.budget ? Number(f.budget).toLocaleString('en-US') : ''} onChange={(e) => set('budget', e.target.value.replace(/[^0-9.]/g, ''))} /></div>
        </div>
        <div className="form-grid">
          <div className="field"><label>Community / area</label><input name="community" value={f.community} onChange={(e) => set('community', e.target.value)} /></div>
          <div className="field"><label>Building / project</label><input name="property_interest" value={f.project} onChange={(e) => set('project', e.target.value)} /></div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Bedrooms</label>
            <input name="bedrooms" list="bed-opts" value={f.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
            <datalist id="bed-opts">{BEDROOM_OPTIONS.map((b) => <option key={b} value={b} />)}</datalist>
          </div>
          <div className="field">
            <label>Property type</label>
            <select name="property_type" value={f.property_type} onChange={(e) => set('property_type', e.target.value)}>
              <option value="">— Select —</option>
              {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>Qualification</label>
            <select name="qualification" value={f.qualification} onChange={(e) => set('qualification', e.target.value)}>
              <option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option>
            </select>
          </div>
          <div className="field">
            <label>Status</label>
            <select name="status" value={f.status} onChange={(e) => set('status', e.target.value)}>
              <option value="new">New</option><option value="active">Active</option><option value="viewing">Viewing</option><option value="negotiation">Negotiation</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label>Opening note (added to the timeline)</label>
          <textarea name="initial_note" value={f.note} onChange={(e) => set('note', e.target.value)} rows={2} />
        </div>
        <SubmitButton className="btn" pendingLabel="Creating…">Create lead</SubmitButton>
      </form>
    </div>
  );
}
