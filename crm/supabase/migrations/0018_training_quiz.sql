-- ============================================================================
-- 0018 — Training quiz (onboarding test for juniors)
-- ----------------------------------------------------------------------------
-- Admins build a quiz; agents take it once (timed); results are stored and
-- shown in the CRM. Correct answers live in quiz_questions, which is READABLE
-- BY ADMINS ONLY — the take page serves stripped questions via the service-role
-- key and grades server-side, so agents can never see the answer key or forge a
-- score. Run in the Supabase SQL editor AFTER 0017.
-- ============================================================================

create table if not exists public.quizzes (
  id                 uuid primary key default gen_random_uuid(),
  title              text not null,
  description        text,
  time_limit_minutes int  not null default 15,
  pass_mark          numeric not null default 0.7,  -- fraction (0.7 = 70%)
  is_active          boolean not null default true,
  created_by         uuid references public.profiles(id),
  created_at         timestamptz not null default now()
);

create table if not exists public.quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  quiz_id       uuid not null references public.quizzes(id) on delete cascade,
  position      int  not null default 0,
  kind          text not null default 'mcq',   -- 'mcq' | 'numeric'
  prompt        text not null,
  options       jsonb,                          -- mcq: [{"key":"A","text":"..."}, ...]
  correct_key   text,                           -- mcq
  correct_value numeric,                        -- numeric
  tolerance     numeric not null default 0,     -- numeric: allowed +/- difference
  points        int  not null default 1,
  is_hard       boolean not null default false,
  explanation   text
);
create index if not exists quiz_questions_quiz_idx on public.quiz_questions(quiz_id, position);

create table if not exists public.quiz_attempts (
  id           uuid primary key default gen_random_uuid(),
  quiz_id      uuid not null references public.quizzes(id) on delete cascade,
  user_id      uuid not null references public.profiles(id) on delete cascade,
  started_at   timestamptz not null default now(),
  submitted_at timestamptz,
  correct      int not null default 0,
  total        int not null default 0,
  score_pct    numeric not null default 0,
  passed       boolean not null default false,
  answers      jsonb,
  unique (quiz_id, user_id)                     -- one attempt per user per quiz
);
create index if not exists quiz_attempts_quiz_idx on public.quiz_attempts(quiz_id);

-- ---------- Row Level Security ----------------------------------------------
alter table public.quizzes        enable row level security;
alter table public.quiz_questions enable row level security;
alter table public.quiz_attempts  enable row level security;

-- Quizzes: everyone signed in can see them (to take); only admins manage.
drop policy if exists quizzes_select on public.quizzes;
create policy quizzes_select on public.quizzes for select to authenticated using (true);
drop policy if exists quizzes_admin_write on public.quizzes;
create policy quizzes_admin_write on public.quizzes
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Questions: ADMIN-ONLY reads (answers are secret). Takers get them via the
-- service-role key with answers stripped.
drop policy if exists quiz_questions_admin on public.quiz_questions;
create policy quiz_questions_admin on public.quiz_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Attempts: a user sees their own; admins see all. Inserts happen server-side
-- via the service-role key (so scores can't be forged) — no client insert policy.
drop policy if exists quiz_attempts_select on public.quiz_attempts;
create policy quiz_attempts_select on public.quiz_attempts
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
drop policy if exists quiz_attempts_admin_write on public.quiz_attempts;
create policy quiz_attempts_admin_write on public.quiz_attempts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- The quiz content is seeded separately in 0019_seed_quiz.sql.
