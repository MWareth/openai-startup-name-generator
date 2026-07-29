// How a lead came to us — the thing the source text was being made to imply.
//
// `source` stays as it is (free text: "Instagram", "Bayut", "Cold Call"…). It
// says which channel. Origin says who did the work to get it, which is what the
// cold-call contest and the marketing report actually care about, and it can't
// be broken by a typo the way an exact match on source could.
export const ORIGINS = [
  {
    id: 'campaign',
    label: 'Online campaign',
    tab: 'Campaign leads',
    icon: '🌐',
    hint: 'Came in from paid ads or social — marketing generated it.',
  },
  {
    id: 'follow_up',
    label: 'Follow-up',
    tab: 'Follow Ups',
    icon: '🔁',
    hint: 'Re-engaged from the existing database — an old enquiry, past client or dormant contact.',
  },
  {
    id: 'cold_call',
    label: 'Cold call',
    tab: 'Cold Leads',
    icon: '📞',
    hint: 'Brand-new conversation the agent started themselves.',
  },
  {
    id: 'other',
    label: 'Other',
    tab: 'Other leads',
    icon: '📋',
    hint: 'Portal subscription, referral, walk-in — anything else.',
  },
];

export const ORIGIN_IDS = ORIGINS.map((o) => o.id);
export const originMeta = (id) => ORIGINS.find((o) => o.id === id) || null;
export const originLabel = (id) => {
  const o = originMeta(id);
  return o ? `${o.icon} ${o.label}` : '—';
};

// Both of these count as the agent's own effort, so both feed the contest.
export const SELF_GENERATED = ['cold_call', 'follow_up'];

const COLD_RX = /cold\s*-?\s*call/i;
const CAMPAIGN_RX = /campaign|website|instagram|insta\b|facebook|\bfb\b|\bmeta\b|google|tiktok|snapchat|youtube/i;

// Best guess at the origin from a free-text source. Used to backfill old leads
// and to pre-select the radio on the new-lead form — never to override what a
// person actually chose.
export function deriveOrigin(source) {
  const s = String(source || '');
  if (COLD_RX.test(s)) return 'cold_call';
  if (CAMPAIGN_RX.test(s)) return 'campaign';
  return 'other';
}
