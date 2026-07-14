-- ============================================================================
-- 0028 — Newcomer onboarding: a 4-week KPI for every agent's first month.
-- ----------------------------------------------------------------------------
--  • profiles.joined_on — the agent's start date (admin sets it with a calendar).
--  • onboarding_config  — the editable weekly targets for the first-month program
--    (leads worked, follow-ups done, response speed to new leads). Single row.
-- Run in the Supabase SQL editor AFTER 0001. Idempotent.
-- ============================================================================

alter table public.profiles add column if not exists joined_on date;

create table if not exists public.onboarding_config (
  id                  int primary key default 1,
  weekly_leads        int not null default 10,   -- new leads to work per week
  weekly_followups    int not null default 15,   -- follow-ups to complete per week
  target_response_min int not null default 30,   -- minutes to first action on a new lead
  updated_at          timestamptz not null default now(),
  constraint onboarding_config_singleton check (id = 1)
);

insert into public.onboarding_config (id) values (1) on conflict (id) do nothing;

alter table public.onboarding_config enable row level security;

-- Everyone signed in can read the targets; only admins edit (via service role).
drop policy if exists onboarding_config_select on public.onboarding_config;
create policy onboarding_config_select on public.onboarding_config
  for select to authenticated using (true);
