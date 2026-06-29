import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';

// Server-only Web Push helper. Configures VAPID from env on first use; if the
// keys aren't set yet, sends are silently skipped (so the app still works).
let configured = false;
function ensureConfigured() {
  if (configured) return true;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (!pub || !priv) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:admin@bullishcrm.app', pub, priv);
  configured = true;
  return true;
}

// Send a notification to every device a user has registered.
// payload: { title, body, url }
export async function sendPushToUser(userId, payload) {
  try {
    if (!ensureConfigured() || !userId) return;
    const admin = createAdminClient();
    const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', userId);
    if (!subs || !subs.length) return;

    const body = JSON.stringify(payload);
    await Promise.all(
      subs.map(async (s) => {
        try {
          await webpush.sendNotification(
            { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
            body
          );
        } catch (e) {
          // Expired/invalid subscription — drop it.
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
          }
        }
      })
    );
  } catch (e) {
    // Never let a failed notification break the action that triggered it.
  }
}
