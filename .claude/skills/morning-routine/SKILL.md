---
name: morning-routine
description: Run the user's personal morning routine. Use when the user says "good morning", "morning routine", "start my day", or invokes /morning-routine. Produces a single morning briefing for a Dubai real-estate agent covering Dubai property market data (DXBinteract / Property Monitor — top 5 areas & top 5 projects that moved this week), crypto & commodities (gold/silver/oil) market analysis, a general news briefing, daily planning, Instagram Reels & LinkedIn content ideas, and a personal habit tracker.
---

# Morning Routine

A start-of-day briefing for the user — a **Dubai real-estate agent**. When
invoked, work through the sections below **in order** and deliver them as one
clean, scannable message. Keep it tight — a morning glance, not a research
report. Use the current date (from context) so everything is fresh.

## How to run it

1. Note today's date and day of week from context.
2. Gather each section's data (use web search/fetch where noted; run the
   searches in parallel to keep it fast).
3. Synthesize into ONE markdown message using the output format below.
4. End by pointing to the habit tracker and asking for the day's top priority.

If the network is unavailable, say so for the affected sections and still
deliver planning + habits, which don't need the web.

## Section 1 — Dubai Real Estate 🏙️ (the headline section)

This is the most important section — the user is an agent and lives on this
data. Make it **organized, data-rich, and weekly-comparative**. Prioritise
these sources and try to fetch directly before falling back to search:

- **DXBinteract** — https://dxbinteract.com (areas, projects, transaction
  volumes, price/sqft, trends). Try WebFetch on the relevant pages.
- **Property Monitor** — https://www.propertymonitor.ae (PMI index, market
  intelligence, transaction data).
