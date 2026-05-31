# Supabase setup

## 1. Create the project

Create a new Supabase project. From **Project Settings → API** copy:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (server only — keep secret)

Put these in `.env.local` (copy from `.env.example`) and in Netlify's
environment variables.

## 2. Create the schema

Open **SQL Editor**, paste the contents of [`schema.sql`](./schema.sql), and
run it. It is safe to re-run.

## 3. Create the admin login

Admins sign in with username + password. Supabase Auth uses email, so use a
real or internal email as the username.

**Dashboard → Authentication → Users → Add user**

- Email: e.g. `manager@mrgyros.local`
- Password: choose a strong one
- Tick **Auto Confirm User** so no email confirmation is needed.

Any confirmed auth user can access the admin panel. The 8-hour inactivity
timeout is enforced by the app middleware.

> Optional: turn off public sign-ups under **Authentication → Providers →
> Email** so only invited admins exist.

## 4. Timezone

Nothing to configure in the DB — everything is stored in UTC (`timestamptz`)
and the app renders in `America/New_York`.
