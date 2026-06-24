# Deploying Estate CRM

This deploys the CRM in two parts: the **database** (Supabase) and the **app**
(Vercel). The CRM lives in this `crm/` folder and is fully self-contained — no
other content in the repository is built or deployed.

Estimated time: ~15 minutes.

---

## Part A — Database (Supabase)

### 1. Create the project
- Go to [supabase.com](https://supabase.com) → sign in → **New project**.
- Name it, set a strong **database password** (save it somewhere), and choose a
  region near your users (e.g. *Frankfurt* or *Mumbai* for the UAE).
- Click **Create** and wait ~2 minutes for it to provision.

### 2. Run the schema
- Left sidebar → **SQL Editor** → **New query**.
- Open [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql),
  copy the entire file, paste it into the editor, and click **Run**.
- You should see "Success. No rows returned." This creates every table, the
  role/commission model, triggers, and row-level security policies.

### 3. Copy your API keys
- Left sidebar → **Project Settings → API**. You need three values:

  | Supabase field | Used as |
  |---|---|
  | **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
  | **anon public** key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
  | **service_role** key (click to reveal — keep secret) | `SUPABASE_SERVICE_ROLE_KEY` |

### 4. Create your admin login
- **Authentication → Users → Add user** → enter your email + a password →
  tick **Auto Confirm User** → **Create user**.
- Back in **SQL Editor**, promote that user to admin (use your email):
  ```sql
  update public.profiles set role = 'admin', full_name = 'Your Name'
  where email = 'you@example.com';
  ```

---

## Part B — Host the app (Vercel)

### 5. Import the repository
- Go to [vercel.com](https://vercel.com) → sign in with GitHub.
- **Add New → Project** → import this repository.

### 6. Point Vercel at the `crm` folder  *(important)*
- On the configure screen, set **Root Directory** → `crm`.
- Framework Preset auto-detects **Next.js**. Leave the build/output settings at
  their defaults.
- Because the root directory is `crm`, Vercel builds *only* the CRM — nothing
  else in the repo is included in the deployment.

### 7. Add environment variables
Expand **Environment Variables** and add the three values from step 3:

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | your project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (secret) |

### 8. Deploy
- Click **Deploy**. After ~1–2 minutes you'll get a live URL like
  `your-crm.vercel.app`.
- Vercel deploys from the repository's **default branch** (`master`) and
  redeploys automatically on every push to it.

---

## Part C — Verify

1. Open the Vercel URL → you're redirected to **/login**.
2. Sign in with the admin email/password from step 4.
3. **Admin → Add agent** → create your team (sets each agent's seniority + login).
4. Set a target, add an incentive tier, and create a lead. You're live.

---

## Optional follow-ups

- **Agent password resets / emails:** connect an SMTP provider under Supabase
  **Authentication → settings** so agents can reset their own passwords. Until
  then, you create accounts and share a temporary password.
- **Custom domain:** add one (e.g. `crm.youragency.ae`) in Vercel →
  **Settings → Domains**.
- **Local development:** copy `.env.local.example` to `.env.local`, fill in the
  same three keys, then `npm install && npm run dev`.
