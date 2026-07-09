export function aed(value) {
  const n = Number(value) || 0;
  return new Intl.NumberFormat('en-AE', {
    style: 'currency',
    currency: 'AED',
    maximumFractionDigits: 0,
  }).format(n);
}

export function pct(value) {
  const n = Math.max(0, Math.min(1, Number(value) || 0));
  return `${Math.round(n * 100)}%`;
}

export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Build a WhatsApp chat link from a phone number (strips +, spaces, etc.).
export function waLink(phone) {
  if (!phone) return null;
  const digits = String(phone).replace(/[^0-9]/g, '');
  return digits ? `https://wa.me/${digits}` : null;
}

// Today as YYYY-MM-DD (for date inputs and follow-up comparisons).
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export const ACTIVITY_LABELS = {
  meeting: 'Meeting',
  call: 'Call',
  viewing: 'Viewing',
  call_update: 'Call update',
  note: 'Note',
};

export const QUAL_LABELS = { hot: 'Hot', warm: 'Warm', cold: 'Cold' };

// Property types (used in the New Lead form and the leads filter bar).
export const PROPERTY_TYPES = [
  'Apartment',
  'Villa',
  'Townhouse',
  'Penthouse',
  'Plot / Land',
  'Office / Commercial',
  'Other',
];

// Bedroom options (structured, so they can be filtered).
export const BEDROOM_OPTIONS = [
  'Studio',
  '1 Bedroom',
  '2 Bedrooms',
  '3 Bedrooms',
  '4 Bedrooms',
  '5+ Bedrooms',
];

// The unit type actually sold, recorded on a closed deal. Combines
// type + size into one list, matching how stock is described.
export const DEAL_PROPERTY_TYPES = [
  'Studio',
  '1 Bedroom Apartment',
  '2 Bedroom Apartment',
  '3 Bedroom Apartment',
  '4 Bedroom Apartment',
  '3 Bedroom Villa',
  '4 Bedroom Villa',
  '5 Bedroom Villa',
  '6 Bedroom Villa',
  '7 Bedroom Villa',
];

// Document types attached to a deal.
export const DOC_KINDS = [
  { v: 'proof_of_payment', l: 'Proof of payment' },
  { v: 'spa', l: 'Sales & Purchase Agreement (SPA)' },
  { v: 'passport', l: 'Passport' },
  { v: 'emirates_id', l: 'Emirates ID' },
  { v: 'other', l: 'Other' },
];

export const SENIORITY_LABELS = {
  junior: 'Junior (50/50)',
  senior: 'Senior (55/45)',
  team_leader: 'Team Leader (60/40)',
};

// Plain level names without the commission split — for places visible to other
// agents (e.g. the leaderboard), where split terms must stay private.
export const SENIORITY_NAMES = {
  junior: 'Junior',
  senior: 'Senior',
  team_leader: 'Team Leader',
};

export const ROLE_LABELS = {
  agent: 'Agent',
  marketing: 'Marketing',
  director: 'Director',
  c_suite: 'C-Suite',
  support: 'Support',
  admin: 'Admin (Owner)',
};

// Commission-collection workflow statuses.
export const COMMISSION_STATUSES = [
  { v: 'pending', l: 'Pending' },
  { v: 'requested', l: 'Requested from developer' },
  { v: 'received', l: 'Received' },
];

// Agent commission split as a "you/company" string, by seniority.
export const SPLIT_LABELS = {
  junior: '50/50',
  senior: '55/45',
  team_leader: '60/40',
};

export const STATUS_LABELS = {
  new: 'New',
  active: 'Contacted',
  viewing: 'Viewing',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

// The forward sales pipeline (in order) used by the lead progress stepper.
export const LEAD_PIPELINE = [
  { status: 'new', label: 'New' },
  { status: 'active', label: 'Contacted' },
  { status: 'viewing', label: 'Viewing' },
  { status: 'negotiation', label: 'Negotiation' },
  { status: 'won', label: 'Closed' },
];
export const PIPELINE_ORDER = LEAD_PIPELINE.map((s) => s.status);
