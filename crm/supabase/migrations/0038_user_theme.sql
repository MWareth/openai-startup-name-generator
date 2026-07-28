-- ============================================================================
-- 0038 — Per-user colour theme.
-- ----------------------------------------------------------------------------
-- Each member picks their own look on the Profile page: 'light' (the current
-- white), 'dark', or 'blue'. Stored on the profile so the choice follows them
-- to any device they sign in on. Run in the Supabase SQL editor. Idempotent.
-- ============================================================================

alter table public.profiles add column if not exists theme text;

-- Only the three supported values (or null = light).
alter table public.profiles drop constraint if exists profiles_theme_check;
alter table public.profiles add constraint profiles_theme_check
  check (theme is null or theme in ('light', 'dark', 'blue'));
