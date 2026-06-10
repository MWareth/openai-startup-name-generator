---
name: linkedin-daily
description: Generate a daily LinkedIn post (draft for the user's approval) about Dubai/Middle East investment topics in the user's voice, backed by fresh research on notable investors and world news affecting Middle East investment, plus a matching AI image prompt (Nano Banana / Gemini). Use when the user says "linkedin post", "my daily post", "draft my linkedin", or invokes /linkedin-daily. The user reviews and posts manually to their personal profile.
---

# LinkedIn Daily Post

Produce **one ready-to-post LinkedIn draft per day** for the user — a Dubai
real-estate / investment professional — in their voice, grounded in fresh
research, with a matching image. The user **reviews and posts it themselves**
to their **personal profile** (no auto-posting).

## Voice & topics (edit this block to tune the output)

- **Who:** Dubai-based real-estate & investment professional building a
  personal brand that attracts investors and clients.
- **Core topics:** Dubai property investment (ROI, off-plan, rental yields,
  Golden Visa), capital flows into Dubai, Middle East macro/economy, and
  **world news that affects Middle East investment** (rates, oil, geopolitics,
  sovereign wealth, foreign direct investment).
- **Recurring angle — "investment people":** spotlight a notable investor or
  investment figure (in Dubai or globally) and the lesson behind their move.
- **Tone:** professional but human, confident, insight-first, generous with
  value, lightly opinionated. **Not** salesy, not hype, no emoji spam.
- **Length:** ~120–220 words. Short paragraphs / line breaks for readability.
- **Signature CTA style:** a soft, conversational question or invite to DM.

> If the user shares past posts, mirror their phrasing, rhythm, and hooks.

## Daily workflow

1. **Pick today's angle** (rotate day to day, don't repeat yesterday):
   - A) **Investor spotlight** — a notable investor/fund active in Dubai or
     globally + a takeaway for Dubai investors.
   - B) **News-driven take** — a current world story that affects Middle East
     investment, with the "so what for Dubai" angle.
   - C) **Insight/educational** — a Dubai investment concept explained simply.
2. **Research (web search, run in parallel):**
   - Notable investors / investment figures active in Dubai or moving markets.
   - World news affecting Middle East investment (rates, oil, FDI, sovereign
     wealth, geopolitics). Prefer recent, reputable sources; note recency.
   - Pull 1-2 concrete facts/figures to anchor the post (cite the source to
     the user — not necessarily in the post body).
3. **Write the post** in the voice above:
   - **Hook** (first line — stops the scroll).
   - 2-4 short insight paragraphs with a concrete fact or angle.
   - **Takeaway / soft CTA.**
   - **3-6 hashtags** (mix broad + niche: #DubaiRealEstate #Investment
     #MiddleEast #RealEstateInvesting + topical).
4. **Create the image** (see below) — a matching visual + prompt.
5. **Deliver for approval** using the output format. Never post anywhere; this
   is a draft the user copies into LinkedIn.

## Image — Nano Banana (Gemini)

Each post gets a matching image. Always produce a **detailed image prompt**
(professional, on-brand: Dubai skyline / finance / clean editorial style, no
text-in-image unless asked). Then:

- If `GEMINI_API_KEY` is set **and** network access is available, generate it:
  ```bash
  python3 ~/.claude/skills/linkedin-daily/scripts/nano_banana.py \
    "<image prompt>" ~/linkedin_image_$(date +%F).png
  ```
  Then share the saved image with the user.
- If not configured, **still give the user the polished image prompt** and note
  that Nano Banana isn't wired up yet (needs a Google `GEMINI_API_KEY` +
  network access — see `scripts/nano_banana.py` header).

## Publishing — Playwright (local, optional, human-in-the-loop)

The user can semi-automate posting with Playwright. **This runs on the user's
own computer, not the remote/web session** (no browser + network is locked down
here). It **pre-fills** the post and **stops for the user to click Post** — it
never auto-posts.

When the user wants to publish a generated draft this way:

1. Save the post text to a file, e.g. `~/linkedin_post_$(date +%F).txt`, and
   note the image path (from Nano Banana).
2. Have the user run, on their machine:
   ```bash
   python ~/.claude/skills/linkedin-daily/scripts/post_to_linkedin.py \
     --text-file ~/linkedin_post_$(date +%F).txt --image ~/linkedin_image.png
   ```
3. A visible browser opens, logs in (persistent profile; uses `LINKEDIN_EMAIL`
   / `LINKEDIN_PASSWORD` env vars on first run, reuses the session after),
   opens the composer, fills text + image, then **waits for the user to review
   and click Post**.

One-time setup on the user's machine: `pip install playwright` &&
`playwright install chromium`; set `LINKEDIN_EMAIL` / `LINKEDIN_PASSWORD`.
Caveats: LinkedIn's ToS discourage automation, and selectors can change — the
script reports which step failed so the user can finish by hand. Keep usage
gentle (one post/day, human clicks Post).

## Output format

```
# 📅 LinkedIn Draft — <Weekday>, <Date>
**Angle:** <Investor spotlight | News take | Insight>

---
<full post text, ready to paste, with line breaks>

<#hashtags>
---

🖼️ **Image prompt (Nano Banana):**
<detailed prompt>
<— generated image attached, or: "Nano Banana not set up yet — prompt ready">

📚 **Sources (for you, not the post):** <links + recency>
✏️ **Want changes?** Tell me the tweak (shorter, punchier, different angle…).
```

## Notes
- Draft only — the user always reviews and posts manually to their personal
  profile. Never auto-post.
- Ground claims in real, recent sources; never invent stats or quotes. If you
  can't verify a figure, leave it out.
- Keep it fresh daily — vary angle, investor, and news hook.
- Respect people's reputations: factual, fair framing when naming investors;
  no fabricated quotes or rumors.
