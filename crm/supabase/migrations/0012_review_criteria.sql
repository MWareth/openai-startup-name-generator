-- ============================================================================
-- Estate CRM — make review criteria editable (admin-managed) and link scores
-- to a criterion. Run AFTER 0010 (and 0011). Management-only, like reviews.
-- ============================================================================

create table if not exists public.review_criteria (
  id               uuid primary key default gen_random_uuid(),
  label            text not null,
  sort_order       int not null default 0,
  auto_from_target boolean not null default false,  -- pre-fill stars from target %
  active           boolean not null default true,
  created_at       timestamptz not null default now()
);

-- Link each score to its criterion (the `criterion` text column still holds the
-- label snapshot so history reads correctly even if a criterion is later renamed).
alter table public.agent_review_scores add column if not exists criterion_id uuid references public.review_criteria(id);

alter table public.review_criteria enable row level security;
drop policy if exists review_criteria_mgmt_all on public.review_criteria;
create policy review_criteria_mgmt_all on public.review_criteria
  for all to authenticated using (public.is_management()) with check (public.is_management());

-- Seed the default six criteria only if the table is empty.
insert into public.review_criteria (label, sort_order, auto_from_target)
select v.label, v.sort_order, v.auto_from_target
from (values
  ('Lead follow-up & responsiveness', 1, false),
  ('Closing & negotiation',           2, false),
  ('Communication & reporting',       3, false),
  ('Goal & target achievement',       4, true),
  ('Teamwork & attitude',             5, false),
  ('Professionalism & compliance',    6, false)
) as v(label, sort_order, auto_from_target)
where not exists (select 1 from public.review_criteria);
