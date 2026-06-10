# Personal Claude Code Skills (backup)

These skills are personal/global skills, committed here so they persist across
ephemeral remote sessions. They also load automatically as project skills when
working in this repo.

## Skills

- **morning-routine** — a start-of-day briefing: Dubai real estate, crypto &
  commodities (gold/silver/oil), news, daily planning, Asana lead snapshot,
  Instagram Reels + LinkedIn content ideas, and a habit checklist.
  Trigger: "good morning", "start my day", or `/morning-routine`.
- **asana-leads** — view and update real-estate leads in an Asana board where
  sections are pipeline stages. Trigger: "show my leads", "add an update to
  the Smith lead", "move the X lead to Viewing".

## Restore to global (~/.claude)

To make them available across all projects on a machine:

```bash
cp -r .claude/skills/morning-routine ~/.claude/skills/
cp -r .claude/skills/asana-leads     ~/.claude/skills/
```

## Required environment variables (asana-leads)

Set these as environment variables/secrets (never commit them):

- `ASANA_TOKEN`   — Asana Personal Access Token (https://app.asana.com/0/my-apps)
- `ASANA_PROJECT` — GID of your lead board (find it with
  `python3 .claude/skills/asana-leads/scripts/asana_leads.py projects`)
