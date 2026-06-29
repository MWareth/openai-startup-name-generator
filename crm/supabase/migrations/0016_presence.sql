-- ============================================================================
-- 0016 — Login counter & presence/time tracking (for management + support)
-- ----------------------------------------------------------------------------
-- profiles gains a login counter and last-login / last-seen timestamps.
-- user_activity holds ONE row per user per day with total active seconds,
-- accumulated by a heartbeat while the app is open and the user is active.
-- RLS is enabled with no client policies: the heartbeat writes via a
-- SECURITY DEFINER function, and the staff monitoring page reads with the
-- service-role key — so regular agents can't read others' activity directly.
-- ============================================================================
alter table public.profiles
  add column if not exists login_count  int not null default 0,
  add column if not exists last_login_at timestamptz,
  add column if not exists last_seen_at  timestamptz;

create table if not exists public.user_activity (
  user_id uuid not null references public.profiles(id) on delete cascade,
  day     date not null,
  seconds int  not null default 0,
  primary key (user_id, day)
);

alter table public.user_activity enable row level security;
-- (Intentionally no SELECT/INSERT policies: writes go through record_presence
--  (security definer); reads happen server-side with the service-role key.)

-- Atomically add active seconds for the caller's "today" (Dubai day) and bump
-- their last_seen_at. Called from the heartbeat with the user's own session.
create or replace function public.record_presence(p_seconds int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  d date := (now() at time zone 'Asia/Dubai')::date;
  s int := greatest(0, least(120, coalesce(p_seconds, 0)));
begin
  if auth.uid() is null then
    return;
  end if;
  insert into public.user_activity (user_id, day, seconds)
  values (auth.uid(), d, s)
  on conflict (user_id, day)
    do update set seconds = public.user_activity.seconds + s;
  update public.profiles set last_seen_at = now() where id = auth.uid();
end;
$$;
