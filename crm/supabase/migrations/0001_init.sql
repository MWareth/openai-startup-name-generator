-- ============================================================================
-- Estate CRM — initial schema
-- Run this in the Supabase SQL editor (or via the Supabase CLI) once per project.
-- ============================================================================

-- ---------- Enums -----------------------------------------------------------
create type user_role        as enum ('admin', 'agent');
create type seniority_level  as enum ('junior', 'senior');
create type lead_qual        as enum ('hot', 'warm', 'cold');
create type lead_status      as enum ('new', 'active', 'viewing', 'negotiation', 'won', 'lost');
create type activity_type    as enum ('meeting', 'call', 'viewing', 'call_update', 'note');

-- ---------- Profiles --------------------------------------------------------
-- One row per auth user. Created automatically by a trigger on signup.
create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  full_name   text not null default '',
  email       text,
  role        user_role not null default 'agent',
  seniority   seniority_level not null default 'junior',
  created_at  timestamptz not null default now()
);

-- ---------- Leads -----------------------------------------------------------
create table public.leads (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  phone              text,
  email              text,
  source             text,
  property_interest  text,
  budget             numeric,
  qualification      lead_qual   not null default 'warm',
  status             lead_status not null default 'new',
  assigned_agent_id  uuid references public.profiles(id),
  suggested_agent_id uuid references public.profiles(id),
  created_by         uuid references public.profiles(id),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index leads_assigned_idx  on public.leads(assigned_agent_id);
create index leads_created_by_idx on public.leads(created_by);

-- ---------- Lead activities (dated notes) -----------------------------------
create table public.lead_activities (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references public.leads(id) on delete cascade,
  agent_id     uuid references public.profiles(id),
  type         activity_type not null default 'note',
  occurred_on  date not null default current_date,
  body         text not null default '',
  created_at   timestamptz not null default now()
);
create index lead_activities_lead_idx on public.lead_activities(lead_id);

-- ---------- Deals -----------------------------------------------------------
-- A closed deal. deal_value counts toward the agent's target.
-- Commission split is computed in the app and stored here for the record.
create table public.deals (
  id                 uuid primary key default gen_random_uuid(),
  lead_id            uuid references public.leads(id) on delete set null,
  agent_id           uuid not null references public.profiles(id),
  property           text,
  deal_value         numeric not null default 0,
  gross_commission   numeric not null default 0,
  referral_party     text,
  referral_amount    numeric not null default 0,
  agent_split_pct    numeric not null default 0.5,
  agent_commission   numeric not null default 0,
  company_commission numeric not null default 0,
  closed_on          date not null default current_date,
  created_by         uuid references public.profiles(id),
  created_at         timestamptz not null default now()
);
create index deals_agent_idx on public.deals(agent_id);

-- ---------- Targets ---------------------------------------------------------
create table public.targets (
  id            uuid primary key default gen_random_uuid(),
  agent_id      uuid not null references public.profiles(id) on delete cascade,
  name          text not null default 'Target',
  target_amount numeric not null default 0,
  period_start  date,
  period_end    date,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);
create index targets_agent_idx on public.targets(agent_id);

-- ---------- Incentive tiers -------------------------------------------------
create table public.incentive_tiers (
  id               uuid primary key default gen_random_uuid(),
  target_id        uuid not null references public.targets(id) on delete cascade,
  threshold_amount numeric not null default 0,
  reward_label     text not null default '',
  reward_amount    numeric not null default 0,
  sort_order       int not null default 0
);
create index incentive_tiers_target_idx on public.incentive_tiers(target_id);

-- ============================================================================
-- Helper functions
-- ============================================================================

-- Is the current user an admin? SECURITY DEFINER so it can read profiles
-- without tripping the profiles RLS policy (avoids recursion).
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Create a profile row automatically whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Only admins may reassign a lead (change assigned_agent_id). Agents can still
-- set suggested_agent_id to propose a reassignment. Also keeps updated_at fresh.
create or replace function public.guard_lead_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.assigned_agent_id is distinct from old.assigned_agent_id)
     and not public.is_admin() then
    raise exception 'Only an admin can reassign a lead';
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_guard_lead_update on public.leads;
create trigger trg_guard_lead_update
  before update on public.leads
  for each row execute function public.guard_lead_update();

-- ============================================================================
-- Row Level Security
-- ============================================================================
alter table public.profiles        enable row level security;
alter table public.leads           enable row level security;
alter table public.lead_activities enable row level security;
alter table public.deals           enable row level security;
alter table public.targets         enable row level security;
alter table public.incentive_tiers enable row level security;

-- ----- profiles -------------------------------------------------------------
-- Everyone authenticated can read profiles (needed to pick an agent to suggest).
create policy profiles_select on public.profiles
  for select to authenticated using (true);
-- Only admins manage profiles (role/seniority changes). App also uses the
-- service-role key for agent creation, which bypasses RLS.
create policy profiles_admin_write on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----- leads ----------------------------------------------------------------
create policy leads_select on public.leads
  for select to authenticated using (
    public.is_admin()
    or assigned_agent_id = auth.uid()
    or created_by = auth.uid()
    or suggested_agent_id = auth.uid()
  );
create policy leads_insert on public.leads
  for insert to authenticated with check (created_by = auth.uid() or public.is_admin());
create policy leads_update on public.leads
  for update to authenticated using (
    public.is_admin()
    or assigned_agent_id = auth.uid()
    or created_by = auth.uid()
  );
create policy leads_delete on public.leads
  for delete to authenticated using (public.is_admin());

-- ----- lead_activities ------------------------------------------------------
create policy activities_select on public.lead_activities
  for select to authenticated using (
    public.is_admin()
    or exists (
      select 1 from public.leads l
      where l.id = lead_id
        and (l.assigned_agent_id = auth.uid() or l.created_by = auth.uid())
    )
  );
create policy activities_insert on public.lead_activities
  for insert to authenticated with check (
    agent_id = auth.uid()
    and exists (
      select 1 from public.leads l
      where l.id = lead_id
        and (public.is_admin() or l.assigned_agent_id = auth.uid() or l.created_by = auth.uid())
    )
  );
create policy activities_delete on public.lead_activities
  for delete to authenticated using (public.is_admin() or agent_id = auth.uid());

-- ----- deals ----------------------------------------------------------------
create policy deals_select on public.deals
  for select to authenticated using (public.is_admin() or agent_id = auth.uid());
create policy deals_insert on public.deals
  for insert to authenticated with check (public.is_admin() or agent_id = auth.uid());
create policy deals_update on public.deals
  for update to authenticated using (public.is_admin() or agent_id = auth.uid());
create policy deals_delete on public.deals
  for delete to authenticated using (public.is_admin() or agent_id = auth.uid());

-- ----- targets --------------------------------------------------------------
create policy targets_select on public.targets
  for select to authenticated using (public.is_admin() or agent_id = auth.uid());
create policy targets_admin_write on public.targets
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----- incentive_tiers ------------------------------------------------------
create policy tiers_select on public.incentive_tiers
  for select to authenticated using (
    public.is_admin()
    or exists (select 1 from public.targets t where t.id = target_id and t.agent_id = auth.uid())
  );
create policy tiers_admin_write on public.incentive_tiers
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
