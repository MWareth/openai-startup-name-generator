-- ============================================================================
-- 0042 — Only the owner may delete a lead.
-- ----------------------------------------------------------------------------
-- Deleting a lead destroys its activities and follow-ups with it, and there is
-- no undo. Until now three roles could do it (admin, director, c_suite via
-- is_admin(), plus support through the app layer). It should be the owner and
-- nobody else.
--
-- `is_owner()` is deliberately separate from `is_admin()`: is_admin covers
-- senior management for *reading* things, and widening it would silently hand
-- deletion rights to anyone later added as a director.
--
-- Run in the Supabase SQL editor. Idempotent.
-- ============================================================================

create or replace function public.is_owner()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role::text = 'admin'   -- 'Admin (Owner)' — the single owner account
  );
$$;

-- Replace the delete policy: owner only.
drop policy if exists leads_delete on public.leads;
create policy leads_delete on public.leads
  for delete to authenticated using (public.is_owner());

-- NOTE: Row-Level Security does not apply to the service-role key. The
-- application must therefore perform lead deletion through the *caller's*
-- client for this policy to be the real boundary — see deleteLead() in
-- app/(app)/leads/actions.js.
