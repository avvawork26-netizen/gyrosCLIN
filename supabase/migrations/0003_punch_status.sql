-- Mr Gyros Time Clock — migration: lunch status on punches
-- Safe to run on an existing database. Idempotent (re-runnable).
-- Run this in the Supabase SQL editor on your live project.

-- An open punch is either 'active' (working) or 'lunch' (on break). The clock
-- never stops and no time is deducted — this is a status flag only.
alter table public.punches
  add column if not exists status text not null default 'active'
  constraint punches_status_check check (status in ('active', 'lunch'));
