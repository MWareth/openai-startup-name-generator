# Estate CRM

A lead, deal and target-management CRM for a real-estate sales team. Built with
**Next.js 14 (App Router)** and **Supabase** (Postgres + Auth).

## What it does

- **Accounts & roles** — every agent logs in with email/password. One owner
  **admin**; everyone else is an **agent** (junior or senior).
- **Leads** — capture contact, source, property interest and budget; qualify as
  **hot / warm / cold**; move through a pipeline (new → active → viewing →
  negotiation → won/lost).
- **Activity timeline** — dated notes typed as **meeting, call, viewing, call
  update, or note**.
- **Reassignment** — an agent can *suggest* handing a lead to a colleague; only
  the **admin** performs the actual reassignment (enforced in the database).
- **Targets & incentives** — each agent has a big target measured in **total
  sales value (AED)**. Closed deals count toward it with live progress bars.
  The admin configures **incentive tiers** (threshold → reward) and agents see
  how close they are to the next reward.
- **Commission** — on each deal the referral cut comes **off the top**, then the
  remainder splits by seniority: **junior 50/50**, **senior 55/45**
  (agent/company). The split is computed and stored per deal.

## Setup

### 1. Create a Supabase project
At [supabase.com](https://supabase.com), create a project. Then in
**SQL Editor**, paste and run [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
This creates all tables, the role/commission model, triggers, and row-level
security policies.

### 2. Configure environment
```bash
cd crm
cp .env.local.example .env.local
```
Fill in from Supabase **Project Settings → API**:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (secret — server only, used to create agent logins)

### 3. Install & run
```bash
npm install
npm run dev
```
Open http://localhost:3000.

### 4. Create the first admin
1. In the Supabase dashboard → **Authentication → Users → Add user**, create a
   user with your email and a password (tick *Auto Confirm*).
2. In **SQL Editor**, promote that user to admin:
   ```sql
   update public.profiles set role = 'admin', full_name = 'Your Name'
   where email = 'you@example.com';
   ```
3. Sign in. From **Admin → Add agent** you can now create the rest of the team —
   their accounts, seniority, targets and incentive tiers.

## Notes

- Email confirmation is bypassed for admin-created agents. If you enable signups
  directly, turn off "Confirm email" in Supabase Auth settings or wire up an
  email provider.
- Targets count deal **value**; the per-agent **commission** is tracked
  separately (shown on the dashboard and deal log) for earnings visibility.
