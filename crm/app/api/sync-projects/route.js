import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncProjectsFromSheet } from '@/lib/projectsSync';

export const dynamic = 'force-dynamic';

// Hit daily by Vercel Cron (see vercel.json) to mirror the Google Sheet into
// the projects directory. Also callable manually.
export async function GET() {
  const admin = createAdminClient();
  try {
    const synced = await syncProjectsFromSheet(admin);
    return NextResponse.json({ ok: true, synced });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
