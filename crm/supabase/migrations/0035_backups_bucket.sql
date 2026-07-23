-- ============================================================================
-- 0035 — Storage bucket for nightly database snapshots.
-- ----------------------------------------------------------------------------
-- A Vercel cron (/api/cron/backup) dumps the important tables to this private
-- bucket every night as snapshot-YYYY-MM-DD.json and keeps the last 30 days.
-- Nobody uploads from the browser — only the service role writes/reads here,
-- so no storage policies are needed. Run in the Supabase SQL editor. Idempotent.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('backups', 'backups', false)
on conflict (id) do nothing;
