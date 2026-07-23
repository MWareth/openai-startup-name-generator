-- ============================================================================
-- 0036 — Device label on push subscriptions.
-- ----------------------------------------------------------------------------
-- Stores the browser's user-agent string when a device registers for push, so
-- the profile page can name each registered device ("iPhone (Safari app)",
-- "Samsung"…) instead of just counting them. Optional — the app tolerates this
-- column being absent. Run in the Supabase SQL editor. Idempotent.
-- ============================================================================

alter table public.push_subscriptions add column if not exists ua text;
