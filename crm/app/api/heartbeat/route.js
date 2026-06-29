import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Records a slice of active time for the signed-in user. Called by the client
// PresenceTracker roughly once a minute while the app is open and in use.
export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const seconds = Math.min(120, Math.max(0, Math.round(Number(body?.seconds) || 0)));

  await supabase.rpc('record_presence', { p_seconds: seconds });
  return NextResponse.json({ ok: true });
}
