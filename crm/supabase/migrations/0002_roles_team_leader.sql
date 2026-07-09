-- ============================================================================
-- Estate CRM — add Team Leader commission level + Director / C-Suite roles
-- Run this in the Supabase SQL editor AFTER 0001_init.sql.
-- ============================================================================

-- New commission level for agents (60/40 split, handled in app code).
alter type public.seniority_level add value if not exists 'team_leader';

-- New oversight roles. They earn no commission and have no targets, but are
-- granted full owner-level access (monitor everything + edit).
alter type public.user_role add value if not exists 'director';
alter type public.user_role add value if not exists 'c_suite';

-- Grant Director and C-Suite the same access as the owner-admin. is_admin() is
-- used throughout the RLS policies and the lead-reassign guard, so updating it
-- here is all that's needed. We compare role::text so this works in the same
-- transaction that just added the new enum values.
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role::text in ('admin', 'director', 'c_suite')
  );
$$;
