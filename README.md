# Hotel & Spa CRM

A simple CRM for hotel and spa account managers. Track accounts, deals, activities, tasks, bookings, and reports — with role-based access for admin, manager, and rep users.

## Features

- **Accounts & Contacts** — Manage hotel/spa properties and decision-makers
- **Deals Pipeline** — Kanban board with stages from lead to won/lost
- **Activities** — Log calls, emails, meetings, and notes
- **Tasks** — Follow-up reminders with due dates and assignments
- **Bookings & Contracts** — Track agreements linked to accounts
- **Reports** — Pipeline, activity, and revenue charts
- **Team Management** — Admin can invite users and assign roles

## Tech Stack

- [Next.js 15](https://nextjs.org/) (App Router)
- [Supabase](https://supabase.com/) (Auth, PostgreSQL, RLS)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [Recharts](https://recharts.org/) for reporting

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com/) project

### 1. Clone and install

```bash
cd hotel-spa-crm
npm install
```

### 2. Configure environment

Copy the example env file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run database migration

In your Supabase dashboard, go to **SQL Editor** and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Create your organization on the signup page — the first user becomes admin.

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full org data, invite users, manage roles |
| **Manager** | All accounts/deals, reassign owners, view reports |
| **Rep** | Own accounts/deals, org-wide read for reporting |

## Deploy

### Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com/)
3. Add environment variables from `.env.local.example`
4. Deploy

### Supabase

Use the hosted Supabase project for production. Run the migration SQL in the Supabase SQL Editor.

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login, signup
│   └── (app)/           # Protected CRM pages
├── components/          # UI and domain components
└── lib/
    ├── actions/         # Server actions
    ├── supabase/        # Supabase clients
    └── types.ts         # Shared types
supabase/
└── migrations/          # SQL schema + RLS
```

## License

MIT
