import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

// List the signed-in user's registered push devices, so the profile page can
// show exactly which devices "Sent to N devices" refers to.
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from('push_subscriptions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  const devices = (data || []).map((s) => ({
    endpoint: s.endpoint,
    created_at: s.created_at,
    ua: s.ua || null,
  }));
  return NextResponse.json({ ok: true, devices });
}
