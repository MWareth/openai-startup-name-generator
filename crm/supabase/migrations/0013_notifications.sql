-- ============================================================================
-- Estate CRM — in-app notifications (e.g. "a lead was assigned to you").
-- Rows are created server-side (service role); each user reads/updates only
-- their own. Run in the Supabase SQL editor AFTER 0012.
-- ============================================================================

create table if not exists public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,  -- recipient
  type       text not null default 'lead_assigned',
  title      text not null,
  body       text,
  link       text,                                   -- e.g. /leads/<id>
  lead_id    uuid references public.leads(id) on delete cascade,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications(user_id, read_at);

alter table public.notifications enable row level security;

-- A user can see and update (mark read) only their own notifications.
drop policy if exists notifications_select on public.notifications;
create policy notifications_select on public.notifications
  for select to authenticated using (user_id = auth.uid());

drop policy if exists notifications_update on public.notifications;
create policy notifications_update on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists notifications_delete on public.notifications;
create policy notifications_delete on public.notifications
  for delete to authenticated using (user_id = auth.uid());
-- Inserts are done with the service-role key from server actions (bypasses RLS).
