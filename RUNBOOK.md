# Bullish CRM — Operations Runbook

Everything needed to run, back up, restore, move and repair the CRM. Written to
be followed exactly, in order, without needing to understand the code.

Companion to [`README.md`](README.md), which explains *what the system is*. This
explains *what to do*.

---

## Emergency card

| Situation | Do this | Section |
| --- | --- | --- |
| Site is broken after a deploy | Vercel → Deployments → previous build → **Promote to Production** | [Rolling back](#rolling-back-a-deploy) |
| Data deleted by mistake | Restore from the latest snapshot | [Restoring the database](#restoring-the-database) |
| Nobody can sign in | Check Supabase project is not paused | [Troubleshooting](#troubleshooting) |
| Emails stopped | Admin → Send test email to me → read the error | [Email](#email) |
| A lead vanished | Audit log records who deleted what | [Audit trail](#audit-trail) |
| Need to hand over to someone | Add them in Admin, share this runbook | [People](#people-and-access) |

**Golden rule:** never delete the old copy of anything until the new one is
proven working. Every procedure below is ordered so that both copies exist at
the same time.

---

## Backups

Two separate things, with very different risk. **The code is replaceable; the
data is not.** If you only ever do one thing, back up the database.

### Database — automatic

Runs nightly at **22:30 UTC** (02:30 Dubai) with no action from you. It dumps
every important table to JSON and writes it to whichever destinations are
configured.

**To verify it is working** (do this monthly):

1. Supabase → **Storage → `backups`**
2. There should be a file named `snapshot-YYYY-MM-DD.json` dated yesterday
3. If GitHub backup is configured, check the backup repo for the same file

If neither shows a recent file, the backup is **not running** — fix it before
doing anything else.

### Database — manual, before anything risky

1. Vercel → **Cron Jobs**
2. Find `/api/cron/backup` → **Run now**
3. Wait for it to finish, then confirm the file appeared as above

Do this before: running a migration, bulk-editing leads, changing roles, or
moving the repository.

### Database — the second destination (recommended)

Supabase Storage needs a paid plan on some tiers. GitHub works on the free plan
and keeps history forever.

1. GitHub → **New repository** → name it `bullish-crm-backups`
2. **Tick Private.** Verify it says Private before continuing
3. GitHub → Settings → Developer settings → **Fine-grained tokens** → Generate:
   - Repository access: **Only select repositories** → the backup repo only
   - Permissions: **Contents → Read and write**
   - Expiry: 1 year (diarise the renewal; an expired token fails quietly)
4. Vercel → Settings → Environment Variables:
   - `BACKUP_GITHUB_TOKEN` = the token
   - `BACKUP_GITHUB_REPO` = `MWareth/bullish-crm-backups`
5. **Redeploy**, then run the cron manually and check the file arrives

> ⚠️ The snapshot contains every lead's name, phone, email and notes. The repo
> **must** be private, and must not be the repo holding the code. Git history is
> permanent — a snapshot pushed to a public repo cannot be withdrawn.

### Code

The code lives in four places already: GitHub, Vercel's build history, your
computer, and any bundle you have made. It is hard to lose. Still:

**One-file archive of everything, including history:**
```bash
git bundle create bullish-crm-backup.bundle --all
git bundle verify bullish-crm-backup.bundle    # must say "complete history"
```
Keep the `.bundle` file somewhere off GitHub.

**Simplest possible:** repo page → green **Code** button → **Download ZIP**.
Current files only, no history.

---

## Restoring

### Restoring the database

Restores are deliberately manual — that is what makes a bad bulk update
recoverable rather than instantly permanent.

1. Download the snapshot from Supabase Storage or the backup repo
2. Open it — it is JSON: `{ "tables": { "leads": [...], "deals": [...] } }`
3. Decide **exactly** what you are putting back. Restoring everything over live
   data will overwrite work done since the snapshot
4. In Supabase → SQL Editor, insert the specific rows you need

For a full disaster (database gone entirely), rebuild in this order so foreign
keys resolve: `profiles` → `leads` → `lead_activities` → `lead_followups` →
`deals` → everything else.

**Before restoring anything, take a fresh backup of the current state.** A
restore is itself a risky operation.

### Restoring the code

From a bundle:
```bash
git clone bullish-crm-backup.bundle bullish-crm
cd bullish-crm
git remote add origin https://github.com/MWareth/<new-repo>.git
git push -u origin master
```

From GitHub: it is already there. Point Vercel at it.

---

## Duplicating the repository

Used to make a private copy, split the repo, or hand a copy to someone.

### Method A — GitHub Importer (no terminal)

1. Go to **https://github.com/new/import**
2. Old repository's clone URL: `https://github.com/MWareth/<old-repo>.git`
3. Owner: `MWareth` · Name: the new name · Privacy: **Private**
4. **Begin import**, wait for it to finish

**✅ Check:** the new repo says *Private*, shows `crm/`, and shows recent commits.

### Method B — Terminal

1. GitHub → **New repository** → name it → **Private** → add nothing to it
2. Then:
```bash
git clone --bare https://github.com/MWareth/<old-repo>.git
cd <old-repo>.git
git push --mirror https://github.com/MWareth/<new-repo>.git
cd .. && rm -rf <old-repo>.git
```

### Then repoint Vercel

3. Vercel → project → **Settings → Git** → Disconnect → Connect the new repo
4. Check **Settings → General → Root Directory** still reads `crm`
5. Check **Settings → Environment Variables** are all still present
6. **Deployments → Redeploy**

**✅ Check:** sign in, open Recent Leads, open a lead, load the dashboard.

7. **Only now**, delete the old repo: Settings → Danger Zone → Delete

> **A fork of a public repo cannot be made private.** GitHub disables the
> option. Duplicating into a fresh repo, as above, is the only route.

> **GitHub Pages does not work on private repos on the free plan.** If a repo
> serves a live site from `docs/`, making it private takes that site offline.

---

## Deploying

Deployment is automatic: **anything pushed to `master` goes live.** There is no
separate deploy step.

- **Environment variables only apply to new builds.** After changing one, you
  must **Redeploy** or nothing happens.
- Watch the build: Vercel → Deployments → the running build → Logs.

### Rolling back a deploy

1. Vercel → **Deployments**
2. Find the last build that worked (they are timestamped)
3. **⋯ → Promote to Production**

Live within seconds. Nothing in git changes — you can redeploy forward again
once the problem is fixed.

---

## Migrations

Database changes are SQL files in `crm/supabase/migrations/`, applied **by hand**
in the Supabase SQL Editor, in numerical order.

**To apply one:**

1. Take a manual database backup first
2. Open the file on GitHub, copy all of it
3. Supabase → **SQL Editor** → paste → **Run**
4. Test the feature it enables

Every migration is **idempotent** — safe to run twice. If unsure whether one has
been applied, just run it again.

**To check what is applied:**
```sql
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'leads';
```

**Symptom of a missing migration:** a feature quietly does nothing, or a page
shows a red banner naming the migration. The app is built to say so rather than
fail silently — if you see a banner naming a file, run that file.

---

## People and access

### Adding someone

Admin → invite them → set their role. They get a temporary password and are
forced to change it at first sign-in.

### Roles

| Role | Can see | Can delete leads |
| --- | --- | --- |
| `agent` | Own leads and targets | No |
| `marketing` | Marketing report, Content Studio, no money | No |
| `support` | All leads, routing, no money | No |
| `director` / `c_suite` | All leads, reports, commission | No |
| `admin` | Everything, including Admin page | **Yes — owner only** |

**Only the `admin` role can delete a lead.** If anyone else should be blocked
from deleting, make sure they are not on `admin`. Check the Teams page.

### Removing someone

Change their role or disable the account in Admin. **Reassign their leads
first**, or those leads are left unassigned.

---

## Email

Two possible providers. Resend wins if both are configured.

| | SMTP | Resend |
| --- | --- | --- |
| Set up | Mailbox + app password | API key + DNS records |
| Calendar invites | Added to the calendar silently | Arrive as an attachment to tap |
| Microsoft tenants | Often blocked by policy | Unaffected |

**Testing:** Admin → **Send test email to me**. It reports the mail server's own
error, not a guess.

| Error | Means | Fix |
| --- | --- | --- |
| `not set` | Variables missing or predate the deploy | Add them, redeploy |
| `535` | Password rejected | Use an app password |
| `5.7.139 disabled for the Tenant` | Microsoft blocks SMTP AUTH | Enable at tenant *and* mailbox level, or switch to Resend |
| `ETIMEDOUT` | Wrong host/port | `smtp.office365.com`+`587`, or `smtp.gmail.com`+`465` |
| `SendAsDenied` | From address not permitted | `EMAIL_FROM` must match `SMTP_USER` |

---

## Routine checks

**Weekly**
- Marketing report → is the junk rate climbing? A bad campaign shows up here first
- 1:1 report → who has untouched leads or overdue follow-ups

**Monthly**
- Supabase Storage → is last night's snapshot there?
- Teams page → does everyone have the right role?
- Vercel → any failed cron runs?

**Yearly**
- Renew the GitHub backup token before it expires

---

## Audit trail

Every significant action is recorded: status changes, reassignments, follow-ups
completed, spam flags, and **lead deletions**. The deletion record outlives the
lead, so "who deleted this?" is always answerable.

**Where:** Reports → Activity log. Filter by person or date.

---

## Troubleshooting

**A feature silently does nothing.** Almost always an un-run migration. Look for
a banner naming the file; run it.

**Changed a setting and nothing happened.** Environment variables need a
redeploy.

**A tab is empty that shouldn't be.** Follow Ups and Cold Leads only show leads
*tagged* with that type. Tag one from the "Type of lead" column on Recent Leads.

**Numbers look wrong on a report.** Check the period selector and remember the
marketing report covers online-campaign sources only — except the spam counter,
which covers everything.

**Someone can't see a page.** Role. Check the table above.

**Supabase says the project is paused.** Free-tier projects pause after
inactivity. Resume it from the Supabase dashboard.

---

## What cannot be automated

These need a human with account access, and no amount of code changes that:

- Running migrations (Supabase login)
- Changing repository visibility, creating or deleting repos (GitHub login)
- Setting environment variables and redeploying (Vercel login)
- Enabling SMTP on a Microsoft tenant (IT / Global Admin)
- Restoring a database

Anyone standing in for you needs: GitHub, Vercel, Supabase, and the CRM Admin
role. That is the full set.
