import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, appUrl } from '@/lib/email';
import { buildFollowUpInvite, followUpStart } from '@/lib/ics';

// Emails a follow-up to the agent as a real calendar invitation, so it lands on
// their Outlook calendar by itself. No button to press in the CRM, and — the
// part that actually matters — completing or rescheduling sends a cancellation
// for the same event, so the calendar never keeps a reminder for work already
// done.
//
// Best-effort throughout: a mail problem must never block saving a follow-up.

const SEQ_KEY = (id) => `followup-${id}@bullish-crm`;

export async function sendFollowUpInvite(followUpId, { cancel = false } = {}) {
  try {
    const admin = createAdminClient();

    const { data: f } = await admin
      .from('lead_followups')
      .select('id, due_on, due_at, note, done, lead:leads(id, name, phone, email, property_interest, assigned_agent_id)')
      .eq('id', followUpId)
      .single();
    if (!f || !f.lead) return false;

    const agentId = f.lead.assigned_agent_id;
    if (!agentId) return false; // nobody to invite

    const { data: agent } = await admin
      .from('profiles')
      .select('full_name, email')
      .eq('id', agentId)
      .single();
    if (!agent?.email) return false;

    const lead = f.lead;
    const leadUrl = appUrl(`/leads/${lead.id}`);
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
    const title = `Follow up: ${lead.name || 'lead'}`;

    // Every send for the same follow-up must carry a higher SEQUENCE or the
    // calendar treats it as stale and ignores it. Seconds since the follow-up
    // row was created is monotonic and needs no extra column.
    const sequence = Math.floor(Date.now() / 1000) % 1000000;

    const ics = buildFollowUpInvite({
      uid: SEQ_KEY(f.id),
      start,
      minutes: 30,
      alarmMinutes: 30,
      title,
      description: details,
      url: leadUrl,
      organizerEmail: process.env.SMTP_USER,
      organizerName: 'Bullish Team CRM',
      attendeeEmail: agent.email,
      attendeeName: agent.full_name,
      sequence,
      method: cancel ? 'CANCEL' : 'REQUEST',
    });

    const when = f.due_at
      ? new Date(f.due_at).toLocaleString('en-GB', { timeZone: 'Asia/Dubai', dateStyle: 'medium', timeStyle: 'short' })
      : `${f.due_on} at 10:00`;

    await sendEmail({
      to: agent.email,
      subject: cancel ? `Cancelled: ${title}` : `${title} — ${when}`,
      text: cancel
        ? `This follow-up is done, so it has been removed from your calendar.\n\n${lead.name || 'The lead'}\n${leadUrl}`
        : `${when} (Dubai)\n\n${details}`,
      icalEvent: {
        method: cancel ? 'CANCEL' : 'REQUEST',
        filename: 'invite.ics',
        content: ics,
      },
    });
    return true;
  } catch (e) {
    return false; // never let the calendar break the CRM
  }
}
