-- ============================================================================
-- Estate CRM — mark self-sourced (own-referral) leads & deals.
-- When an agent brings their own lead, the split is 60% agent / 40% company
-- regardless of seniority. The flag lives on both the lead and the deal.
-- Run this in the Supabase SQL editor AFTER 0008.
-- ============================================================================

alter table public.leads add column if not exists self_sourced boolean not null default false;
alter table public.deals add column if not exists self_sourced boolean not null default false;
