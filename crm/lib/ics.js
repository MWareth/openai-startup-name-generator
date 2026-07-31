// Builds a calendar file (.ics) for a follow-up.
//
// A real event in the person's own calendar, not a subscribed feed: Outlook
// refuses to fire reminders on subscribed internet calendars, and a reminder
// that never buzzes is the one thing this is for. Opening the file adds the
// event to whatever calendar the device uses — Outlook, Google or Apple — and
// it then syncs to their phone with the alarm intact.

const CRLF = '\r\n';

// Commas, semicolons, backslashes and newlines are all special in ICS values.
function esc(text) {
  return String(text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

const stampUTC = (d) => new Date(d).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

// Lines over 75 octets must be folded, or strict parsers reject the file.
function fold(line) {
  if (line.length <= 74) return line;
  const out = [line.slice(0, 74)];
  let rest = line.slice(74);
  while (rest.length > 73) {
    out.push(' ' + rest.slice(0, 73));
    rest = rest.slice(73);
  }
  if (rest) out.push(' ' + rest);
  return out.join(CRLF);
}

/**
 * @param {object} o
 * @param {string} o.uid          stable id, so re-adding updates rather than duplicates
 * @param {Date}   o.start        when the call should happen
 * @param {number} o.minutes      event length
 * @param {number} o.alarmMinutes how long before to nudge
 * @param {string} o.title
 * @param {string} o.description
 * @param {string} [o.url]        deep link back to the lead
 */
export function buildFollowUpIcs({ uid, start, minutes = 30, alarmMinutes = 30, title, description, url }) {
  const end = new Date(new Date(start).getTime() + minutes * 60000);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bullish Team CRM//Follow-up//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${esc(uid)}`,
    `DTSTAMP:${stampUTC(new Date())}`,
    // Times are written in UTC (the trailing Z). Every calendar app converts to
    // the phone's own timezone, so this stays correct if someone travels.
    `DTSTART:${stampUTC(start)}`,
    `DTEND:${stampUTC(end)}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description)}`,
    url ? `URL:${esc(url)}` : null,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'BEGIN:VALARM',
    `TRIGGER:-PT${Math.max(0, Math.round(alarmMinutes))}M`,
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(title)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.map(fold).join(CRLF) + CRLF;
}

// A follow-up stores a date, and optionally an exact time. With no time, put it
// at 10:00 Dubai — an all-day event tends to nudge at midnight, which is no use
// for a call. Dubai is UTC+4 year-round, with no daylight saving to track.
export function followUpStart(dueOn, dueAt) {
  if (dueAt) return new Date(dueAt);
  return new Date(`${dueOn}T10:00:00+04:00`);
}

// A real meeting invitation, not a file to download.
//
// METHOD:REQUEST with an ORGANIZER and an ATTENDEE is what makes Outlook (and
// Gmail) treat the email as a meeting and put it on the calendar by itself.
// METHOD:CANCEL with the same UID removes it again — that's what keeps the
// calendar honest when a follow-up is done or rescheduled, instead of leaving
// dead reminders behind.
//
// SEQUENCE must increase on every update to the same UID, or calendars ignore
// the change as stale.
export function buildFollowUpInvite({
  uid,
  start,
  minutes = 30,
  alarmMinutes = 30,
  title,
  description,
  url,
  organizerEmail,
  organizerName,
  attendeeEmail,
  attendeeName,
  sequence = 0,
  method = 'REQUEST',
}) {
  const end = new Date(new Date(start).getTime() + minutes * 60000);
  const cancelling = method === 'CANCEL';
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Bullish Team CRM//Follow-up//EN',
    'CALSCALE:GREGORIAN',
    `METHOD:${method}`,
    'BEGIN:VEVENT',
    `UID:${esc(uid)}`,
    `DTSTAMP:${stampUTC(new Date())}`,
    `DTSTART:${stampUTC(start)}`,
    `DTEND:${stampUTC(end)}`,
    `SEQUENCE:${Math.max(0, Math.round(sequence))}`,
    `SUMMARY:${esc(title)}`,
    `DESCRIPTION:${esc(description)}`,
    url ? `URL:${esc(url)}` : null,
    organizerEmail
      ? `ORGANIZER;CN=${esc(organizerName || 'Bullish Team CRM')}:mailto:${esc(organizerEmail)}`
      : null,
    attendeeEmail
      ? `ATTENDEE;CN=${esc(attendeeName || attendeeEmail)};ROLE=REQ-PARTICIPANT;PARTSTAT=${
          cancelling ? 'DECLINED' : 'NEEDS-ACTION'
        };RSVP=FALSE:mailto:${esc(attendeeEmail)}`
      : null,
    `STATUS:${cancelling ? 'CANCELLED' : 'CONFIRMED'}`,
    'TRANSP:OPAQUE',
    // A cancellation carries no alarm — there's nothing left to be nudged about.
    ...(cancelling
      ? []
      : [
          'BEGIN:VALARM',
          `TRIGGER:-PT${Math.max(0, Math.round(alarmMinutes))}M`,
          'ACTION:DISPLAY',
          `DESCRIPTION:${esc(title)}`,
          'END:VALARM',
        ]),
    'END:VEVENT',
    'END:VCALENDAR',
  ].filter(Boolean);

  return lines.map(fold).join(CRLF) + CRLF;
}
