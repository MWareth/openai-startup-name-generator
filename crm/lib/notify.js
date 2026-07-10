import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail, notificationEmail } from '@/lib/email';
import { sendPushToUser } from '@/lib/push';

// Notification types that represent OUTSTANDING WORK — they keep the bell lit
// even after the user has seen them, and only clear once the work is done
// (agent acts on the lead / completes the test). Everything else is
// informational and clears the moment the notifications page is opened.
export const ACTION_TYPES = ['lead_assigned', 'lead_sla', 'update_leads', 'deal_docs', 'test_assigned'];

// Insert notification rows, tolerating columns a database hasn't migrated yet
// (e.g. requires_action / resolved_at before 0026). On a "column not found"
// error we drop that key from every row and retry, so notifications still work.
async function insertNotifications(admin, rows) {
  let payload = rows;
  let res = await admin.from('notifications').insert(payload);
  let guard = 0;
  while (res && res.error && guard < 6) {
    const msg = res.error.message || '';
    const m = /'([\w]+)' column|column '([\w]+)'|column "([\w]+)"|the ([\w]+) column/i.exec(msg);
    const col = m && (m[1] || m[2] || m[3] || m[4]);
    if (!col) break;
    payload = payload.map((r) => {
      const c = { ...r };
      delete c[col];
      return c;
    });
    res = await admin.from('notifications').insert(payload);
    guard += 1;
  }
  return res;
}

// Create an in-app notification for one recipient, and (unless email:false) also
// email them. Inserts via the service-role client so it works regardless of who
// triggered it (RLS only governs reads). Fails silently (e.g. before migration
// 0013, or if email isn't configured) so it never blocks the action.
export async function notify({ userId, type = 'lead_assigned', title, body, link, leadId, email = true, push = true, cta }) {
  if (!userId || !title) return;
  const admin = createAdminClient();
  try {
    await insertNotifications(admin, [
      {
        user_id: userId,
        type,
        title,
        body: body || null,
        link: link || null,
        lead_id: leadId || null,
        requires_action: ACTION_TYPES.includes(type),
      },
    ]);
  } catch (e) {
    // no-op — in-app insert failed (e.g. before migration 0013)
  }
  // Also push to the recipient's phone(s), so notes/reminders reach them even
  // when the app is closed. Silently skipped if push isn't set up / subscribed.
  if (push) {
    try {
      await sendPushToUser(userId, { title, body: body || '', url: link || '/notifications' });
    } catch (e) {
      // no-op — never let a push failure break the triggering action
    }
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
    const type = payload.type || 'info';
    const rows = (mgrs || [])
      .map((m) => m.id)
      .filter((id) => id && id !== exceptUserId)
      .map((id) => ({
        user_id: id,
        type,
        title: payload.title,
        body: payload.body || null,
        link: payload.link || null,
        lead_id: payload.leadId || null,
        requires_action: ACTION_TYPES.includes(type),
      }));
    if (rows.length) await insertNotifications(admin, rows);
  } catch (e) {
    // no-op
  }
}

// Mark a user's action-required notifications as done, so they drop off the
// bell. Called when the user actually acts (logs activity on the lead, changes
// its status, completes a test). Scope by leadId and/or types when known.
// Degrades to a no-op before migration 0026 (no resolved_at column yet).
export async function resolveNotifications({ userId, leadId = null, types = null }) {
  if (!userId) return;
  try {
    const admin = createAdminClient();
    let q = admin
      .from('notifications')
      .update({ resolved_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('resolved_at', null);
    if (leadId) q = q.eq('lead_id', leadId);
    if (types && types.length) q = q.in('type', types);
    await q;
  } catch (e) {
    // no-op — resolved_at column not present yet, or nothing to resolve
  }
}
