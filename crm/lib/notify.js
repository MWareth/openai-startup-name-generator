import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, notificationEmail } from '@/lib/email';

// Create an in-app notification for one recipient, and (unless email:false) also
// email them. Inserts via the service-role client so it works regardless of who
// triggered it (RLS only governs reads). Fails silently (e.g. before migration
// 0013, or if email isn't configured) so it never blocks the action.
export async function notify({ userId, type = 'lead_assigned', title, body, link, leadId, email = true, cta }) {
  if (!userId || !title) return;
  const admin = createAdminClient();
  try {
    await admin.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body: body || null,
      link: link || null,
      lead_id: leadId || null,
    });
  } catch (e) {
    // no-op — in-app insert failed (e.g. before migration 0013)
  }
  if (email) {
    try {
      const { data: recipient } = await admin
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      if (recipient?.email) {
        const { html, text } = notificationEmail({ title, body, link, cta });
        await sendEmail({ to: recipient.email, subject: title, html, text });
      }
    } catch (e) {
      // no-op — never let email break the triggering action
    }
  }
}

// Notify everyone in management (admin / director / c-suite), optionally
// excluding the actor.
export async function notifyManagement({ exceptUserId, ...payload }) {
  try {
    const admin = createAdminClient();
    const { data: mgrs } = await admin
      .from('profiles')
      .select('id')
      .in('role', ['admin', 'director', 'c_suite']);
    const rows = (mgrs || [])
      .map((m) => m.id)
      .filter((id) => id && id !== exceptUserId)
      .map((id) => ({
        user_id: id,
        type: payload.type || 'info',
        title: payload.title,
        body: payload.body || null,
        link: payload.link || null,
        lead_id: payload.leadId || null,
      }));
    if (rows.length) await admin.from('notifications').insert(rows);
  } catch (e) {
    // no-op
  }
}
