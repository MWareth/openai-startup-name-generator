---
name: asana-leads
description: View and manage the user's real-estate leads in their Asana CRM board. Use when the user asks to see their leads/pipeline, get a status on a lead, add an update/note/comment to a lead, or move a lead to another pipeline stage (e.g. "show my leads", "what's in my pipeline", "add an update to the Smith lead", "move the Al Barsha villa lead to Viewing"). The board's sections are pipeline stages.
---

# Asana Leads (Real-Estate CRM)

The user is a real-estate agent whose leads live in an Asana **board** project
where each **section/column is a pipeline stage** (e.g. New, Contacted,
Viewing, Offer, Closed). Each lead is a task. This skill drives a small CLI
that reads and updates that board via the Asana API.

## Setup (one-time)

The CLI needs two things in the environment:

- `ASANA_TOKEN` — an Asana Personal Access Token (create at
  https://app.asana.com/0/my-apps). **It's a secret** — store it as an
  environment variable/secret, never hard-code or echo it.
- `ASANA_PROJECT` — the GID of the user's lead board (set as an env var so
  commands don't need `--project` each time).

If `ASANA_PROJECT` isn't set yet, discover it:

```bash
python3 ~/.claude/skills/asana-leads/scripts/asana_leads.py whoami      # confirm token + workspaces
python3 ~/.claude/skills/asana-leads/scripts/asana_leads.py projects    # find the board GID
```

Then tell the user to set `ASANA_PROJECT=<that gid>` in the environment (or
pass `--project <gid>` on each call).

## Commands

Always invoke with the absolute path:
`python3 ~/.claude/skills/asana-leads/scripts/asana_leads.py <cmd>`

| Goal | Command |
|---|---|
| List leads grouped by stage | `list` (add `--stage Viewing` to filter, `--json` for raw) |
| Pipeline stages of the board | `stages` |
| Full detail + recent updates on a lead | `show "<name or gid>"` |
| Add an update/note to a lead | `update "<name or gid>" "<text>"` |
| Move a lead to another stage | `move "<name or gid>" "<stage>"` |

A `<lead>` argument is either a numeric Asana task GID or a **case-insensitive
substring of the lead name**. If it matches more than one lead, the CLI lists
the candidates — ask the user which one, or use the GID.

## How to behave

- When the user asks to **see leads / their pipeline**, run `list` and present
  it cleanly grouped by stage, calling out anything overdue or unassigned.
- When the user asks to **add an update**, run `update`. If they describe the
  update loosely ("called the Smith lead, they want a 2BR in Marina under
  2M"), turn it into a concise, professional note before posting. Confirm
  back what was logged.
- When the user asks to **move/advance a lead**, run `move`, then confirm the
  new stage.
- **Before any write** (`update`/`move`), make sure you've resolved to exactly
  one lead. If ambiguous, ask — don't guess which lead to modify.
- Never print the `ASANA_TOKEN`. If the token/project isn't configured, walk
  the user through the Setup steps above rather than failing silently.
- These are real CRM records — be accurate, don't invent lead names, budgets,
  or statuses. Only log what the user actually told you.
