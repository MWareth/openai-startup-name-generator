import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Save a device's push subscription for the signed-in user.
export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const sub = await request.json().catch(() => null);
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ ok: false, error: 'Invalid subscription' }, { status: 400 });
  }

  const admin = createAdminClient();
  const row = { user_id: user.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth };
  // Device label for the profile "registered devices" list. Tolerated if the
  // ua column isn't migrated yet (0036) — retry without it.
  if (typeof sub.ua === 'string' && sub.ua) row.ua = sub.ua.slice(0, 300);
  let { error } = await admin.from('push_subscriptions').upsert(row, { onConflict: 'endpoint' });
  if (error && /ua/.test(error.message || '')) {
    delete row.ua;
    ({ error } = await admin.from('push_subscriptions').upsert(row, { onConflict: 'endpoint' }));
  }
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

// Remove this device's subscription (turn notifications off).
export async function DELETE(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const { endpoint } = await request.json().catch(() => ({}));
  if (endpoint) {
    const admin = createAdminClient();
    await admin.from('push_subscriptions').delete().eq('endpoint', endpoint).eq('user_id', user.id);
  }
  return NextResponse.json({ ok: true });
}
