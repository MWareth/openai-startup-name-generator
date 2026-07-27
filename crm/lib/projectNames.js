// Grouping helpers for the project-name cleanup tool.
//
// Agents type the same project a dozen ways ("Haven Dar", "haven dar villa",
// "Haven-Dar Villas"). These helpers reduce a name to a comparison key so the
// variants land in one group, and pick a sensible suggested master name.

// Unit-type / marketing words that don't change WHICH project is meant.
const NOISE = [
  'villa', 'villas', 'townhouse', 'townhouses', 'apartment', 'apartments',
  'apt', 'apts', 'penthouse', 'penthouses', 'plot', 'plots', 'studio',
  'studios', 'tower', 'towers', 'residence', 'residences', 'residency',
  'building', 'project', 'phase', 'by', 'the', 'at', 'dubai', 'uae',
];

// Comparison key: lowercase, strip punctuation/accents, drop noise words and
// trailing phase numbers, then sort what's left so word order doesn't matter.
export function projectKey(raw) {
  const cleaned = String(raw || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const words = cleaned
    .split(' ')
    .filter(Boolean)
    .filter((w) => !NOISE.includes(w))
    .filter((w) => !/^\d{1,2}$/.test(w)); // phase numbers: "phase 2"
  return words.sort().join(' ');
}

// Title-case a name for the suggested master ("haven dar" → "Haven Dar").
// The first word is always capitalised, so "la vera creek" → "La Vera Creek".
function titleCase(s) {
  return String(s)
    .split(/\s+/)
    .map((w, i) =>
      i === 0 || w.length > 2 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase()
    )
    .join(' ')
    .trim();
}

// Group raw names (each { name, count }) by comparison key. Returns groups
// sorted by total leads, each with a suggested master name: the shortest
// variant (the base project name), tidied to title case.
export function groupProjectNames(rows) {
  const byKey = new Map();
  for (const r of rows) {
    const name = String(r.name || '').trim();
    if (!name) continue;
    const key = projectKey(name);
    if (!key) continue;
    if (!byKey.has(key)) byKey.set(key, { key, variants: [], total: 0 });
    const g = byKey.get(key);
    g.variants.push({ name, count: r.count });
    g.total += r.count;
  }

  return [...byKey.values()]
    .map((g) => {
      const variants = g.variants.sort((a, b) => b.count - a.count || a.name.length - b.name.length);
      // Suggested master: the shortest variant (base name, no unit-type
      // suffix), title-cased. Keeps an already-tidy name exactly as typed.
      const shortest = [...variants].sort((a, b) => a.name.length - b.name.length)[0].name;
      // Keep the agent's own casing when it's already mixed-case (it may hold
      // real branding like "DAMAC"); only tidy all-lower / ALL-CAPS names.
      const messyCase = shortest === shortest.toLowerCase() || shortest === shortest.toUpperCase();
      const suggested = messyCase ? titleCase(shortest) : shortest;
      return { ...g, variants, suggested };
    })
    .sort((a, b) => b.variants.length - a.variants.length || b.total - a.total);
}
