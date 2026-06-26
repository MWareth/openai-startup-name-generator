// Pulls the team's Google Sheet (published as CSV) and mirrors it into the
// projects table. The sheet is the master list; this replaces the directory
// with its current contents. Requires the sheet to be shared "Anyone with the
// link → Viewer" so the server can read it.
const SHEET_ID = '1yuO8nTSy_etFsVIGll_M3Z5wYwjNv9BWJjUTVIXVPGY';
const SHEET_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

// Minimal CSV parser that handles quoted fields, escaped quotes and newlines.
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQ = false; }
      } else field += ch;
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const nn = (s) => {
  const t = String(s ?? '').trim();
  return t === '' ? null : t;
};
const price = (s) => {
  const m = String(s ?? '').match(/([0-9][0-9,]*)/);
  return m ? Number(m[1].replace(/,/g, '')) : null;
};

export async function syncProjectsFromSheet(admin) {
  const res = await fetch(SHEET_CSV, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Google Sheet unreachable (${res.status})`);
  const text = await res.text();
  if (/<html|<!doctype/i.test(text)) {
    throw new Error('Sheet is not publicly viewable — set sharing to "Anyone with the link → Viewer".');
  }

  const rows = parseCSV(text);
  const records = [];
  for (const c of rows.slice(1)) {
    const name = nn(c[2]);
    if (!name) continue;
    records.push({
      name,
      developer: nn(c[1]),
      area: nn(c[3]),
      unit_types: nn(c[4]),
      year_launch: nn(c[5]),
      starting_price: price(c[6]),
      sqft_avg: nn(c[7]),
      down_payment: nn(c[8]),
      payment_plan: nn(c[9]),
      handover: nn(c[10]),
      brochure_url: nn(c[11]),
      virtual_tour_url: nn(c[12]),
      show_apartment: nn(c[13]),
      contact_name: nn(c[14]),
      notes: nn(c[15]),
      contact_number: nn(c[16]),
      emirate: nn(c[18]),
      status: 'Off-plan',
    });
  }

  // Mirror: clear and reload from the sheet (the sheet is the source of truth).
  await admin.from('projects').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (records.length) {
    const { error } = await admin.from('projects').insert(records);
    if (error) throw new Error(error.message);
  }
  return records.length;
}
