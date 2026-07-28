// Parser for the bulk lead import: takes a CSV file or a table copy-pasted
// from a portal / Excel (tab-separated) and maps the columns onto lead fields.
// Column names vary between systems, so headers are matched loosely.

// Split one delimited line, honouring "quoted, values".
function splitLine(line, delim) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
      else quoted = !quoted;
    } else if (c === delim && !quoted) {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

// Header aliases → our field names. First match wins.
const FIELDS = [
  ['first_name', /^(first[\s_-]?name|firstname|given[\s_-]?name)$/i],
  ['last_name', /^(last[\s_-]?name|lastname|surname|family[\s_-]?name)$/i],
  ['name', /^(full[\s_-]?name|client[\s_-]?name|lead[\s_-]?name|name|client|contact)$/i],
  ['phone', /^(phone|mobile|mobile[\s_-]?no|phone[\s_-]?number|contact[\s_-]?no|tel|telephone|number)$/i],
  ['email', /^(e-?mail|email[\s_-]?address)$/i],
  ['source', /^(source|lead[\s_-]?source|channel|platform|campaign)$/i],
  ['property_interest', /^(project|property|building|development|tower|interest|property[\s_-]?interest|unit)$/i],
  ['community', /^(community|area|location|district|neighbou?rhood|sub[\s_-]?community)$/i],
  ['property_type', /^(property[\s_-]?type|type|unit[\s_-]?type)$/i],
  ['bedrooms', /^(bedrooms?|beds?|br|bhk)$/i],
  ['budget', /^(budget|price|amount|value)$/i],
  ['note', /^(notes?|remarks?|comments?|message|enquiry|description|stage|status|lead[\s_-]?stage)$/i],
];

// Property types we recognise, mapped to the CRM's own labels.
const TYPE_MAP = {
  villa: 'Villa', villas: 'Villa',
  apartment: 'Apartment', apartments: 'Apartment', flat: 'Apartment',
  townhouse: 'Townhouse', townhouses: 'Townhouse',
  penthouse: 'Penthouse', plot: 'Plot', land: 'Plot', office: 'Office',
};

// Keep only digits and a leading +, so "+971 50 123 4567" → "+971501234567".
export function normalisePhone(raw) {
  const s = String(raw || '').trim();
  if (!s) return '';
  // A date that landed in the phone column (03-02-2026) is not a phone.
  if (/^\d{1,4}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(s)) return '';
  const plus = s.startsWith('+') || /^00/.test(s);
  const digits = s.replace(/\D/g, '').replace(/^00/, '');
  // Under 7 digits isn't a phone number — usually a date or an ID that landed
  // in the wrong column. Better blank than wrong.
  if (digits.length < 7) return '';
  return (plus ? '+' : '') + digits;
}

function parseBudget(raw) {
  const digits = String(raw || '').replace(/[^0-9.]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
}

// Parse pasted text (CSV or tab-separated) into { columns, rows, unmapped }.
// Rows come back as objects using our field names, plus `_raw` for the preview.
export function parseLeadTable(text) {
  const lines = String(text || '').split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { rows: [], columns: [], unmapped: [], error: 'Paste the header row plus at least one lead.' };

  // Tabs win when present (an Excel/table paste); otherwise assume CSV.
  const delim = lines[0].includes('\t') ? '\t' : ',';
  const headers = splitLine(lines[0], delim);

  const mapping = headers.map((h) => {
    const clean = h.replace(/^"|"$/g, '').trim();
    const hit = FIELDS.find(([, re]) => re.test(clean));
    return { header: clean, field: hit ? hit[0] : null };
  });
  const unmapped = mapping.filter((m) => !m.field && m.header).map((m) => m.header);

  const rows = [];
  for (const line of lines.slice(1)) {
    const cells = splitLine(line, delim);
    if (!cells.some((c) => c)) continue;
    const rec = {};
    mapping.forEach((m, i) => {
      if (!m.field) return;
      const val = (cells[i] || '').replace(/^"|"$/g, '').trim();
      if (!val) return;
      // Portals have a bare "Type" column (Buyer/Tenant) AND a "Property Type"
      // one (Villa). Ignore anything that isn't a real property type, so the
      // right column still wins whichever order they appear in.
      if (m.field === 'property_type' && !TYPE_MAP[val.toLowerCase()]) return;
      // A sheet with both first/last and a full name column: don't clobber.
      if (rec[m.field] && m.field !== 'note') return;
      rec[m.field] = rec[m.field] && m.field === 'note' ? `${rec[m.field]} · ${val}` : val;
    });

    const name = [rec.first_name, rec.last_name].filter(Boolean).join(' ').trim() || rec.name || '';
    if (!name) continue; // a lead with no name is not a lead

    // Only accept a value that really is a property type — portals also have a
    // "Type" column holding Buyer/Tenant, which must not land here.
    const typeRaw = String(rec.property_type || '').toLowerCase().trim();
    const propertyType = TYPE_MAP[typeRaw] || '';
    rows.push({
      name,
      phone: normalisePhone(rec.phone),
      email: (rec.email || '').toLowerCase(),
      source: rec.source || '',
      property_interest: rec.property_interest || '',
      community: rec.community || '',
      property_type: propertyType,
      bedrooms: rec.bedrooms || '',
      budget: parseBudget(rec.budget),
      note: rec.note || '',
    });
  }

  return { rows, columns: mapping, unmapped };
}
