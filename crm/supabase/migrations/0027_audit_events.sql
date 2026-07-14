-- ============================================================================
-- 0027 — Audit events: an automatic per-user record of what each person did on
-- the CRM, beyond the calls/meetings/viewings/notes already in lead_activities.
-- Captures status & qualification changes, follow-ups set & completed, and
-- contact-info edits — so the Activity Log and KPI evidence can be built from
-- real actions. Inserted server-side (service role). Run AFTER 0001. Idempotent.
-- ============================================================================

create table if not exists public.audit_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete set null,  -- who did it
  action     text not null,          -- status_change | qual_change | followup_set | followup_done | contact_edit
  lead_id    uuid references public.leads(id) on delete cascade,
  detail     text,                   -- human-readable summary, e.g. "New → Contacted"
  created_at timestamptz not null default now()
);

create index if not exists audit_events_user_idx on public.audit_events(user_id, created_at desc);
create index if not exists audit_events_lead_idx on public.audit_events(lead_id);

alter table public.audit_events enable row level security;

-- Only management can read; inserts happen with the service-role key server-side.
drop policy if exists audit_events_select on public.audit_events;
create policy audit_events_select on public.audit_events
  for select to authenticated using (public.is_admin());
