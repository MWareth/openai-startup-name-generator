import { requireUser } from '@/lib/auth';
import { buildFollowUpIcs, followUpStart } from '@/lib/ics';
import { googleCalendarUrl, outlookCalendarUrl } from '@/lib/calendarLinks';

export const dynamic = 'force-dynamic';

// One follow-up as a calendar event. ?to=google / ?to=outlook redirect to a
// pre-filled event in that web calendar (one tap to save, nothing downloaded);
// with no ?to it returns the .ics file, which is the only form that carries a
// guaranteed reminder. Read through the caller's own client, so RLS decides
// whether they may see this lead — an agent can't pull someone else's
// follow-up by guessing an id.
export async function GET(request, { params }) {
  const { supabase } = await requireUser();
  const id = params?.id;

  const { data: f, error } = await supabase
    .from('lead_followups')
    .select('id, due_on, due_at, note, lead:leads(id, name, phone, email, property_interest)')
    .eq('id', id)
    .single();

  if (error || !f) {
    return new Response('Follow-up not found.', { status: 404 });
  }

  // ?alarm=60 to be nudged an hour ahead instead of the default 30 minutes.
  const url = new URL(request.url);
  const alarmParam = Number(url.searchParams.get('alarm'));
  const alarmMinutes = Number.isFinite(alarmParam) && alarmParam >= 0 && alarmParam <= 1440 ? alarmParam : 30;

  const lead = f.lead || {};
  const origin = `${url.protocol}//${url.host}`;
  const leadUrl = lead.id ? `${origin}/leads/${lead.id}` : origin;

  const details = [
    lead.phone ? `Phone: ${lead.phone}` : null,
    lead.email ? `Email: ${lead.email}` : null,
    lead.property_interest ? `Interested in: ${lead.property_interest}` : null,
    f.note ? `Note: ${f.note}` : null,
    '',
    `Open the lead: ${leadUrl}`,
  ]
    .filter((l) => l !== null)
    .join('\n');

  const start = followUpStart(f.due_on, f.due_at);
  const end = new Date(start.getTime() + 30 * 60000);
  const title = `Follow up: ${lead.name || 'lead'}`;

  // Hand off to a web calendar instead of downloading a file.
  const to = (url.searchParams.get('to') || '').toLowerCase();
  if (to === 'google' || to === 'outlook') {
    const target = to === 'google'
      ? googleCalendarUrl({ start, end, title, description: details })
      : outlookCalendarUrl({ start, end, title, description: details });
    return Response.redirect(target, 302);
  }

  const body = buildFollowUpIcs({
    // Stable per follow-up, so adding it twice updates the event instead of
    // leaving two copies in the calendar.
    uid: `followup-${f.id}@bullish-crm`,
    start,
    minutes: 30,
    alarmMinutes,
    title,
    description: details,
    url: leadUrl,
  });

  const safeName = String(lead.name || 'lead').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();

  return new Response(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="follow-up-${safeName || 'lead'}.ics"`,
      'Cache-Control': 'no-store',
    },
  });
}
