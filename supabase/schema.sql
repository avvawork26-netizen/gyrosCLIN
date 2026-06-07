-- Mr Gyros Time Clock — database schema
-- Run this in the Supabase SQL editor (or via the CLI) on a fresh project.
-- All timestamps are timestamptz (UTC). The app renders them in America/New_York.

-- ----------------------------------------------------------------------------
-- Tables
-- ----------------------------------------------------------------------------

-- Restaurant locations. One admin login manages all of them.
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

create table if not exists public.employees (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  pin           char(4) not null unique,
  hourly_rate   numeric(8, 2) not null default 0 check (hourly_rate >= 0),
  is_active     boolean not null default true,
  location_id   uuid not null references public.locations (id),
  -- Lockout bookkeeping for the public PIN screen (5 fails -> 5 min lock).
  failed_attempts integer not null default 0,
  locked_until    timestamptz,
  created_at    timestamptz not null default now(),
  constraint employees_pin_format check (pin ~ '^[0-9]{4}$'),
  constraint employees_name_not_blank check (length(btrim(name)) > 0)
);

create table if not exists public.punches (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.employees (id) on delete cascade,
  location_id   uuid not null references public.locations (id),
  clock_in      timestamptz not null,
  clock_out     timestamptz,
  note          text,
  -- Open punches can be 'active' (working) or 'lunch' (on break). The clock
  -- never stops; this is a status flag only, no time is deducted.
  status        text not null default 'active' check (status in ('active', 'lunch')),
  created_at    timestamptz not null default now(),
  constraint punches_order check (clock_out is null or clock_out >= clock_in)
);

create table if not exists public.schedules (
  id            uuid primary key default gen_random_uuid(),
  employee_id   uuid not null references public.employees (id) on delete cascade,
  location_id   uuid not null references public.locations (id),
  day_date      date not null,
  start_time    time not null,
  end_time      time not null,
  created_at    timestamptz not null default now(),
  constraint schedules_order check (end_time > start_time)
);

-- ----------------------------------------------------------------------------
-- Indexes
-- ----------------------------------------------------------------------------

create index if not exists punches_employee_clock_in_idx
  on public.punches (employee_id, clock_in desc);

-- Fast lookup of still-open punches (missed clock-outs, "who is in now").
create index if not exists punches_open_idx
  on public.punches (employee_id)
  where clock_out is null;

create index if not exists schedules_employee_day_idx
  on public.schedules (employee_id, day_date);

create index if not exists schedules_day_idx
  on public.schedules (day_date);

create index if not exists employees_active_idx
  on public.employees (is_active);

-- Location-filtered queries (the admin location switcher).
create index if not exists employees_location_idx on public.employees (location_id);
create index if not exists punches_location_idx   on public.punches (location_id);
create index if not exists schedules_location_idx on public.schedules (location_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- The public clock-in screen never touches these tables directly: it goes
-- through server API routes that use the service-role key (which bypasses
-- RLS). So the only client-side role that needs policy access is the
-- authenticated admin. Anon gets nothing.
-- ----------------------------------------------------------------------------

alter table public.locations enable row level security;
alter table public.employees enable row level security;
alter table public.punches  enable row level security;
alter table public.schedules enable row level security;

-- Drop-and-recreate so this file is safely re-runnable.
drop policy if exists "admin all locations"  on public.locations;
drop policy if exists "admin all employees" on public.employees;
drop policy if exists "admin all punches"   on public.punches;
drop policy if exists "admin all schedules" on public.schedules;

create policy "admin all locations" on public.locations
  for all to authenticated using (true) with check (true);

create policy "admin all employees" on public.employees
  for all to authenticated using (true) with check (true);

create policy "admin all punches" on public.punches
  for all to authenticated using (true) with check (true);

create policy "admin all schedules" on public.schedules
  for all to authenticated using (true) with check (true);
