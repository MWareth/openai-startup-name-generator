import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// Nightly safety net (Vercel Cron): dumps every important table to the private
// "backups" storage bucket as snapshot-YYYY-MM-DD.json (Dubai date) and prunes
// snapshots older than 30 days. Restores are manual by design — pull the
// snapshot from Storage and rebuild the rows you need — so a bad SQL run (like
// a bulk update gone wrong) can always be walked back. Secured with
// CRON_SECRET when set. Requires migration 0035 (backups bucket).

// Tables worth keeping. Unknown/not-yet-migrated tables are skipped silently
// so this never breaks as the schema evolves.
const TABLES = [
  'profiles',
  'leads',
  'lead_activities',
  'lead_followups',
  'deals',
  'targets',
  'audit_events',
  'onboarding_ticks',
  'onboarding_config',
  'launches',
  'quizzes',
  'quiz_assignments',
  'quiz_attempts',
  'content_projects',
  'content_scripts',
  'content_videos',
  'project_assets',
];

const KEEP_DAYS = 30;
const PAGE = 1000;

async function dumpTable(admin, table) {
  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await admin.from(table).select('*').range(from, from + PAGE - 1);
    if (error) return { skipped: error.message };
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return { rows };
}

export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  const admin = createAdminClient();
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dubai', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date());

  const snapshot = { taken_at: new Date().toISOString(), dubai_date: today, tables: {} };
  const counts = {};
  for (const table of TABLES) {
    const res = await dumpTable(admin, table);
    if (res.rows) {
      snapshot.tables[table] = res.rows;
      counts[table] = res.rows.length;
    }
  }

  const body = Buffer.from(JSON.stringify(snapshot));
  const { error: upErr } = await admin.storage
    .from('backups')
    .upload(`snapshot-${today}.json`, body, { contentType: 'application/json', upsert: true });
  if (upErr) {
    return NextResponse.json({ ok: false, error: upErr.message }, { status: 500 });
  }

  // Prune snapshots past the retention window.
  let pruned = 0;
  try {
    const { data: files } = await admin.storage.from('backups').list('', { limit: 200 });
    const cutoff = new Date(Date.now() - KEEP_DAYS * 86400000).toISOString().slice(0, 10);
    const old = (files || [])
      .map((f) => f.name)
      .filter((n) => /^snapshot-\d{4}-\d{2}-\d{2}\.json$/.test(n) && n.slice(9, 19) < cutoff);
    if (old.length) {
      await admin.storage.from('backups').remove(old);
      pruned = old.length;
    }
  } catch (e) {
    // pruning is best-effort — never fail the backup over it
  }

  return NextResponse.json({ ok: true, file: `snapshot-${today}.json`, counts, pruned });
}
