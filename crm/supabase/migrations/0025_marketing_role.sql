-- ============================================================================
-- 0025 — "Marketing" role: feeds & triages leads, but sees no money.
-- ----------------------------------------------------------------------------
-- Marketing can see ALL leads, add notes, qualify (hot/warm/cold), route to the
-- pool / admin / any agent, and flag fakes — but has no access to deals,
-- commission, targets, etc. (enforced in the app). This migration grants the
-- lead-level database access. Run in the Supabase SQL editor AFTER 0001.
-- Idempotent.
-- ============================================================================

-- Add 'marketing' to the user_role enum (run this first / on its own if the
-- editor complains about using a new enum value in the same transaction).
alter type public.user_role add value if not exists 'marketing';

create or replace function public.is_marketing()
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'marketing');
$$;

-- Leads: marketing can see every lead and update (assign/qualify/flag) any lead.
drop policy if exists leads_select on public.leads;
create policy leads_select on public.leads for select to authenticated using (
  public.is_admin()
  or public.is_marketing()
  or assigned_agent_id = auth.uid()
  or created_by = auth.uid()
  or suggested_agent_id = auth.uid()
);
drop policy if exists leads_update on public.leads;
create policy leads_update on public.leads for update to authenticated using (
  public.is_admin()
  or public.is_marketing()
  or assigned_agent_id = auth.uid()
  or created_by = auth.uid()
);

-- Activities: marketing can see and add notes on any lead.
drop policy if exists activities_select on public.lead_activities;
create policy activities_select on public.lead_activities for select to authenticated using (
  public.is_admin()
  or public.is_marketing()
  or exists (
    select 1 from public.leads l
    where l.id = lead_id and (l.assigned_agent_id = auth.uid() or l.created_by = auth.uid())
  )
);
drop policy if exists activities_insert on public.lead_activities;
create policy activities_insert on public.lead_activities for insert to authenticated with check (
  agent_id = auth.uid()
  and (
    public.is_admin()
    or public.is_marketing()
    or exists (
      select 1 from public.leads l
      where l.id = lead_id and (l.assigned_agent_id = auth.uid() or l.created_by = auth.uid())
    )
  )
);

-- Reassignment guard: admins and marketing may change the assigned agent.
create or replace function public.guard_lead_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.assigned_agent_id is distinct from old.assigned_agent_id)
     and not (public.is_admin() or public.is_marketing()) then
    raise exception 'Only an admin can reassign a lead';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
