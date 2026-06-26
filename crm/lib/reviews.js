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
