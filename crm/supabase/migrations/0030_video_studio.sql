-- ============================================================================
-- 0030 — Video Studio: agent avatar videos from approved scripts (HeyGen).
-- ----------------------------------------------------------------------------
--  • avatar_profiles — per-user avatar setup: likeness consent (ticked by the
--    agent) + the HeyGen avatar/voice IDs (pasted by admin after creating the
--    digital twin from the agent's 2-minute clip).
--  • video_requests  — an agent picks an approved script and requests a video;
--    admin approves → render fires. The approval gate is the credit lock.
--    script_body is snapshotted at request time so later edits don't change
--    what renders.
-- Run in the Supabase SQL editor AFTER 0029. Idempotent.
-- ============================================================================

create table if not exists public.avatar_profiles (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  consent_at timestamptz,           -- when the person agreed to likeness use
  avatar_id  text,                  -- HeyGen avatar id (admin-entered)
  voice_id   text,                  -- HeyGen voice id (admin-entered)
  updated_at timestamptz not null default now()
);

create table if not exists public.video_requests (
  id              uuid primary key default gen_random_uuid(),
  agent_id        uuid not null references public.profiles(id) on delete cascade,
  script_id       uuid references public.content_scripts(id) on delete set null,
  project_name    text,
  language        text,
  script_body     text not null,    -- snapshot of the approved script
  status          text not null default 'requested',  -- requested | rendering | done | failed | rejected
  heygen_video_id text,
  video_url       text,
  error           text,
  requested_at    timestamptz not null default now(),
  approved_by     uuid references public.profiles(id) on delete set null,
  approved_at     timestamptz
);

create index if not exists video_requests_agent_idx on public.video_requests(agent_id, requested_at desc);
create index if not exists video_requests_status_idx on public.video_requests(status);

alter table public.avatar_profiles enable row level security;
alter table public.video_requests  enable row level security;

-- Reads: avatar setup is visible to all signed-in users (nothing sensitive);
-- video requests are visible to their agent and to management/marketing.
-- Writes go through the service role in server actions.
drop policy if exists avatar_profiles_select on public.avatar_profiles;
create policy avatar_profiles_select on public.avatar_profiles
  for select to authenticated using (true);

drop policy if exists video_requests_select on public.video_requests;
create policy video_requests_select on public.video_requests
  for select to authenticated using (
    agent_id = auth.uid() or public.is_admin() or public.is_marketing()
  );
