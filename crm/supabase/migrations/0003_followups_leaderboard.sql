-- ============================================================================
-- Estate CRM — follow-up dates + team leaderboard
-- Run this in the Supabase SQL editor AFTER 0002.
-- ============================================================================

-- Next action / follow-up date on each lead (drives the "Today" view).
alter table public.leads add column if not exists next_follow_up date;

-- Team leaderboard. A SECURITY DEFINER function so every signed-in user can see
-- the *aggregated* ranking (names + totals) without exposing individual deal
-- rows — agents only have row access to their own deals via RLS otherwise.
create or replace function public.agent_leaderboard()
returns table (
  agent_id         uuid,
  full_name        text,
  seniority        text,
  deals_count      bigint,
  total_value      numeric,
  total_commission numeric
)
language sql
security definer
stable
set search_path = public
as $$
  select
    p.id,
    p.full_name,
    p.seniority::text,
    count(d.id)                          as deals_count,
    coalesce(sum(d.deal_value), 0)       as total_value,
    coalesce(sum(d.agent_commission), 0) as total_commission
  from public.profiles p
  left join public.deals d on d.agent_id = p.id
  where p.role in ('agent', 'admin')
  group by p.id, p.full_name, p.seniority
  order by total_value desc, deals_count desc;
$$;

grant execute on function public.agent_leaderboard() to authenticated;
