-- ============================================================================
-- 0015 — Force password change at first login
-- ----------------------------------------------------------------------------
-- The password an admin sets when creating (or resetting) a user is temporary.
-- This flag is set true then, and the app forces the user to set their own
-- password before using the CRM; setting it clears the flag. Existing users
-- default to false, so nobody is locked out retroactively.
-- ============================================================================
alter table public.profiles
  add column if not exists must_change_password boolean not null default false;
