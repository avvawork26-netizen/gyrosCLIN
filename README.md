# Mr Gyros Time Clock

A clock-in / clock-out web app for a small fast food restaurant. Public PIN
clock screen for staff, authenticated admin panel for management. Built with
Next.js + Supabase, deployable on Netlify, installable as a PWA on a counter
tablet.

## Stack

- **Next.js 14** (App Router)
- **Supabase** — Postgres + Auth
- **Netlify** — deploy (`netlify.toml` + Next plugin)
- **PWA** — `public/manifest.json`, installable to a home screen

All timestamps are stored as `timestamptz` (UTC) and displayed in
**America/New_York**.

## Features

- **Public clock screen** (`/`) — active-staff name list, 4-digit PIN entry,
  current status, this week's schedule and hours, clock in/out, multiple
  punches per day. Wrong PIN locks an employee out for 5 minutes after 5
  failed attempts.
- **Admin** (`/admin`, login at `/admin/login`):
  - Dashboard — who's clocked in now, flagged open punches from prior days.
  - Employees — add/edit/deactivate, per-employee hourly rate, auto-generated
    unique PIN shown once on creation, lockout clearing.
  - Punches — view/edit any clock-in/out, notes, manually close missed
    punches, add or delete punches.
  - Schedule — weekly view, multiple shifts per employee per day.
  - Reports — hours per employee by date range, weekly overtime flag (>40h),
    estimated labor cost.
- Admin sessions time out after 8 hours of inactivity.
- Employees only ever see their own data (the public screen returns nothing
  but names; everything else is gated behind the PIN, server-side).

## Setup

1. **Install**

   ```bash
   npm install
   ```

2. **Supabase** — follow [`supabase/README.md`](./supabase/README.md): create a
   project, run [`supabase/schema.sql`](./supabase/schema.sql), add an admin
   user.

3. **Environment** — copy `.env.example` to `.env.local` and fill in:

   ```
   NEXT_PUBLIC_SUPABASE_URL
   NEXT_PUBLIC_SUPABASE_ANON_KEY
   SUPABASE_SERVICE_ROLE_KEY   # server only — never exposed to the browser
   ```

4. **Run**

   ```bash
   npm run dev      # http://localhost:3000
   ```

## How auth works

- **Employees** never log in. The public screen calls server API routes that
  use the service-role key (bypassing RLS) to validate the PIN. A correct PIN
  returns a short-lived signed token so the employee can clock in/out without
  retyping it. The browser never receives any PIN or rate.
- **Admins** sign in with username (email) + password via Supabase Auth.
  `src/middleware.ts` guards `/admin/*` and enforces the 8-hour inactivity
  timeout. Admin writes go through server actions using the authenticated
  session (Row Level Security allows the `authenticated` role).

## Deploy to Netlify

1. Connect the repo. `netlify.toml` sets the build command and the Next.js
   plugin.
2. Add the three environment variables above in **Site settings → Environment
   variables**.
3. Deploy.

## Icons

PWA icons are generated (flat, no dependencies):

```bash
node scripts/gen-icons.js
```
