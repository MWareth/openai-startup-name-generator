-- ============================================================================
-- Estate CRM — master list of areas/communities and buildings/towers.
-- Gives lead & deal forms a PropSpace-style location autocomplete.
-- Run this in the Supabase SQL editor AFTER 0007.
-- ============================================================================

create table if not exists public.areas (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  city       text not null default 'Dubai',
  created_at timestamptz not null default now()
);

create table if not exists public.buildings (
  id         uuid primary key default gen_random_uuid(),
  area_id    uuid references public.areas(id) on delete set null,
  name       text not null,
  created_at timestamptz not null default now(),
  unique (area_id, name)
);
create index if not exists buildings_area_idx on public.buildings(area_id);

-- The community an enquiry relates to (free text, backed by the master list).
alter table public.leads add column if not exists community text;

-- ---------- Row Level Security ---------------------------------------------
alter table public.areas     enable row level security;
alter table public.buildings enable row level security;

-- Everyone signed in can read the master list (for autocomplete).
drop policy if exists areas_select on public.areas;
create policy areas_select on public.areas for select to authenticated using (true);

drop policy if exists buildings_select on public.buildings;
create policy buildings_select on public.buildings for select to authenticated using (true);

-- Only admins manage the master list.
drop policy if exists areas_admin_write on public.areas;
create policy areas_admin_write on public.areas
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists buildings_admin_write on public.buildings;
create policy buildings_admin_write on public.buildings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Seed: common Dubai communities ---------------------------------
-- A starter set so autocomplete is useful immediately. Run the DLD importer
-- (scripts/import_dld_areas.mjs) to load the full emirate.
insert into public.areas (name) values
  ('Downtown Dubai'), ('Business Bay'), ('Dubai Marina'), ('Jumeirah Beach Residence (JBR)'),
  ('Palm Jumeirah'), ('Jumeirah Lake Towers (JLT)'), ('Jumeirah Village Circle (JVC)'),
  ('Jumeirah Village Triangle (JVT)'), ('Jumeirah Golf Estates'), ('Arabian Ranches'),
  ('Arabian Ranches 2'), ('Arabian Ranches 3'), ('Emirates Hills'), ('The Meadows'),
  ('The Springs'), ('The Lakes'), ('The Greens'), ('The Views'), ('Dubai Hills Estate'),
  ('DAMAC Hills'), ('DAMAC Hills 2'), ('DAMAC Lagoons'), ('Town Square'), ('Tilal Al Ghaf'),
  ('The Valley'), ('Emaar South'), ('Dubai Creek Harbour'), ('Dubai Harbour'),
  ('Bluewaters Island'), ('City Walk'), ('Al Wasl'), ('Jumeirah'), ('Umm Suqeim'),
  ('Al Sufouh'), ('Al Barsha'), ('Al Barsha South'), ('Motor City'), ('Dubai Sports City'),
  ('Dubai Production City (IMPZ)'), ('Dubai Studio City'), ('Dubai Science Park'),
  ('Dubai Silicon Oasis'), ('International City'), ('Discovery Gardens'), ('Al Furjan'),
  ('Jebel Ali'), ('Dubai South'), ('Dubai Investment Park (DIP)'), ('Mudon'), ('Remraam'),
  ('Serena'), ('Mira'), ('Mirdif'), ('Nad Al Sheba'), ('Meydan / MBR City'),
  ('Sobha Hartland'), ('District One'), ('Al Quoz'), ('Al Qusais'), ('Deira'),
  ('Bur Dubai'), ('Al Karama'), ('Oud Metha'), ('Dubai Festival City'), ('Ras Al Khor'),
  ('Al Jaddaf'), ('DIFC'), ('Trade Centre'), ('Sheikh Zayed Road'), ('Za''abeel'),
  ('Palm Jebel Ali'), ('The World Islands'), ('Dubai Islands'), ('Al Mamzar'),
  ('Al Warqa'), ('Liwan'), ('Dubailand'), ('Majan'), ('Living Legends'),
  ('The Sustainable City'), ('Expo City Dubai'), ('Jumeirah Park'), ('Jumeirah Islands'),
  ('Jumeirah Heights')
on conflict (name) do nothing;
