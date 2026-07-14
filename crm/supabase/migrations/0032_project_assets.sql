-- ============================================================================
-- 0032 — Project assets: renders & animated b-roll clips per content project.
-- ----------------------------------------------------------------------------
-- Images (brochure renders) and short video clips (renders brought to life in
-- Kling/Higgsfield) attached to a content project. Used as scene backgrounds
-- behind the speaking agent in HeyGen videos, so they must be publicly
-- fetchable → public bucket. Run AFTER 0029. Idempotent.
-- ============================================================================

create table if not exists public.content_assets (
  id         uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.content_projects(id) on delete cascade,
  kind       text not null default 'image',   -- image | video
  url        text not null,                   -- public URL (HeyGen fetches this)
  path       text not null,                   -- storage path (for deletion)
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists content_assets_project_idx on public.content_assets(project_id, created_at);

alter table public.content_assets enable row level security;

drop policy if exists content_assets_select on public.content_assets;
create policy content_assets_select on public.content_assets
  for select to authenticated using (true);

-- Public bucket so HeyGen can fetch backgrounds by URL.
insert into storage.buckets (id, name, public)
values ('project-assets', 'project-assets', true)
on conflict (id) do nothing;

drop policy if exists "project_assets_upload" on storage.objects;
create policy "project_assets_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-assets');
