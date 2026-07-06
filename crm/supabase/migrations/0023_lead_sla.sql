-- ============================================================================
-- 0023 — Lead response SLA: flag leads not actioned within 20 minutes.
-- ----------------------------------------------------------------------------
-- Adds timing columns to leads:
--   assigned_at        — when the lead was last (re)assigned to an agent
--   sla_alerted_at     — when the agent was nudged (20 min, once)
--   sla_escalated_at   — when management was escalated to (40 min, once)
-- A scheduled endpoint (/api/cron/lead-sla) reads these to send reminders.
-- Existing leads have assigned_at NULL and are ignored, so nothing old fires.
-- Run in the Supabase SQL editor AFTER 0001. Idempotent.
-- ============================================================================

alter table public.leads add column if not exists assigned_at      timestamptz;
alter table public.leads add column if not exists sla_alerted_at   timestamptz;
alter table public.leads add column if not exists sla_escalated_at timestamptz;

create index if not exists leads_sla_idx on public.leads(assigned_at)
  where assigned_at is not null;
