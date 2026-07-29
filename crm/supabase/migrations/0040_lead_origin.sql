-- ============================================================================
-- 0040 — Lead origin: how the lead was generated.
-- ----------------------------------------------------------------------------
-- `source` (free text) says which CHANNEL a lead came through. Origin says who
-- did the work to get it, which is what the cold-call contest and the marketing
-- report actually need:
--
--   campaign   — paid ads / social, marketing generated it
--   follow_up  — re-engaged from the existing database (old enquiry, past client)
--   cold_call  — brand-new conversation the agent started
--   other      — portal, referral, walk-in
--
-- The contest previously matched source = 'Cold Call' exactly, so "cold call",
-- "Cold-Call" or a trailing space silently scored nothing. Origin fixes that.
-- Run in the Supabase SQL editor. Idempotent.
-- ============================================================================

alter table public.leads add column if not exists origin text;

alter table public.leads drop constraint if exists leads_origin_check;
alter table public.leads add constraint leads_origin_check
  check (origin is null or origin in ('campaign', 'follow_up', 'cold_call', 'other'));

create index if not exists leads_origin_idx on public.leads(origin);

-- Backfill from the existing source text. Anything that isn't recognisably a
-- cold call or campaign traffic becomes 'other' — including portals and
-- referrals, which is correct. Follow-ups can't be inferred from source (there
-- was no way to record one before), so none are guessed: they start from the
-- next lead created with the new selector.
update public.leads
set origin = case
  when source ~* 'cold\s*-?\s*call' then 'cold_call'
  when source ~* 'campaign|website|instagram|insta|facebook|\mfb\M|\mmeta\M|google|tiktok|snapchat|youtube' then 'campaign'
  else 'other'
end
where origin is null;
