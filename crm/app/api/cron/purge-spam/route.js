import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

// Runs nightly (Vercel Cron). Deletes leads flagged as fake/spam more than a
// week ago — the row plus its activities, follow-ups and notifications, which
// all cascade. An anonymous tally (source + dates, no contact details) is
// written to spam_archive first so the marketing report's junk rate stays
// honest for past periods. Secured with CRON_SECRET when set.
export const dynamic = 'force-dynamic';

const RETAIN_DAYS = 7;

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const { data, error } = await admin.rpc('purge_old_spam_leads', { retain_days: RETAIN_DAYS });

  if (error) {
    // Migration 0039 not applied yet — say so plainly rather than failing silently.
    const missing = /purge_old_spam_leads/.test(error.message || '');
    return NextResponse.json(
      { ok: false, error: missing ? 'Run migration 0039_spam_purge.sql first.' : error.message },
      { status: missing ? 428 : 500 }
    );
  }

  return NextResponse.json({ ok: true, purged: data ?? 0, retainDays: RETAIN_DAYS });
}
