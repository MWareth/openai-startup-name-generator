---
name: morning-routine
description: Run the user's personal morning routine. Use when the user says "good morning", "morning routine", "start my day", or invokes /morning-routine. Produces a single morning briefing covering Dubai real estate news & transactions, crypto & commodities (gold/silver/oil) market analysis, a general news briefing, daily planning, an Asana lead/pipeline snapshot, a social content reminder for Instagram Reels & LinkedIn with fresh post ideas, and personal habit check-ins.
---

# Morning Routine

A start-of-day briefing for the user. When invoked, work through the four
sections below **in order** and deliver them as one clean, scannable message.
Keep it tight — this is a morning glance, not a research report. Use the
current date (provided in context) so everything is fresh.

## How to run it

1. Note today's date and day of week from context.
2. Gather the data for each section (use web search/fetch where noted; run
   these searches in parallel to keep the routine fast).
3. Synthesize into ONE markdown message using the output format below.
4. End by asking the user to confirm their top priority for the day.

If the network is unavailable, say so for the affected sections and still
deliver planning + habits, which don't need the web.

## Section 1 — Dubai Real Estate 🏙️

Give a quick pulse on the Dubai property market:

- **News**: 2-4 of the most recent, relevant headlines (regulation, major
  launches, market sentiment, mortgage/rate moves). Search terms like
  "Dubai real estate news", "Dubai property market", "DLD transactions".
- **Transactions / market data**: any notable recent figures — DLD transaction
  volumes/values, hot areas, price trends, big-ticket deals.
- Prefer reputable sources (DLD, Property Finder, Bayut, Khaleej Times,
  Arabian Business, The National). Cite source + recency for each item.
- 1-line takeaway: what does this mean for someone watching the market today.

## Section 2 — Markets: Crypto & Commodities 📈

A quick market pulse. Pull **current** prices and the overnight/24h move —
never quote stale numbers. Search live sources (CoinGecko/CoinMarketCap for
crypto; Kitco/TradingEconomics/Reuters for metals & oil).

- **Crypto**: BTC and ETH (price, 24h %), plus 1-2 notable movers or a
  one-line sentiment read (Fear & Greed, major flows, ETF/regulatory news).
- **Commodities**:
  - 🥇 Gold (spot, daily move)
  - 🥈 Silver (spot, daily move)
  - 🛢️ Oil (Brent and/or WTI, daily move)
- **Analysis**: 1-2 lines tying it together — what's driving moves today
  (rates, dollar, geopolitics, supply) and what to watch. Be a read, not a
  recommendation; flag that this isn't financial advice.
- Always attribute prices to a source + timestamp. If live data is
  unavailable, say so rather than guessing a price.

## Section 3 — News Briefing 📰

A short general briefing — 3-5 bullets of the biggest stories the user should
know this morning. Keep each to one line. Search for top headlines for the
current date. Lead with anything region-relevant (UAE/Gulf) then global.

## Section 4 — Daily Planning 🎯

Help the user shape the day:

- If a tasks/todo source exists (e.g. a `TODO.md`, notes file, or open PRs/
  issues in the current repo), surface what's outstanding.
- Otherwise, prompt the user with a simple structure: top 3 priorities, any
  meetings/deadlines, and one "if time permits" item.
- Suggest a focus order. Be concrete, not generic.

## Section 5 — Leads / Pipeline (Asana) 🤝

Surface the day's lead picture from the user's Asana CRM board. Use the
`asana-leads` skill's CLI:

```bash
python3 ~/.claude/skills/asana-leads/scripts/asana_leads.py list
```

- Group the snapshot by stage with counts (e.g. New 4 · Viewing 2 · Offer 1).
- Call out what needs action **today**: overdue follow-ups, leads with no
  recent activity, anyone sitting too long in one stage, unassigned leads.
- Suggest 1-3 concrete next actions ("call the Marina 2BR lead — no update in
  5 days"). Keep it tight.
- If `ASANA_TOKEN` / `ASANA_PROJECT` aren't configured, skip this section with
  a one-line note pointing to the asana-leads setup, and continue the routine.

## Section 6 — Social Content: Reels & LinkedIn 🎬

A daily reminder to post, plus ready-to-use ideas so there's no blank-page
excuse. Generate **fresh ideas each day** — tie them to today's market moves,
Dubai real estate angle, or news from the sections above so content stays
timely and on-brand.

- **Reminder line**: nudge to post today on Instagram Reels and LinkedIn.
- **2 Instagram Reel ideas**: each with a hook (first 3 seconds), a rough
  shot/structure, and 3-5 hashtags. Favor short, punchy, visual concepts.
- **2 LinkedIn post ideas**: each with an angle/headline and a one-line
  opening, plus a suggested format (text + image, carousel, poll, short take).
  Lean professional/insight-driven — market commentary, Dubai property
  insights, lessons, contrarian takes.
- Where natural, recycle one idea across both platforms (Reel → LinkedIn video
  or vice versa) and say how to adapt it.
- Keep ideas specific and producible today, not generic ("post about real
  estate"). Vary the themes day to day.

## Section 7 — Personal Habits ✅

A friendly checklist nudge. Render as a checkbox list the user can react to:

- [ ] 💧 Hydrate (glass of water)
- [ ] 🧘 Move / exercise
- [ ] 📓 Journal / intention for the day
- [ ] 🍳 Healthy breakfast
- [ ] 📵 No-scroll focus block planned

Keep the tone encouraging and brief — one motivating line, not a lecture.

## Output format

```
# ☀️ Good morning — <Weekday>, <Date>

## 🏙️ Dubai Real Estate
- <headline> — <source>, <recency>
- <transaction/market note>
> Takeaway: <one line>

## 📈 Markets
**Crypto** — BTC $<x> (<±%>), ETH $<x> (<±%>) · <sentiment/mover>
**Commodities** — 🥇 Gold $<x> (<±%>) · 🥈 Silver $<x> (<±%>) · 🛢️ Oil $<x> (<±%>)
> Read: <1-2 lines on drivers> _(not financial advice)_

## 📰 News Briefing
- <story>
- <story>

## 🎯 Today's Plan
1. <priority>
2. <priority>
3. <priority>

## 🤝 Leads
<New x · Contacted x · Viewing x · Offer x>
- ⚠️ Action: <lead needing follow-up today>

## 🎬 Post Today
**Reels:** 1) <hook + concept> 2) <hook + concept>
**LinkedIn:** 1) <angle + opener> 2) <angle + opener>

## ✅ Habits
- [ ] 💧 ... (etc.)

**What's the one thing that would make today a win?**
```

## Notes

- Default to concise. The whole thing should be readable in under a minute.
- Always attribute news/market/price claims to a source with rough recency;
  never invent figures or quote stale prices. If you can't verify a number,
  say so rather than guess.
- Markets section is information, not financial advice — always flag that.
- Social ideas must be fresh daily and tied to the day's context; don't repeat
  yesterday's concepts.
- Adapt section depth to what the user asks for ("just the markets" → only
  Section 2; "just content ideas" → only Section 5).
