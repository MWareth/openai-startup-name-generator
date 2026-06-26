-- ============================================================================
-- Estate CRM — agent performance reviews (star ratings).
-- Management (admin / director / c-suite) rate agents across several criteria;
-- each review is a dated record so you keep a history and a running average.
-- Reviews are PRIVATE to management — agents cannot see them (RLS below).
-- Run this in the Supabase SQL editor AFTER 0009.
-- ============================================================================

-- Is the current user part of management (owner-level oversight)?
create or replace function public.is_management()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'director', 'c_suite')
  );
$$;

create table if not exists public.agent_reviews (
  id           uuid primary key default gen_random_uuid(),
  agent_id     uuid not null references public.profiles(id) on delete cascade,
  reviewer_id  uuid references public.profiles(id),
  period_label text not null default '',
  reviewed_on  date not null default current_date,
  overall      numeric,            -- average of the criteria stars (1–5)
  comment      text,
  created_at   timestamptz not null default now()
);
create index if not exists agent_reviews_agent_idx on public.agent_reviews(agent_id);

create table if not exists public.agent_review_scores (
  id         uuid primary key default gen_random_uuid(),
  review_id  uuid not null references public.agent_reviews(id) on delete cascade,
  criterion  text not null,
  stars      int  not null check (stars between 1 and 5)
);
create index if not exists agent_review_scores_review_idx on public.agent_review_scores(review_id);

-- ---------- Row Level Security: management only -----------------------------
alter table public.agent_reviews       enable row level security;
alter table public.agent_review_scores enable row level security;

drop policy if exists reviews_mgmt_all on public.agent_reviews;
create policy reviews_mgmt_all on public.agent_reviews
  for all to authenticated using (public.is_management()) with check (public.is_management());

drop policy if exists review_scores_mgmt_all on public.agent_review_scores;
create policy review_scores_mgmt_all on public.agent_review_scores
  for all to authenticated using (public.is_management()) with check (public.is_management());
