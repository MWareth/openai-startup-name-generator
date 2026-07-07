-- ============================================================================
-- 0024 — Add an optional time to a follow-up (date + time slot for calling).
-- `due_on` (date) stays the source of truth for the daily reminder & calendar;
-- `due_at` adds the exact time (stored in UTC, entered in Dubai time).
-- Run in the Supabase SQL editor AFTER 0013. Idempotent.
-- ============================================================================

alter table public.lead_followups add column if not exists due_at timestamptz;
