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

// Like sendPushToUser but returns a detailed result for the self-test button,
// so a user can see exactly why push isn't arriving (keys missing, no device
// subscribed here, or a delivery error from the push service).
export async function sendPushDiag(userId, payload) {
  if (!ensureConfigured()) {
    return { configured: false, sent: 0, failed: 0, noSubs: false, errors: ['VAPID keys are not set on the server.'] };
  }
  const admin = createAdminClient();
  const { data: subs } = await admin.from('push_subscriptions').select('*').eq('user_id', userId);
  if (!subs || !subs.length) {
    return { configured: true, sent: 0, failed: 0, noSubs: true, errors: [] };
  }
  let sent = 0;
  let failed = 0;
  const errors = [];
  const body = JSON.stringify(payload);
  for (const s of subs) {
    try {
      // Cap each send at 10s so an unreachable push endpoint can't hang the page.
      await Promise.race([
        webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
          // High urgency wakes locked iPhones; 1h TTL — a lead alert older
          // than that is stale anyway.
          { TTL: 3600, urgency: 'high' }
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timed out reaching the push service')), 10000)),
      ]);
      sent += 1;
    } catch (e) {
      failed += 1;
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await admin.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
        errors.push('A stale subscription on this device was removed — tap Enable again.');
      } else {
        errors.push(`Delivery failed (${e?.statusCode || '?'}): ${e?.body || e?.message || 'unknown error'}`);
      }
    }
  }
  return { configured: true, sent, failed, noSubs: false, errors };
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
            body,
            { TTL: 3600, urgency: 'high' }
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
