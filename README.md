# Hotel & Spa Client CRM

CRM for **hotel and spa account managers** to manage **their clients** — mainly companies (corporate, events, groups) and also individual guests.

## Who it’s for

You work **at** a hotel or spa. You manage client relationships, not other hotels.

## What you can do

- **Clients** — companies and individuals, with VIP flag, loyalty tier, and preferences
- **Contacts** — people at company clients (or guest details)
- **Offers & packages** — upsells, memberships, corporate packages (pipeline)
- **Activities** — calls, emails, meetings, notes
- **Tasks** — follow-ups and reminders
- **Bookings & stays** — stays, spa visits, events
- **Reports** — pipeline, activity, and booking overview
- **Team** — admin / manager / account manager roles

## Tech stack

- Next.js 15 + TypeScript + Tailwind
- Supabase (Auth, Postgres, RLS)
- Vercel hosting

## Setup

1. `npm install`
2. Copy `.env.local.example` → `.env.local` and add Supabase keys
3. In Supabase SQL Editor, run migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_signup_rpc.sql`
   - `supabase/migrations/003_client_focus.sql`
4. `npm run dev`

## Production checklist

- Site URL in Supabase Auth = your Vercel URL (e.g. `https://pospolu-spa-crm.vercel.app`)
- `NEXT_PUBLIC_SUPABASE_URL` = `https://YOUR-PROJECT.supabase.co` (no path, no quotes)
- Run all three SQL migrations

## License

MIT
