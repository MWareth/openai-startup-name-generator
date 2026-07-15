-- ============================================================================
-- 0033 — Lead routing rules: per-agent budget range + property types, with
-- automatic rotation.
-- ----------------------------------------------------------------------------
-- Admin sets each agent's routing criteria on the Teams page. When a lead
-- arrives (intake webhook / email parser / manual "Auto-route"), the CRM picks
-- the matching agent who was routed to least recently (fair round-robin).
-- Run in the Supabase SQL editor AFTER 0001. Idempotent.
-- ============================================================================

alter table public.profiles add column if not exists route_enabled    boolean not null default false;
alter table public.profiles add column if not exists route_min_budget bigint;          -- AED, null = no minimum
alter table public.profiles add column if not exists route_max_budget bigint;          -- AED, null = no maximum
alter table public.profiles add column if not exists route_types      text;            -- csv, e.g. 'Apartment,Villa'; null/empty = any
alter table public.profiles add column if not exists last_routed_at   timestamptz;     -- rotation cursor
