import { NextResponse } from 'next/server';
import webpush from 'web-push';
import { createClient } from '@/lib/supabase/server';

// One-time helper: an admin hits this to generate a VAPID keypair, then pastes
// the two keys into Vercel env vars. Generating keys is stateless and harmless.
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || !['admin', 'director', 'c_suite'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const keys = webpush.generateVAPIDKeys();
  return NextResponse.json({
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: keys.publicKey,
    VAPID_PRIVATE_KEY: keys.privateKey,
    note: 'Add these to Vercel env vars (and set VAPID_SUBJECT to mailto:you@email.com), then redeploy.',
  });
}
