-- Mr Gyros Time Clock — migration: multi-location support
-- Safe to run on an existing database. Idempotent (re-runnable).
-- Run this in the Supabase SQL editor on your live project.

-- ----------------------------------------------------------------------------
-- 1. Locations table
-- ----------------------------------------------------------------------------

create table if not exists public.locations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  created_at  timestamptz not null default now(),
  constraint locations_slug_format check (slug ~ '^[a-z0-9-]+$'),
  constraint locations_name_not_blank check (length(btrim(name)) > 0)
);

-- Seed the two locations (no-op if they already exist).
insert into public.locations (name, slug)
values
  ('Mr Gyros Colonial', 'colonial'),
  ('Mr Gyros OBT', 'obt')
on conflict (slug) do nothing;

-- ----------------------------------------------------------------------------
-- 2. Add location_id to the data tables (nullable first, for backfill)
-- ----------------------------------------------------------------------------

alter table public.employees
  add column if not exists location_id uuid references public.locations (id);
alter table public.punches
  add column if not exists location_id uuid references public.locations (id);
alter table public.schedules
  add column if not exists location_id uuid references public.locations (id);

-- ----------------------------------------------------------------------------
-- 3. Migrate existing rows to the Colonial location
-- ----------------------------------------------------------------------------

update public.employees
  set location_id = (select id from public.locations where slug = 'colonial')
  where location_id is null;
update public.punches
  set location_id = (select id from public.locations where slug = 'colonial')
  where location_id is null;
update public.schedules
  set location_id = (select id from public.locations where slug = 'colonial')
  where location_id is null;

-- ----------------------------------------------------------------------------
-- 4. Enforce NOT NULL now that every row has a location
-- ----------------------------------------------------------------------------

alter table public.employees  alter column location_id set not null;
alter table public.punches    alter column location_id set not null;
alter table public.schedules  alter column location_id set not null;

-- ----------------------------------------------------------------------------
-- 5. Indexes for location-filtered queries
-- ----------------------------------------------------------------------------

create index if not exists employees_location_idx  on public.employees (location_id);
create index if not exists punches_location_idx    on public.punches (location_id);
create index if not exists schedules_location_idx  on public.schedules (location_id);

-- ----------------------------------------------------------------------------
-- 6. Row Level Security for locations (admins read/write; anon uses service role)
-- ----------------------------------------------------------------------------

alter table public.locations enable row level security;
drop policy if exists "admin all locations" on public.locations;
create policy "admin all locations" on public.locations
  for all to authenticated using (true) with check (true);
