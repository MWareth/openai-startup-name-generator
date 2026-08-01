# Bullish Team CRM — Bridges & Allies

A lead, deal, target and content-management CRM for a Dubai real-estate sales
team, built with **Next.js 14 (App Router)** and **Supabase** (Postgres + Auth +
Storage).

The application lives in [`crm/`](crm/). The repository root still contains the
Next.js 12 demo this was originally forked from (`pages/`, `public/`) — that
code is unused and kept only so the fork's history stays intact.

---

## Contents

- [Repository layout](#repository-layout)
- [Tech stack](#tech-stack)
- [Features](#features)
- [Roles and permissions](#roles-and-permissions)
- [Data model](#data-model)
- [Running it locally](#running-it-locally)
- [Environment variables](#environment-variables)
- [Database migrations](#database-migrations)
- [Deployment](#deployment)
- [Scheduled jobs](#scheduled-jobs)
- [Email and calendar invites](#email-and-calendar-invites)
- [Backups](#backups)
- [Security notes](#security-notes)
- [Troubleshooting](#troubleshooting)
- [Conventions](#conventions)

---

## Repository layout

```
crm/                          the application — paths below are relative to it
  app/
    (app)/                    signed-in pages (share the sidebar layout)
      dashboard/              agent home: to-do, follow-up calendar, stats
      leads/                  the lead book, lead detail, import, paste-to-create
      deals/                  closed deals
      targets/                sales targets and incentive tiers
      commission/             commission collection workflow
      leaderboard/            team ranking
      cold-calls/             cold-call and follow-up contest
      teams/                  team structure and lead-routing rules
      marketing-report/       campaign performance and lead quality
      one-on-one/             per-agent 1:1 review pack
      reviews/                KPI scorecards
      activity/               full audit log
      content/                Content Studio — scripts, videos, avatar recording
      training/               quizzes and training material
      onboarding/             new-joiner programme
      projects/               developments and project assets
      proposal/               client proposal builder
      presence/               who is online
      notifications/          in-app bell
      profile/                own profile, theme, push devices
      admin/                  owner-only settings
    api/
      cron/backup             nightly snapshot → Storage and/or GitHub
      cron/followup-reminders morning push of what's due
      cron/lead-sla           20-minute first-response SLA nudges
      cron/purge-spam         deletes spam leads a week after flagging
      followups/[id]/ics      one follow-up as a calendar event
      leads/intake            inbound lead webhook (website, Meta, portals)
      push/*                  web-push subscription management
      sync-projects           refreshes the project/developer list
      heartbeat               presence ping
  components/                 shared client components
  lib/                        server helpers (see below)
  supabase/migrations/        numbered SQL migrations, run by hand
  public/                     icons, logo, service worker
```

### Key modules in `lib/`

| File | Responsibility |
| --- | --- |
| `auth.js` | Session loading and role predicates (`hasAdminAccess`, `hasStaffAccess`, `canRouteLeads`, …) |
| `db.js` | `writeTolerant` — retries a write with unknown columns dropped, so the app survives an un-run migration |
| `format.js` | Shared labels (roles, statuses, qualifications) and formatting helpers |
| `leadOrigin.js` | Lead origin definitions (campaign / follow-up / cold call / other) |
| `commission.js` | Referral cut and seniority split maths |
| `routing.js` | Picks the right agent for an incoming lead |
| `notify.js` | In-app bell + email + push fan-out |
| `email.js` | Transactional email via Resend or SMTP |
| `ics.js`, `calendarLinks.js`, `followupInvite.js` | Calendar invitations for follow-ups |
| `push.js` | Web push (VAPID) |
| `audit.js` | Audit events and KPI aggregation |
| `content.js`, `heygen.js` | Content Studio script generation and avatar video |
| `backupGithub.js` | Commits database snapshots to a private GitHub repo |

---

## Tech stack

- **Next.js 14.2** — App Router, React 18, Server Actions
- **Supabase** — Postgres, Auth, Storage, Row-Level Security
- **Vercel** — hosting and cron
- **nodemailer** (SMTP) or **Resend** (HTTP API) for email
- **web-push** for phone notifications
- Plain CSS in `app/globals.css` — no UI framework

---

## Features

### Leads
- **Recent Leads** holds the whole book. **Follow Ups** and **Cold Leads** are
  the same list filtered by lead origin, not separate stores.
- **Origin** (🌐 campaign · 🔁 follow-up · 📞 cold call · 📋 other) records *who
  generated the lead*, set at creation or inline from the list. `source` remains
  a free-text channel name.
- Duplicate detection on phone and email across the whole database, reporting
  who the existing lead belongs to.
- Bulk **import** from a spreadsheet, and **paste-to-create** from a message.
- **Fake / spam flagging** hides a lead from the working list immediately, keeps
  it counted on the marketing report, and deletes it a week later.
- Filters on name, agent, project, type, bedrooms, qualification, status and
  budget; newest-first by default.

### Activity and follow-ups
- Timeline of calls, meetings, viewings, notes and status changes, with optional
  voice dictation.
- Scheduling a follow-up emails the agent a **calendar invitation**; completing
  it — or simply logging any activity — sends a cancellation, so nothing stale
  is left in the calendar.
- 20-minute first-response SLA with automatic nudges.

### Deals, targets and commission
- Deals record value, developer, project and closing date.
- Targets are measured in total sales value (AED), with live progress and
  admin-configured incentive tiers.
- Commission takes the referral cut off the top, then splits by seniority
  (junior 50/50, senior 55/45 agent/company), stored per deal.

### Reporting
- **Marketing report** — campaign-only funnel (leads in, contacted, response
  time, meetings, won/lost) by day and by source, plus a junk-rate counter that
  covers *all* sources.
- **1:1 report** — per-agent activity, response speed, lead book and deals, with
  auto-generated talking points.
- **KPI scorecards** and a full **audit log**.

### Content Studio
- Upload a project brochure, get a ready-to-film agent script in any language.
- **Avatar Recording Studio** — record in the browser with a teleprompter over
  the camera; the take uploads straight to private Storage.

### Team
- Cold-call and follow-up contest, leaderboard, training quizzes, a six-week
  onboarding programme, and presence tracking.
- Per-member **theme** (light / dark / blue) stored on the profile.

---

## Roles and permissions

| Role | Sees |
| --- | --- |
| `agent` | Own leads, own targets, team leaderboard, training |
| `marketing` | Marketing report and Content Studio; no commission figures |
| `support` | All leads and routing; no money |
| `director`, `c_suite` | All leads, reports, commission |
| `admin` | Everything, plus the Admin page (owner) |

Permissions are enforced **in the database** through Row-Level Security, not
only in the UI. The helpers in `lib/auth.js` mirror those rules for rendering.

---

## Data model

Core tables — see `supabase/migrations/0001_init.sql` for the full definition:

- **`profiles`** — one row per user, mirroring `auth.users`; role, seniority,
  team, avatar, theme.
- **`leads`** — contact details, `source`, `origin`, qualification, status,
  budget, property type, assigned agent, `is_fake`, SLA timestamps.
- **`lead_activities`** — the timeline; typed rows against a lead.
- **`lead_followups`** — scheduled follow-ups (`due_on`, optional `due_at`,
  `done`). `leads.next_follow_up` mirrors the earliest pending one.
- **`deals`** — closed business and the computed commission split.
- **`targets`**, **`incentive_tiers`** — sales goals and rewards.
- **`notifications`** — the bell, with `requires_action` / `resolved_at`.
- **`audit_events`** — who did what; feeds the KPI and 1:1 reports.
- **`spam_archive`** — anonymous tally of purged spam leads (source and dates
  only, no contact details) so historical junk rates stay accurate.

---

## Running it locally

```bash
cd crm
npm install
cp .env.local.example .env.local   # then fill it in
npm run dev                        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`. There is no test or lint setup.

A Supabase project is required — the app will not start usefully without at
least `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`SUPABASE_SERVICE_ROLE_KEY`.

---

## Environment variables

Set these in Vercel → Settings → Environment Variables, and in `.env.local` for
local development. **Environment variables only take effect on a new
deployment — redeploy after changing any of them.**

### Required

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key — server only, never expose |
| `NEXT_PUBLIC_APP_URL` | Base URL for links in emails. **Origin only** — no path, no trailing slash |

### Email — one of the two

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key. Takes precedence when set |
| `SMTP_HOST` | e.g. `smtp.office365.com`, `smtp.gmail.com` |
| `SMTP_PORT` | `587` (STARTTLS) or `465` (SSL) |
| `SMTP_USER`, `SMTP_PASS` | Mailbox and app password |
| `EMAIL_FROM` | `Bridges & Allies <crm@example.com>` |

### Optional

| Variable | Purpose |
| --- | --- |
| `CRON_SECRET` | Bearer token protecting the `/api/cron/*` routes |
| `LEAD_INTAKE_TOKEN` | Shared secret for the inbound lead webhook |
| `ANTHROPIC_API_KEY` | Content Studio script generation |
| `HEYGEN_API_KEY` | Avatar video generation |
| `VAPID_PRIVATE_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_SUBJECT` | Web push |
| `BACKUP_GITHUB_TOKEN`, `BACKUP_GITHUB_REPO`, `BACKUP_GITHUB_BRANCH`, `BACKUP_GITHUB_PATH` | GitHub backup destination |

---

## Database migrations

Migrations are plain SQL in `crm/supabase/migrations/`, applied **by hand** in
the Supabase SQL Editor, in numerical order. Every file is **idempotent** — safe
to re-run if you lose track of what has been applied.

The application is deliberately tolerant of un-run migrations: `writeTolerant`
drops unknown columns and retries, and pages fall back rather than crashing.
Where a missing migration would change what a number *means*, the UI says so
instead of quietly showing a wrong value.

To check what is applied:

```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'leads';
```

Recent migrations:

| File | Adds |
| --- | --- |
| `0035_backups_bucket` | Private `backups` Storage bucket |
| `0036_push_device_info` | Device labels for push subscriptions |
| `0037_fake_leads` | `leads.is_fake` and flag metadata |
| `0038_user_theme` | `profiles.theme` (light / dark / blue) |
| `0039_spam_purge` | `spam_archive` table and `purge_old_spam_leads()` |
| `0040_lead_origin` | `leads.origin`, backfilled from `source` |
| `0041_avatar_recordings` | Private `avatar-recordings` bucket and columns |

---

## Deployment

Hosted on **Vercel**, deployed automatically from `master`. The project root is
`crm/`, region `bom1` (Mumbai — closest to Dubai).

To roll back: Vercel → Deployments → pick a previous build → **Promote to
Production**.

See [`crm/DEPLOY.md`](crm/DEPLOY.md) for the first-time setup walkthrough.

---

## Scheduled jobs

Defined in [`crm/vercel.json`](crm/vercel.json). All times UTC.

| Schedule | Route | What it does |
| --- | --- | --- |
| `0 1 * * *` | `/api/cron/purge-spam` | Deletes leads flagged as spam more than 7 days ago, archiving an anonymous tally first |
| `0 4 * * *` | `/api/cron/followup-reminders` | Pushes each agent their due and overdue follow-ups |
| `0 6 * * *` | `/api/sync-projects` | Refreshes the developer/project list |
| `30 22 * * *` | `/api/cron/backup` | Snapshots the database |

Each route checks `CRON_SECRET` when it is set. Trigger one by hand from
Vercel → Cron Jobs → **Run now**.

---

## Email and calendar invites

Email goes through **Resend** if `RESEND_API_KEY` is set, otherwise **SMTP**.
Test it from **Admin → Send test email to me**, which reports the provider's own
error message rather than a guess.

Scheduling a follow-up sends the assigned agent a calendar invitation
(`METHOD:REQUEST`, with organiser and attendee), which Outlook adds to the
calendar by itself. Completing the follow-up sends `METHOD:CANCEL` for the same
UID, removing it again.

Two caveats worth knowing:

- **Microsoft 365 blocks SMTP AUTH by default.** The error is
  `535 5.7.139 SmtpClientAuthentication is disabled for the Tenant`. It must be
  enabled at *both* tenant and mailbox level, and Microsoft is retiring it —
  Resend is the more durable route.
- **Through Resend the invite is an `.ics` attachment**, so the agent taps once
  to add it rather than it appearing silently. Everything else is identical.

---

## Backups

`/api/cron/backup` dumps every important table to JSON and writes it to up to
two destinations. The run succeeds if **either** lands:

1. **Supabase Storage** — the private `backups` bucket, pruned to 30 days.
2. **GitHub** — committed to a private repo when `BACKUP_GITHUB_*` is set.
   History is kept indefinitely.

> **The snapshot contains every lead's name, phone number, email and notes.**
> The GitHub target must be a **private** repository, and must not be the repo
> holding this code. Git history is permanent — a snapshot pushed to a public
> repo cannot be withdrawn.

Restores are manual by design: pull the snapshot and rebuild the rows you need,
so a bad bulk update can always be walked back.

---

## Security notes

- **Row-Level Security is the real boundary.** Server Actions read through the
  caller's own Supabase client wherever a permission decision matters; the
  service-role client is reserved for aggregation that is legitimately
  team-wide — leaderboards, reports, cron.
- **Secrets live in Vercel**, never in the repo. `.env*` is gitignored;
  `.env.local.example` holds placeholders only.
- **Storage buckets are private.** Avatar recordings are faces and voices
  captured under an explicit likeness consent, are never publicly readable, and
  each user can only write into their own folder.

---

## Troubleshooting

**A feature silently does nothing.** Almost always an un-run migration. Check
the columns it needs, run the migration, retry.

**"Email did NOT send."** The message quotes the mail server. `535` is
authentication, `ETIMEDOUT` is host or port, `5.7.139` is the Microsoft tenant
policy, and "not set" means the variables are missing or predate the deploy.

**A tab shows nothing, or everything.** Filtered lead tabs show an empty list
and a banner when the `origin` column is missing, rather than falling back to
the unfiltered list — an empty list is honest, a full one reads as "these are
all follow-ups".

**Changed an environment variable and nothing happened.** Redeploy.

**The sidebar looks squeezed.** The sidebar is `flex: 0 0 220px` and `.content`
is `min-width: 0`. If either is edited, wide tables will push the menu and clip
its labels.

---

## Conventions

- **Comments explain *why*, not *what*.** The reasoning behind a non-obvious
  choice is worth more than a restatement of the code.
- **Fail loudly on a missing migration.** Degrading silently caused several real
  bugs — a flag that reported success without saving, a spam counter permanently
  reading zero, a filtered tab listing every lead. Where a fallback would change
  what a number means, show the problem instead.
- **Commit messages are a decision record.** They explain the reasoning, not
  just the diff; `git log` is the handover document for whoever picks this up.
- **Migrations are additive and idempotent**, numbered sequentially, and never
  edited once applied to production.
