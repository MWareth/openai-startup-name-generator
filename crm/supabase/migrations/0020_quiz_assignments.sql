-- ============================================================================
-- 0020 — Assign a training test to specific members (from the Teams tab).
-- Run in the Supabase SQL editor AFTER 0018 (and 0019).
-- Assignment rows + the notification are written server-side with the
-- service-role key; a member can read their own assignments.
-- ============================================================================

create table if not exists public.quiz_assignments (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references public.quizzes(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now(),
  unique (quiz_id, user_id)
);
create index if not exists quiz_assignments_user_idx on public.quiz_assignments(user_id);

alter table public.quiz_assignments enable row level security;
drop policy if exists quiz_assignments_select_own on public.quiz_assignments;
create policy quiz_assignments_select_own on public.quiz_assignments
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
