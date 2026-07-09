#!/usr/bin/env node
/*
 * Bulk-import areas (and optionally buildings) into the CRM from a Dubai Land
 * Department / Dubai Pulse CSV export.
 *
 * Usage (run from the crm/ folder):
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     node scripts/import_dld_areas.mjs path/to/dld_areas.csv
 *
 * Options:
 *   --area-col=NAME       CSV column holding the area/community name
 *   --building-col=NAME   CSV column holding the building/tower name (optional)
 *
 * If the column names aren't given, the script tries common DLD headers
 * (area_name_en, AREA_EN, community, project_name_en, building_name_en, ...).
 *
 * The service-role key bypasses RLS, so run this from a trusted machine only.
 */
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const opt = (name) => {
  const m = args.find((a) => a.startsWith(`--${name}=`));
  return m ? m.split('=').slice(1).join('=') : null;
};
if (!file) {
  console.error('Pass the path to a CSV file.');
  process.exit(1);
}

const AREA_CANDIDATES = ['area_name_en', 'area_en', 'area', 'community', 'community_en', 'master_community'];
const BUILDING_CANDIDATES = ['building_name_en', 'building_en', 'building', 'project_name_en', 'project_en', 'tower'];

// Minimal CSV parser (handles quoted fields and commas/newlines inside quotes).
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c === '\r') { /* skip */ }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

const text = readFileSync(file, 'utf8');
const rows = parseCSV(text).filter((r) => r.some((c) => c.trim() !== ''));
if (!rows.length) { console.error('Empty CSV.'); process.exit(1); }

const header = rows[0].map((h) => h.trim().toLowerCase());
const pick = (explicit, candidates) => {
  if (explicit) {
    const i = header.indexOf(explicit.toLowerCase());
    if (i === -1) { console.error(`Column "${explicit}" not found. Headers: ${header.join(', ')}`); process.exit(1); }
    return i;
  }
  for (const cand of candidates) { const i = header.indexOf(cand); if (i !== -1) return i; }
  return -1;
};

const areaIdx = pick(opt('area-col'), AREA_CANDIDATES);
const buildingIdx = pick(opt('building-col'), BUILDING_CANDIDATES);
if (areaIdx === -1) {
  console.error(`Could not find an area column. Use --area-col=... . Headers: ${header.join(', ')}`);
  process.exit(1);
}
console.log(`Area column: "${header[areaIdx]}"${buildingIdx !== -1 ? `, building column: "${header[buildingIdx]}"` : ''}`);

const areaSet = new Set();
const buildingPairs = []; // { area, name }
for (const r of rows.slice(1)) {
  const area = (r[areaIdx] || '').trim();
  if (area) areaSet.add(area);
  if (buildingIdx !== -1) {
    const b = (r[buildingIdx] || '').trim();
    if (b) buildingPairs.push({ area, name: b });
  }
}

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function chunked(items, size, fn) {
  for (let i = 0; i < items.length; i += size) {
    await fn(items.slice(i, i + size));
    process.stdout.write(`\r  ${Math.min(i + size, items.length)}/${items.length}`);
  }
  process.stdout.write('\n');
}

console.log(`Importing ${areaSet.size} areas...`);
const areaList = [...areaSet].map((name) => ({ name }));
await chunked(areaList, 500, async (batch) => {
  const { error } = await supabase.from('areas').upsert(batch, { onConflict: 'name', ignoreDuplicates: true });
  if (error) throw error;
});

// Map area name -> id for building inserts.
const { data: areaRows } = await supabase.from('areas').select('id, name');
const areaIdByName = new Map((areaRows || []).map((a) => [a.name, a.id]));

if (buildingPairs.length) {
  // De-dupe by area+name.
  const seen = new Set();
  const buildings = [];
  for (const { area, name } of buildingPairs) {
    const k = `${area}|||${name}`;
    if (seen.has(k)) continue;
    seen.add(k);
    buildings.push({ name, area_id: areaIdByName.get(area) || null });
  }
  console.log(`Importing ${buildings.length} buildings...`);
  await chunked(buildings, 500, async (batch) => {
    const { error } = await supabase.from('buildings').upsert(batch, { onConflict: 'area_id,name', ignoreDuplicates: true });
    if (error) throw error;
  });
}

console.log('Done. ✅');
