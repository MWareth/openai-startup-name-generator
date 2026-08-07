---
name: todayslive
description: Daily news briefing for Marwan's 30-minute TikTok Live «عقارات الإمارات». Fetches today's Dubai/UAE real-estate news and events, verifies dates and sources, and turns them into a spoken Egyptian-Arabic rundown he reads out loud on air — loaded into his live script page with per-topic countdowns. Use this whenever Marwan says /todayslive, asks for today's or tonight's live, wants news/events/topics for his daily stream, says "اللايف بتاع النهاردة" or "أخبار النهاردة", or asks what to talk about on TikTok Live today.
---

# /todayslive — Daily 30-Minute News Live

Every day Marwan goes live on TikTok for ~30 minutes and talks through the day's Dubai real-estate news. This skill fetches the news, writes it the way he speaks, and loads it into his live tools. He reads it out loud on air — so everything must be written for the ear, not the eye.

Audience: ordinary people learning about investing in Dubai. Goal of every episode: followers + DM leads (keyword «دبي» → details in DM).

## Step 1 — Fetch today's news (never skip, never invent)

Spawn 2–3 parallel research agents (general-purpose, WebSearch) covering different angles:

- **Market & government news:** DLD announcements, new laws/visas/fees, price/rent data releases, rate changes. Sources: Gulf News, Khaleej Times, The National, Zawya, WAM, Arabian Business.
- **Projects & developers:** new launches, handovers, master-plan announcements from Emaar, Meraas, Nakheel, Beyond, Sobha, Damac, etc.
- **Events & culture:** exhibitions (Cityscape…), auctions, records, anything happening in Dubai TODAY/this week that a live audience would find fun.

Rules for the agents: every item needs source + publication date. Prefer items from the last 24–72 hours — this is a *daily* show; stale news kills it. If a slow news day, say so and pull the week's best 2–3 items plus one evergreen explainer. No invented numbers, ever.

Pick 4–6 items and rank: one **خبر اليوم** (the lead — the item with a number or a decision that affects viewers' money), the rest quick hits.

## Step 2 — Build the 30-minute rundown

1. **الافتتاحية (2–3 د)** — hook from the lead story («خبر نزل النهاردة هيفرق مع أي حد ناوي يشتري في دبي…») + follow CTA + «اكتب دبي»
2. **خبر اليوم (6–7 د)** — the lead, told fully: what happened → the one anchor number → «يعني إيه ليك انت؟»
3. **أخبار سريعة (5–6 د)** — 3–4 quick items, 3–4 sentences each, fast rhythm
4. **أسئلة وأجوبة (4–5 د)** — with 2–3 seeded questions written out in case chat is quiet
5. **زاوية المستثمر (5–6 د)** — what today's news means practically for a buyer/investor (tie to areas, budgets, timing)
6. **الختام (2–3 د)** — recap in 3 lines + tomorrow tease + follow + «دبي»

Every segment opens with a 10-second re-hook for new joiners — TikTok Live viewers churn constantly.

## Step 3 — Write it for the mouth, not the page

- Egyptian Arabic, spoken register — sentences he reads verbatim that sound improvised. Rhetorical questions, pauses («…»), direct address («ركز معايا»).
- **Down to earth:** one rounded anchor number per item («حوالي ١٠ في المية»). Precise figures only when the number IS the story.
- **Label numbers correctly:** rents ≠ ready-sale prices ≠ off-plan. Mixing them on air destroys credibility.
- Every news item ends with «يعني إيه ليك؟» — the so-what for a normal person.
- Honesty is the brand: say the bad news plainly, own data gaps, attribute when needed («حسب [المصدر]»).

### Red lines (every episode)
- Never name countries/conflicts — «التوتر الإقليمي» is enough.
- Never guarantee returns or visas — «تاريخيًا»، «حسب موافقة الجهات».
- Area criticism = supply/demand analysis, never attacks.

## Step 4 — Load it into his live tools

Update `real-estate-videos/live/live-script-scroll.html` — his one-screen tool: scrollable per-topic script with a countdown bar in the sticky header. Update the `<section>` blocks, the `SEGS` array (ids/names/minutes), and the header chips **together** or the timer desyncs. Republish with the Artifact tool passing `url: https://claude.ai/code/artifact/789e45c1-fabd-4d2f-b2b9-b77d329b959e` (without `url`, a new session mints a new link and breaks his bookmark). Keep favicon 📜.

Optional second screen (only if he asks): `live-rundown-timer.html` headline-cue timer → `url: https://claude.ai/code/artifact/488157bb-1736-41d1-9fbc-64ff7fadae56`, favicon ⏱️.

Append any newly researched numbers (with sources) to `real-estate-videos/scripts/boosted-stream-numbers-cheatsheet.md` — his if-challenged backup.

## Step 5 — Ship

Commit to the working branch and push (retry on transient 500s). Final message: the artifact link, today's lineup in one glance (lead + quick hits), and the single strongest line to open with.

## Extras (offer, don't assume)

- **Story promo graphic** for today's episode: edit `real-estate-videos/assets/stories/story-promo.html`, screenshot at 1080×1920 with Playwright (`/opt/pw-browsers/chromium`, `NODE_PATH=/opt/node22/lib/node_modules`), SendUserFile the PNG. Keep text in the upper ~65% — TikTok UI covers the bottom third.
- **Deep-dive episode kit** (60-min themed shows, lead-magnet PDF, emergency scripts): follow the patterns already in `real-estate-videos/scripts/` and `real-estate-videos/live/`.
