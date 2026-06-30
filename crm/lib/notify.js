import { createAdminClient } from '@/lib/supabase/admin';

// Create an in-app notification for one recipient. Inserts via the service-role
// client so it works regardless of who triggered it (RLS only governs reads).
// Fails silently (e.g. before migration 0013) so it never blocks the action.
export async function notify({ userId, type = 'lead_assigned', title, body, link, leadId }) {
  if (!userId || !title) return;
  try {
    const admin = createAdminClient();
    await admin.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body: body || null,
      link: link || null,
      lead_id: leadId || null,
    });
  } catch (e) {
    // no-op
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
