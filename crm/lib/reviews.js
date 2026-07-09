// Criteria management rates each agent on (1–5 stars each). The overall score
// is the average across the criteria that were given a rating.
export const REVIEW_CRITERIA = [
  { key: 'follow_up', label: 'Lead follow-up & responsiveness' },
  { key: 'closing', label: 'Closing & negotiation' },
  { key: 'communication', label: 'Communication & reporting' },
  { key: 'goals', label: 'Goal & target achievement' },
  { key: 'teamwork', label: 'Teamwork & attitude' },
  { key: 'professionalism', label: 'Professionalism & compliance' },
];

export const CRITERION_LABEL = Object.fromEntries(REVIEW_CRITERIA.map((c) => [c.key, c.label]));

// The five KPI categories, in display order. Criteria carry one of these in
// their `category` column; anything else is grouped under "Other".
export const KPI_CATEGORIES = [
  'Conduct & Attitude',
  'Activity & Effort',
  'Content & Personal Brand',
  'Knowledge & Skill',
  'Results & Pipeline',
];

// Order criteria by their category (then sort_order), grouped for display.
export function groupByCategory(criteria) {
  const groups = new Map();
  for (const cat of KPI_CATEGORIES) groups.set(cat, []);
  for (const c of criteria || []) {
    const cat = KPI_CATEGORIES.includes(c.category) ? c.category : 'Other';
    if (!groups.has(cat)) groups.set(cat, []);
    groups.get(cat).push(c);
  }
  return [...groups.entries()].filter(([, items]) => items.length).map(([category, items]) => ({ category, items }));
}

// Overall score out of 100 with EQUAL WEIGHT PER CATEGORY. Each category that
// has at least one rated criterion contributes (its mean stars / 5) equally;
// categories with only N/A (no rating) are excluded, so early juniors aren't
// penalised. `scores` items are { category, stars } with stars 1–5.
export function scoreOutOf100(scores) {
  const byCat = {};
  for (const s of scores || []) {
    const n = Number(s.stars);
    if (!(n >= 1)) continue;
    const cat = s.category || 'Other';
    (byCat[cat] ||= []).push(n);
  }
  const cats = Object.keys(byCat);
  if (!cats.length) return 0;
  let sum = 0;
  for (const cat of cats) {
    const arr = byCat[cat];
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length; // 1–5
    sum += (mean / 5) * 100;
  }
  return Math.round(sum / cats.length);
}

// A colour token for a 0–100 score (green ≥80, amber ≥55, red below).
export function scoreColor(score) {
  const n = Number(score) || 0;
  if (n >= 80) return 'var(--green)';
  if (n >= 55) return 'var(--gold)';
  return 'var(--red)';
}

export function averageStars(values) {
  const nums = (values || []).map(Number).filter((n) => n > 0);
  if (!nums.length) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

// A row of filled/empty stars for a 0–5 average (rounded to nearest whole star).
export function starString(avg) {
  const full = Math.max(0, Math.min(5, Math.round(Number(avg) || 0)));
  return '★★★★★'.slice(0, full) + '☆☆☆☆☆'.slice(0, 5 - full);
}

// Suggested star rating from an agent's target progress (0–1 fraction).
// 90%+ = 5★, 75%+ = 4★, 50%+ = 3★, 25%+ = 2★, >0 = 1★, none = no suggestion.
export function starsFromTargetFraction(frac) {
  const f = Number(frac);
  if (!(f > 0)) return null;
  if (f >= 0.9) return 5;
  if (f >= 0.75) return 4;
  if (f >= 0.5) return 3;
  if (f >= 0.25) return 2;
  return 1;
}