- Backups: DLD / Dubai REST (https://dubailand.gov.ae), Property Finder,
  Bayut, Khaleej Times, Arabian Business, The National.

Produce these four blocks:

1. **Market pulse (this week vs last)**: total weekly transaction volume &
   value with week-over-week % change; sales vs mortgage split if available;
   off-plan vs secondary split. Note the PMI / average price-per-sqft trend.

2. **🔝 Top 5 Areas (this week)** — a table ranked by activity:

   | # | Area | Txns (wk) | Avg Price (AED) | AED/sqft | WoW Δ |
   |---|------|-----------|-----------------|----------|-------|

   Pick the areas with the most transactions or the biggest weekly move.

3. **🏗️ Top 5 Projects that moved this week** — a table of the projects with
   the biggest change (price, sales velocity, new launch, handover, big deal):

   | # | Project | Area | What changed | Δ / note |
   |---|---------|------|--------------|----------|

4. **News & takeaway**: 2-3 headlines (regulation, major launches, rate moves,
   sentiment) + a 1-line agent takeaway: what this means for the user *today*
   (which areas to pitch, who to call, what's heating up).

Always cite source + recency per data point. If DXBinteract / Property Monitor
can't be fetched (JS-rendered or blocked), say so, fall back to DLD/search, and
clearly mark any figure whose freshness you can't confirm — never invent
numbers or fabricate a ranking.

## Section 2 — Markets: Crypto & Commodities 📈

A quick market pulse. Pull **current** prices and the overnight/24h move —
never quote stale numbers. Search live sources (CoinGecko/CoinMarketCap for
crypto; Kitco/TradingEconomics for metals & oil).

- **Crypto**: BTC and ETH (price, 24h %), plus 1-2 notable movers or a
  one-line sentiment read (Fear & Greed, major flows, ETF/regulatory news).
- **Commodities**: 🥇 Gold, 🥈 Silver, 🛢️ Oil (Brent and/or WTI) — spot +
  daily move each.
- **Analysis**: 1-2 lines on what's driving moves today (rates, dollar,
  geopolitics, supply) and what to watch. A read, not advice; flag that it
  isn't financial advice.
- Always attribute prices to a source + timestamp. If live data is
  unavailable, say so rather than guessing.

## Section 3 — News Briefing 📰

3-5 one-line bullets of the biggest stories this morning. Search top headlines
for the current date. Lead with UAE/Gulf, then global.

## Section 4 — Daily Planning 🎯

Help the user shape the day:

- If a tasks/todo source exists (a notes file, open PRs/issues), surface it.
- Otherwise prompt for: top 3 priorities, meetings/deadlines, one "if time
  permits" item.
- Suggest a concrete focus order tied to the day's real-estate angle.

## Section 5 — Social Content: Reels & LinkedIn 🎬

A daily nudge to post, plus ready-to-use content tied to **today's** market
moves, the hot areas/projects from Section 1, or the news above — so content
is timely and on-brand. Generate fresh ideas each day; don't repeat yesterday.

- **Reminder line**: post today on Instagram Reels and LinkedIn.
- **2 Reel ideas**: each with a hook (first 3 sec), rough shot/structure, and
  3-5 hashtags. Short, punchy, visual.
- **📝 LinkedIn Post of the Day (full, ready-to-post draft):** write ONE
  complete LinkedIn post in the user's voice — hook → 2-3 short insight
  paragraphs anchored in a real figure from today → soft CTA → 3-6 hashtags.
  ~120-200 words, ready to copy-paste straight to LinkedIn. Add a one-line
  **image prompt** (for Gemini/Nano Banana or Higgsfield). Ground every claim
  in a source from above; never invent stats.
- **1 extra LinkedIn angle**: a one-line alternative idea in case they want a
  different take.
- Where natural, recycle the post idea into a Reel and say how to adapt.

## Section 6 — Personal Habits ✅ (web app)

The user tracks habits in a dedicated web app (a checkable to-do list with
streaks and progress), not in chat. In the briefing:

- Render the day's checklist inline as a quick-glance markdown checkbox list.
- Then point them to the tracker to actually tick things off:
  **`habit-tracker/index.html`** (open in a browser; it saves to the device
  and tracks streaks).
- Keep the tone encouraging and brief — one motivating line.

Default habits (kept in sync with the web app):
- [ ] 💧 Hydrate (glass of water)
- [ ] 🧘 Move / exercise
- [ ] 📓 Journal / intention for the day
- [ ] 🍳 Healthy breakfast
- [ ] 📵 No-scroll focus block planned
- [ ] 🏠 Follow up with 3 leads / clients
- [ ] 📲 Post 1 piece of content

## Output format

```
# ☀️ Good morning — <Weekday>, <Date>

## 🏙️ Dubai Real Estate
**Market pulse:** <weekly volume/value, WoW %, off-plan vs secondary>

**🔝 Top 5 Areas**
| # | Area | Txns | Avg Price | AED/sqft | WoW Δ |
|---|------|------|-----------|----------|-------|
| 1 | ... | ... | ... | ... | ... |

**🏗️ Top 5 Projects that moved**
| # | Project | Area | What changed | Δ |
|---|---------|------|--------------|---|
| 1 | ... | ... | ... | ... |

**News:** <headline> — <source>
> Agent takeaway: <one line>

## 📈 Markets
**Crypto** — BTC $<x> (<±%>), ETH $<x> (<±%>) · <sentiment>
**Commodities** — 🥇 Gold $<x> (<±%>) · 🥈 Silver $<x> (<±%>) · 🛢️ Oil $<x> (<±%>)
> Read: <drivers> _(not financial advice)_

## 📰 News Briefing
- <story>

## 🎯 Today's Plan
1. <priority>

## 🎬 Post Today
**Reels:** 1) <hook> 2) <hook>

**📝 LinkedIn Post of the Day** (copy-paste ready)
> <full post text, line breaks, hashtags>
🖼️ Image prompt: <one line>
*Alt angle:* <one-line alternative>

## ✅ Habits  → track in habit-tracker/index.html
- [ ] 💧 ... (etc.)

**What's the one thing that would make today a win?**
```

## Notes

- Real estate is the star section — give it the most depth and structure.
- Always attribute data/price claims to a source with rough recency; never
  invent figures, prices, or rankings. If you can't verify, say so.
- Markets section is information, not financial advice — always flag that.
- Social ideas must be fresh daily and tied to the day's context.
- Adapt section depth to what the user asks for ("just the market" → Section
  1 only; "just content ideas" → Section 5 only).
