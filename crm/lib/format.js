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

export const ACTIVITY_LABELS = {
  meeting: 'Meeting',
  call: 'Call',
  viewing: 'Viewing',
  call_update: 'Call update',
  note: 'Note',
};

export const QUAL_LABELS = { hot: 'Hot', warm: 'Warm', cold: 'Cold' };

export const STATUS_LABELS = {
  new: 'New',
  active: 'Active',
  viewing: 'Viewing',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};
