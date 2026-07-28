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

// Strip the junk that portals and agents wrap around a project name, keeping
// the name itself:
//   "Property Type: Samana Greenfield"              \u2192 "Samana Greenfield"
//   "Nad Al Sheba (Apartment)"                      \u2192 "Nad Al Sheba"
//   "Sobha Central, Sheikh Zayed Road (Apartment)"  \u2192 "Sobha Central"
// The part before the first comma is the project; what follows is the address.
export function tidyProjectName(raw) {
  return String(raw || '')
    .replace(/^\s*(property\s*type|type|project|building|development)\s*[:\-]\s*/i, '')
    .replace(/\([^)]*\)/g, ' ')       // parenthetical qualifiers
    .split(',')[0]                     // drop the address tail
    .replace(/\s+/g, ' ')
    .trim();
}

// Comparison key: lowercase, strip punctuation/accents, drop noise words and
// trailing phase numbers, then sort what's left so word order doesn't matter.
export function projectKey(raw) {
  const cleaned = tidyProjectName(raw)
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

// Same cleanup but keeping the words in order. Typo detection has to compare
// these — the sorted key would make "Sobha Selis" and "Sobha Solis" look far
// apart just because the alphabetical order flips.
export function projectFlat(raw) {
  const cleaned = tidyProjectName(raw)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned
    .split(' ')
    .filter(Boolean)
    .filter((w) => !NOISE.includes(w))
    .filter((w) => !/^\d{1,2}$/.test(w))
    .join(' ');
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

// Edit distance, capped — we only care whether it's within a small threshold.
function editDistance(a, b) {
  if (Math.abs(a.length - b.length) > 2) return 99;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(
        prev[j] + 1,
        cur[j - 1] + 1,
        prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    prev = cur;
  }
  return prev[b.length];
}

// Are two keys near-identical — a likely misspelling (Lyvia / Livia) rather
// than two different projects? Deliberately tight: one wrong letter on short
// names, two on long ones. "damac islands" vs "damac lagoons" stays apart.
function isLikelyTypo(a, b) {
  const limit = a.length >= 12 && b.length >= 12 ? 2 : 1;
  return editDistance(a, b) <= limit;
}

// Is one name wholly contained in the other, on a word boundary?
// "nad al sheba" ⊂ "nad al sheba gardens", "south square" ⊂ "south square dubai
// south". That usually means the same project with an extra qualifier — but it
// can also be two real projects ("Sobha Central" vs "Sobha Central Park"), so
// these are only ever SUGGESTED, never merged without the user confirming.
function isContained(a, b) {
  if (!a || !b || a === b) return false;
  const [short, long] = a.length <= b.length ? [a, b] : [b, a];
  if (short.split(' ').length < 2) return false; // one-word names are too loose
  return long === short || long.startsWith(short + ' ') || long.endsWith(' ' + short) || long.includes(' ' + short + ' ');
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
    if (!byKey.has(key)) byKey.set(key, { key, flat: projectFlat(name), variants: [], total: 0 });
    const g = byKey.get(key);
    g.variants.push({ name, count: r.count });
    g.total += r.count;
  }

  // Second pass: fold near-identical keys together (misspellings). The bigger
  // group keeps its key, so the majority spelling wins the suggestion.
  const merged = [...byKey.values()].sort((a, b) => b.total - a.total);
  const kept = [];
  for (const g of merged) {
    const typoHost = kept.find((k) => isLikelyTypo(k.flat, g.flat));
    if (typoHost) {
      typoHost.variants.push(...g.variants);
      typoHost.total += g.total;
      typoHost.hasTypo = true;
      continue;
    }
    const nearHost = kept.find((k) => isContained(k.flat, g.flat));
    if (nearHost) {
      nearHost.variants.push(...g.variants);
      nearHost.total += g.total;
      nearHost.needsConfirm = true;
      // Keep the shorter name as the group's identity — it's the base project.
      if (g.flat.length < nearHost.flat.length) nearHost.flat = g.flat;
      continue;
    }
    kept.push(g);
  }

  return kept
    .map((g) => {
      const variants = g.variants.sort((a, b) => b.count - a.count || a.name.length - b.name.length);
      // Suggested master: the shortest variant (base name, no unit-type
      // suffix), title-cased. Keeps an already-tidy name exactly as typed.
      // Base the suggestion on the shortest variant with its wrapper junk
      // removed ("Property Type: X (Apartment)" → "X"). For a contained match
      // ("Nad Al Sheba" inside "Nad Al Sheba Gardens") the longer name is
      // usually the real project and the short one is the area, so there we go
      // with whichever spelling the team actually used most.
      const shortest = tidyProjectName(
        g.needsConfirm
          ? variants[0].name
          : [...variants].sort((a, b) => tidyProjectName(a.name).length - tidyProjectName(b.name).length)[0].name
      );
      // Keep the agent's own casing when it's already mixed-case (it may hold
      // real branding like "DAMAC"); only tidy all-lower / ALL-CAPS names.
      const messyCase = shortest === shortest.toLowerCase() || shortest === shortest.toUpperCase();
      const suggested = messyCase ? titleCase(shortest) : shortest;
      // A single-variant group still needs attention if its stored name carries
      // junk ("Property Type: …") — that's a rename, not a merge.
      const needsTidy = variants.length === 1 && variants[0].name !== suggested;
      return { ...g, variants, suggested, needsTidy };
    })
    .sort((a, b) => b.variants.length - a.variants.length || b.total - a.total);
}
