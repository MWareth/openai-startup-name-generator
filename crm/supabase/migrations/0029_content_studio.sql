-- ============================================================================
-- 0029 — Content Studio: brochure → agent video scripts.
-- ----------------------------------------------------------------------------
-- A content project holds the FACTS extracted from a project brochure/renders
-- (stored once, so new scripts in other languages are cheap regenerations).
-- Scripts are drafts until approved; agents only ever see approved ones.
-- Writes happen server-side with the service role; reads for all signed-in
-- users. Run in the Supabase SQL editor AFTER 0001. Idempotent.
-- ============================================================================

create table if not exists public.content_projects (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  developer  text,
  area       text,
  facts      jsonb not null default '{}'::jsonb,   -- extracted brochure facts
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.content_scripts (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.content_projects(id) on delete cascade,
  language     text not null default 'English',
  duration_sec int not null default 45,
  tone         text,
  body         text not null,
  status       text not null default 'draft',      -- draft | approved
  created_by   uuid references public.profiles(id) on delete set null,
  approved_by  uuid references public.profiles(id) on delete set null,
  approved_at  timestamptz,
  created_at   timestamptz not null default now()
);

create index if not exists content_scripts_project_idx on public.content_scripts(project_id, created_at desc);

alter table public.content_projects enable row level security;
alter table public.content_scripts  enable row level security;

-- Everyone signed in can read (agents see approved scripts in the app);
-- inserts/updates/deletes go through the service role in server actions.
drop policy if exists content_projects_select on public.content_projects;
create policy content_projects_select on public.content_projects
  for select to authenticated using (true);

drop policy if exists content_scripts_select on public.content_scripts;
create policy content_scripts_select on public.content_scripts
  for select to authenticated using (true);
