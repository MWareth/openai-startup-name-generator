-- ============================================================================
-- 0014 — Fun profile fields
-- ----------------------------------------------------------------------------
-- Agents can set their own phone, team, and two motivational "dream" goals.
-- Email stays admin-controlled (changed only from the Admin page) and is
-- view-only on the profile. Agents update these via a service-role action that
-- is hard-scoped to their own id, so they still can't touch role/seniority.
-- ============================================================================
alter table public.profiles
  add column if not exists phone      text,
  add column if not exists team       text not null default 'Offplan',
  add column if not exists dream_week text,
  add column if not exists dream_car  text;
