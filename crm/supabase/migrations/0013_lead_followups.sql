-- ============================================================================
-- 0013 — Multiple follow-ups per lead
-- ----------------------------------------------------------------------------
-- Until now a lead held a single next_follow_up date. This table lets a lead
-- have several scheduled follow-ups at once, each with its own note and a
-- done flag. leads.next_follow_up is kept in sync by the app (earliest pending)
-- so existing "Today's to-do" / "Due" logic keeps working unchanged.
-- ============================================================================
create table if not exists public.lead_followups (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references public.leads(id) on delete cascade,
  due_on      date not null,
  note        text not null default '',
  done        boolean not null default false,
  done_at     timestamptz,
  created_by  uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);
create index if not exists lead_followups_lead_idx on public.lead_followups(lead_id);
create index if not exists lead_followups_due_idx  on public.lead_followups(due_on);

-- ---------- Row Level Security (mirrors lead_activities) --------------------
alter table public.lead_followups enable row level security;

-- A user may see/manage follow-ups for leads they're assigned, created, or (admin) all.
create policy followups_select on public.lead_followups
  for select to authenticated using (
    public.is_admin()
    or exists (
      select 1 from public.leads l
      where l.id = lead_id and (l.assigned_agent_id = auth.uid() or l.created_by = auth.uid())
    )
  );

create policy followups_insert on public.lead_followups
  for insert to authenticated with check (
    exists (
      select 1 from public.leads l
      where l.id = lead_id
        and (public.is_admin() or l.assigned_agent_id = auth.uid() or l.created_by = auth.uid())
    )
  );

create policy followups_update on public.lead_followups
  for update to authenticated using (
    public.is_admin()
    or exists (
      select 1 from public.leads l
      where l.id = lead_id and (l.assigned_agent_id = auth.uid() or l.created_by = auth.uid())
    )
  );

create policy followups_delete on public.lead_followups
  for delete to authenticated using (
    public.is_admin()
    or exists (
      select 1 from public.leads l
      where l.id = lead_id and (l.assigned_agent_id = auth.uid() or l.created_by = auth.uid())
    )
  );
