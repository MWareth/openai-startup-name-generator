-- ============================================================================
-- 0037 — Fake / spam lead flag.
-- ----------------------------------------------------------------------------
-- A lead flagged as fake disappears from the working Leads list (agents and
-- admins shouldn't waste time on it), but the row is KEPT so the marketing
-- report can show management how much junk each campaign produced.
-- Run in the Supabase SQL editor. Idempotent.
-- ============================================================================

alter table public.leads add column if not exists is_fake boolean not null default false;
alter table public.leads add column if not exists fake_flagged_at timestamptz;
alter table public.leads add column if not exists fake_flagged_by uuid references public.profiles(id) on delete set null;

create index if not exists leads_is_fake_idx on public.leads(is_fake);

-- Backfill: leads already flagged through the old "fake / spam" note.
update public.leads l
set is_fake = true,
    fake_flagged_at = coalesce(l.fake_flagged_at, a.created_at)
from (
  select distinct on (lead_id) lead_id, created_at
  from public.lead_activities
  where body like '%Flagged as fake%'
  order by lead_id, created_at desc
) a
where a.lead_id = l.id and l.is_fake = false;
