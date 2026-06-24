# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **What this repo actually is:** this is the working home base for **Dee's Treats** — a dessert-business marketing/creative operation. The Next.js app below is the original fork it was cloned from and is incidental. Most work here is copy, content, campaign assets, and ad creative, not application code. Read the Dee's Treats context first.
>
> **All Dee's Treats work lives in [`deestreats/`](deestreats/README.md)** — campaigns, copy, brand, assets. Default new creative work there.

---

# Dee's Treats — Project Context

Read this before generating copy, content, code, or campaign assets.

## Business
Made-to-order homemade dessert business based in Dubai, UAE. Orders come in through Instagram DMs. Currently in an active growth phase — social content and paid ads exist to convert into direct order inquiries.

- **Owner/operator:** Marwan
- **Instagram:** @deestreats.ae
- **Order channels:** Instagram DM (primary), WhatsApp (community outreach)
- **North star:** social content + ads → DM order inquiries

## Menu
San Sebastian burnt basque cheesecake · pavlova · crème brûlée · brownies · carrot cake muffins · lazy cake

## Brand identity
- **Colors:** brand-brown, cream
- **Fonts:** NF One Little Font Bold (ad supers), Lemonade (video supers)
- **Voice:** short, punchy, emotionally resonant, direct. Avoid anything clever, wordy, or overtly salesy. Hooks and CTAs get the most iteration; structural/middle lines lock early.

## Marketing
- Paid **Meta** campaigns — Send Message objective, Dubai-targeted audiences, product video creative.
- **World Cup–themed campaign** across all six menu items: three-shot structure per item (Stadium → Trophy/Walkout → Showcase), consistent cinematic style for cohesion.
- **AI video:** Kling (primary), Higgsfield (secondary, unreliable). Medium-low motion settings for controlled outputs.

## Constraints & principles
- **Legal:** never use real footballer likenesses or name specific athletes — false endorsement risk. Use generic kit descriptions instead.
- **Ad creative fixes:** the recurring failure pattern is no CTA to Send Message, no on-screen text for mute viewing, and brand/offer appearing too late. Fix by recutting existing footage with supers + CTA — not reshooting.

## Working with Marwan
- Moves fast, in short iterative bursts. Confirms choices in-chat and keeps going.
- Wants 2–3 variants, not exhaustive option lists.
- Instinct-driven editor — will redirect or reject and expect a quick rebuild without a long explanation.
- Flag risks (legal, creative, technical) proactively but concisely, then move to the solution.

---

# Repository (technical)

The codebase is a [Next.js 12](https://nextjs.org/) demo forked from `alisolanki/openai-startup-name-generator` — a single-page app that calls the OpenAI completions API to suggest startup names. It is not the focus of the Dee's Treats work but is here if needed.

## Commands
```bash
npm install      # install deps
npm run dev      # local dev server at http://localhost:3000
npm run build    # production build
npm run start    # serve production build
```
There is no test or lint setup. Requires `OPENAI_API_KEY` in `.env` (copy from `.env.example`).

## Structure
- `pages/index.js` + `pages/index.module.css` — the single UI page (form → results).
- `pages/api/generate.js` — serverless API route. Builds a few-shot prompt and calls `text-davinci-002`. Note: it accepts a per-request `openaiApiKey` in the body to override the env key, and the prompt is hardcoded few-shot examples — edit `generatePrompt()` to change behavior.
- `public/` — static assets.

## Installed Claude skills
`.claude/skills/` and `.claude/agents/` contain a **real-estate analyst suite** (`realestate-*`). Unrelated to Dee's Treats — leave it unless asked.
