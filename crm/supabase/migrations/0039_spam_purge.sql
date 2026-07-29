-- ============================================================================
-- 0039 — Purge spam leads after one week, keep the marketing tally.
-- ----------------------------------------------------------------------------
-- A lead flagged as fake/spam is hidden from Leads immediately (0037) and is
-- deleted outright one week after it was flagged — the row and everything
-- hanging off it (activities, follow-ups, notifications all cascade).
--
-- Before the delete, an ANONYMOUS tally row is written to spam_archive: the
-- source and the dates, and nothing else. No name, phone, email or notes. That
-- keeps the marketing report's junk-rate honest for past periods — otherwise
-- pulling last month's report after the purge would show zero spam and make a
-- bad campaign look clean — while the contact details really are gone.
--
-- Run in the Supabase SQL editor. Idempotent.
-- ============================================================================

create table if not exists public.spam_archive (
  id              uuid primary key default gen_random_uuid(),
  lead_id         uuid,           -- original id, for de-duping. Not a FK: the lead is gone.
  source          text,
  property_type   text,
  lead_created_at timestamptz not null,   -- when the junk arrived (the report buckets on this)
  flagged_at      timestamptz,            -- when the team called it spam
  purged_at       timestamptz not null default now()
);

-- The report filters by the date the lead arrived.
create index if not exists spam_archive_created_idx on public.spam_archive(lead_created_at);
-- Re-running the purge must never double-count the same lead.
create unique index if not exists spam_archive_lead_uidx on public.spam_archive(lead_id);

alter table public.spam_archive enable row level security;

-- Server-side code uses the service-role key and bypasses RLS. No policy is
-- granted to normal clients: the archive is management reporting only.
drop policy if exists spam_archive_no_client_access on public.spam_archive;

-- ----------------------------------------------------------------------------
-- The purge itself. Archive first, then delete — one transaction, so a failure
-- can never delete a lead without leaving its tally behind.
-- Returns the number of leads purged.
-- ----------------------------------------------------------------------------
create or replace function public.purge_old_spam_leads(retain_days int default 7)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  purged int;
begin
  with doomed as (
    select id, source, property_type, created_at, fake_flagged_at
    from public.leads
    where is_fake = true
      and coalesce(fake_flagged_at, created_at) < now() - make_interval(days => retain_days)
  ), archived as (
    insert into public.spam_archive (lead_id, source, property_type, lead_created_at, flagged_at)
    select id, source, property_type, created_at, fake_flagged_at from doomed
    on conflict (lead_id) do nothing
    returning lead_id
  )
  delete from public.leads l using doomed d where l.id = d.id;

  get diagnostics purged = row_count;
  return purged;
end;
$$;

revoke all on function public.purge_old_spam_leads(int) from public, anon, authenticated;
