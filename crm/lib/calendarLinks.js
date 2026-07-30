// Deep links that open a pre-filled event in a web calendar, so the person taps
// Save instead of downloading a file and finding an app to open it with.
//
// The trade-off against the .ics file: these URLs cannot carry a reminder. The
// event lands with whatever default notification that calendar is set to
// (Google's is usually 30 minutes, which is what we'd have asked for anyway).
// The .ics is the only route that guarantees the alarm, so it stays available.

const compact = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

export function googleCalendarUrl({ start, end, title, description, location }) {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Follow-up',
    dates: `${compact(start)}/${compact(end)}`,
    details: description || '',
  });
  if (location) p.set('location', location);
  // Google wants a literal slash between the two timestamps; URLSearchParams
  // percent-encodes it, and not every entry point decodes that back.
  return `https://calendar.google.com/calendar/render?${p.toString().replace('%2F', '/')}`;
}

// Works for both work/school (office.com) and personal (live.com) accounts —
// Microsoft redirects between them on sign-in.
export function outlookCalendarUrl({ start, end, title, description, location }) {
  const p = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: title || 'Follow-up',
    startdt: new Date(start).toISOString(),
    enddt: new Date(end).toISOString(),
    body: description || '',
  });
  if (location) p.set('location', location);
  return `https://outlook.office.com/calendar/0/deeplink/compose?${p.toString()}`;
}
