# Revson Services

> Paperwork runs itself while you run your shop.

A multi-tenant SaaS for small service businesses (barbershops, salons, auto shops, cafes).
Four Next.js 14 apps share one Supabase backend and one shared UI/logic package.

| App | Port | Role | What it does |
| --- | --- | --- | --- |
| `apps/marketing` | 3000 | public | Landing page, `/register`, `/login` (redirects by role) |
| `apps/super-admin` | 3001 | `super_admin` | Global dashboard, businesses CRUD, "View As Owner" impersonation, users, billing, seed/reset demo data |
| `apps/owner` | 3002 | `owner` | Overview, Team, Schedules, Pay & Payroll, Documents (Fine Print Killer), Hiring Lab, Reputation, Settings |
| `apps/employee` | 3003 | `employee` | Dashboard, Schedule, Pay stubs, Documents, Tasks, Profile |

Shared code lives in `packages/shared` (`@revson/shared`): types, pay math, formatters, Supabase browser client, and every UI primitive.

---

## Setup

### 1. Database schema
In the Supabase SQL editor, run the entire contents of [`supabase-schema.sql`](./supabase-schema.sql).
It creates all tables, the security-definer helper functions, row-level security policies, the `set_mrr` trigger, and the public `documents` storage bucket with its object policies.

### 2. Create the first super admin
Storage and tables are already handled by step 1. Now make yourself a super admin:

1. In **Authentication → Users → Add user**, create a user (email + password), and copy its UUID.
2. In the SQL editor, insert a matching profile (the bootstrap SQL is also included, commented, at the bottom of the schema file):

```sql
insert into public.profiles (id, email, role, name)
values ('PASTE-AUTH-USER-UUID', 'you@revson.services', 'super_admin', 'Founder');
```

Owner and employee accounts are created for you at runtime — owners via **Register** on the marketing site or **Add Business** in super-admin; employees via **Add Employee → Create login** in the owner app. All of those run server-side with the service-role key.

### 3. Environment variables
```bash
cp .env.example .env
```
Fill in:
- **Supabase** — `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
- **Anthropic** — `ANTHROPIC_API_KEY`. `CLAUDE_MODEL` defaults to `claude-sonnet-4-6`.
- **Stripe** — keys only for now (see [Billing](#billing)).
- **Portal URLs** — local defaults are prewired; set to your production domains on Vercel.
- **`NEXT_PUBLIC_COOKIE_DOMAIN`** — leave blank locally; in production set to your apex (e.g. `.revson.services`) so one session cookie is shared across all four subdomains.

The same `.env` is read by all four apps.

### 4. Install & run
```bash
npm install            # installs all workspaces
npm run dev            # runs all four apps together
```
Or run one at a time:
```bash
npm run dev:marketing    # :3000
npm run dev:super-admin  # :3001
npm run dev:owner        # :3002
npm run dev:employee     # :3003
```

### 5. Seed demo data
Log into super-admin (`:3001`) and click **Seed Demo Data**. This creates two businesses — Tony's Barber Shop (Pro) and Maple Auto (Starter) — each with employees, two pay periods, a week of shifts, a document with flagged clauses, a job post, a review, and tasks. **Delete All Data** removes every non–super-admin user and business. Every other screen is empty-state-first: nothing appears until you create it or seed it.

---

## Architecture notes

- **Auth & sessions** use `@supabase/ssr` with cookie-bound server clients. Each app has `lib/server.ts` exposing `serverSupabase()` (caller session), `supabaseAdmin()` (service role — server only, guard every call), and `requireRole()`. Middleware in each protected app checks the session and role and bounces users to the correct portal; `super_admin` passes every role guard.
- **Multi-tenancy** is enforced in the database. RLS helper functions (`app_role()`, `app_business_id()`, `app_employee_id()`, `is_super_admin()`, `owns_business()`) scope every table: owners see only their business, employees see only their own rows, super admins see everything.
- **Impersonation** — "View As Owner" links the super admin into the owner app with `?impersonate={businessId}`. The owner app's `BusinessProvider` honors it (persisted in `localStorage`) and shows a banner; because policies allow `super_admin` through, live data loads without any role switch.
- **Employee onboarding** — the `employees` table has no email column, so `Add Employee → Create login` synthesizes one (`name@team.revson.services`) or accepts a custom address. The owner-only `/api/invite-employee` route uses the service role to create the auth user + profile (`role = employee`, linked via `employee_id`) and returns temporary credentials to hand off. The same route re-issues a recovery link on resend.
- **Claude features** — Documents (lease/contract analysis from an uploaded PDF), Hiring Lab (job post + interview questions + offer blurb), and Reputation (review responses) call the Anthropic Messages API from server routes via `lib/claude.ts`, which requests strict JSON, strips code fences, and parses. Each returns a typed object the UI renders. All AI-assisted views carry a "not legal / tax / payroll advice" disclaimer.
- **Pay math** is centralized in `@revson/shared`: `regHours = min(total, 40)`, `otHours = max(total − 40, 0)`, `totalPay = reg·rate + ot·rate·1.5`. Date helpers (`mondayOf`, `addDays`, `isoDate`) operate on `Date` objects — wrap with `isoDate()` when storing or comparing week keys.
- **UI** — the components in `packages/shared/src/ui.tsx` are handwritten in the shadcn/ui style (not the CLI-generated components): `Button`, `Card`, `StatCard`, `Badge`, `Modal`, `Drawer`, `Table`, `EmptyState`, `Shell`, etc., themed through a Tailwind preset. Design language is "Premium Minimal" — white surfaces, indigo accent, cream background, `rounded-2xl`, `shadow-sm`, Inter.

## Billing

Stripe is wired as **environment keys only**. The super-admin Billing page reads MRR straight from the database — the `businesses.subscription` value drives `mrr` through the `set_mrr` trigger (`trial 0 / starter 49 / pro 149 / business 299`). Connecting Checkout, the customer portal, and webhooks to mutate `subscription` on real payments is the remaining integration **TODO**.

---

## Deploying to Vercel

Create **four** Vercel projects from this one repository, each with a different **Root Directory**:

| Project | Root Directory |
| --- | --- |
| revson-marketing | `apps/marketing` |
| revson-super-admin | `apps/super-admin` |
| revson-owner | `apps/owner` |
| revson-employee | `apps/employee` |

For each project:
1. Add every variable from `.env` (Supabase, Anthropic, Stripe, and the four `NEXT_PUBLIC_*_URL` values pointed at your production domains).
2. Set `NEXT_PUBLIC_COOKIE_DOMAIN` to your apex (e.g. `.revson.services`) on all four so the login session is shared across subdomains.
3. Map a subdomain per app (e.g. `www`, `admin`, `app`, `team`).

The monorepo uses npm workspaces; Vercel installs from the repo root and builds each app from its root directory. `next.config.js` in every app already lists `@revson/shared` under `transpilePackages`.
