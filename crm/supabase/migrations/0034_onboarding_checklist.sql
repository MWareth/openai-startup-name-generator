-- ============================================================================
-- 0034 — Newcomer program checklist ticks.
-- ----------------------------------------------------------------------------
-- The 4-week newcomer program is a fixed week-by-week checklist (defined in
-- the app). Manual items are ticked by the agent (admin can untick); this
-- table stores those ticks with who/when. Auto items (conversations, meetings,
-- EOI moves) are counted from CRM data and never stored here.
-- Run in the Supabase SQL editor AFTER 0028. Idempotent.
-- ============================================================================

create table if not exists public.onboarding_ticks (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  item_key   text not null,
  checked_at timestamptz not null default now(),
  checked_by uuid references public.profiles(id) on delete set null,
  primary key (user_id, item_key)
);

alter table public.onboarding_ticks enable row level security;

-- Everyone signed in can read (agents see their list, admins see everyone's);
-- writes go through the service role in server actions.
drop policy if exists onboarding_ticks_select on public.onboarding_ticks;
create policy onboarding_ticks_select on public.onboarding_ticks
  for select to authenticated using (true);
