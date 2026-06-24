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

export const SENIORITY_LABELS = {
  junior: 'Junior (50/50)',
  senior: 'Senior (55/45)',
  team_leader: 'Team Leader (60/40)',
};

export const ROLE_LABELS = {
  agent: 'Agent',
  director: 'Director',
  c_suite: 'C-Suite',
  admin: 'Admin (Owner)',
};

// Agent commission split as a "you/company" string, by seniority.
export const SPLIT_LABELS = {
  junior: '50/50',
  senior: '55/45',
  team_leader: '60/40',
};

export const STATUS_LABELS = {
  new: 'New',
  active: 'Active',
  viewing: 'Viewing',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};
