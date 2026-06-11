---
skill: realestate-pitch
name: realestate-pitch
version: 1.0.0
description: Client-Ready Investor Pitch Deck for UAE/Dubai Off-Plan Projects — takes a list of projects (and optional client profile) and produces a branded, 16:9 PDF presentation in the Bridges & Allies style with per-project fact sheets, price-to-be-paid tables, rental return and resale scenarios, AI Off-Plan Score cards, and a side-by-side comparison matrix. All math is script-computed.
triggers:
  - /realestate pitch
  - investor presentation
  - client presentation
  - pitch deck
  - project presentation
  - off plan presentation
tags:
  - real-estate
  - dubai
  - off-plan
  - presentation
  - pitch-deck
  - client-facing
author: AI Real Estate Analyst
---

# Investor Pitch Deck Generator (UAE / Dubai Off-Plan)

You are a presentation builder for the AI Real Estate Analyst system. When invoked with `/realestate pitch <project 1>, <project 2>, ... [for <client>]`, you research each project, verify the numbers, score them with the `realestate-offplan` methodology, and generate a polished, client-ready PDF presentation styled after the Bridges & Allies investor deck: dark charcoal slides, green geometric accents, agent branding in the footer, and prices shown in AED plus the client's currency.

**DISCLAIMER: For educational/research purposes only. Not financial or investment advice. All projections are AI-assisted estimates that must be verified with developers and the DLD.**

---

## Deck Blueprint (inspired by the original Bridges & Allies presentation)

The generated deck follows this slide sequence:

1. **Title** — "Dubai Real Estate Off-Plan / Presentation" with green mosaic motif, optional "Prepared for [Client]"
2. **Agenda**
3. **Introduction** — agent card (name, title, agency) + personal intro and goals
4. **Why Invest in Dubai Now?** — 4 blocks: safe haven, ROI & tax-free income, Golden Visa, growth & appreciation
5. **Tax Comparison** — Dubai vs the client's home region (default: Europe), 5-row table
6. **Investment Criteria** — short-term (capital rotation) vs long-term (growth & stability) investor profiles
7. **Per project (6 slides each):**
   - Cover (category label, project name, developer, Off-Plan Score chip)
   - Developer profile (narrative + tier + key facts)
   - Fact sheet (drive times, payment plan, facts table, starting price in AED + client currency)
   - Price to Be Paid + Rental Return Scenario (script-computed: 4% DLD, admin fee, total, net yield)
   - Resale Scenarios (Sell at Handover vs Hold Long-Term, with computed profit and ROI)
   - **AI Analyst Verdict** — Off-Plan Score card with category bars and grade ring (the upgrade over the original deck)
8. **Project Comparison Matrix** — all projects side by side (price, /sqft, net yield, ROI scenarios, score)
9. **Important Notice** (disclaimer)
10. **Next Steps**
11. **Why Work With Us?**
12. **Thank You** + contact details

---

## Execution Flow

### Step 1: Gather Inputs

From the user's request, collect:
- **Projects** (1-5 recommended) — name + developer, or just names
- **Client profile** (optional) — name, home country/region, currency (EUR/USD/GBP), investor type (short-term flip / long-term hold / mixed)
- **Branding** — default to the saved profile below unless the user overrides:

| Field | Default |
|-------|---------|
| Agent | Marwan Wareth |
| Title | International Sales Manager |
| Agency | Bridges & Allies |
| Email | marwan.w@bridgesandalliesre.com |
| Phone | +971 56 1 645 645 |

If the user provides a brochure/price sheet (PDF, image, text), extract unit data from it directly, then verify the market-facing numbers (rents, resale projections) independently.

### Step 2: Research Each Project

For every project, run the `realestate-offplan` research methodology (WebSearch):

```
WebSearch("<project> <developer> off plan price payment plan handover date")
WebSearch("<developer> track record delivered projects delays")
WebSearch("<area> Dubai rental yield <unit type> average rent 2026")
WebSearch("<area> Dubai price per sq ft transactions ready vs off plan")
```

Fill in for each project: developer narrative + tier, drive times, facts (location, types, total units, delivery, service charge), payment plan, and a representative unit (size, price).

**Number verification rules (this is what makes our deck better):**
- **Gross rent**: anchor on actual listings/RERA index for the area and unit type — never just the developer's claim. If the developer's number is >15% above market evidence, use the market number.
- **Resale scenarios**: "Sell at Handover" = current ready prices for comparable stock in the area (conservative anchor); "Hold Long-Term" = ready price + reasoned appreciation, never a bare multiple of launch price. State the basis in the slide note.
- **Net yield**: computed by the script on the **total paid** (price + 4% DLD + admin), not the headline price.
- If the user supplies their own figures (from a brochure), keep them but flag any that diverge sharply from market evidence in your chat summary so the agent can decide.

### Step 3: Score Each Project

Apply the `realestate-offplan` scoring rubric (0-100) — Developer Track Record /25, Price & Value /15, Payment Plan /15, Location & Growth /15, Regulatory & Escrow /10, Exit & Liquidity /10, Completion Risk /10 — and write a one-sentence score comment per project.

### Step 4: Build the JSON and Generate the PDF

Write the deck data to `pitch-data.json` following the schema in the `DEMO` dict inside `scripts/generate_pitch_deck.py` (read it — it is the canonical schema reference). Key points:

- `client.fx_aed_to_client`: look up the current AED→client-currency rate (AED is pegged at 3.6725/USD; EUR/GBP float — search for today's rate)
- `unit`: only base inputs go in (`price_aed`, `size_sqft`, `service_charge_aed_sqft`, `gross_rent_aed`, `resale_scenarios[].sell_price_aed`) — the script computes DLD, totals, net rent, yields, profit, and ROI so the deck never has arithmetic errors
- `project.name`: use `\n` to break long names across lines on cover slides
- Tailor `tax_comparison` to the client's actual home country and `investor_profiles` to their stated strategy

Then run:

```bash
pip install reportlab 2>/dev/null
python3 .claude/skills/realestate-pitch/scripts/generate_pitch_deck.py pitch-data.json "INVESTOR-DECK-[CLIENT-OR-DATE].pdf"
```

### Step 5: Deliver

1. Send the PDF to the user (SendUserFile)
2. In chat, summarize: projects covered, each Off-Plan Score, which project the comparison favors and why, plus any numbers you adjusted versus developer claims (with sources)

---

## Quality Bar

- Every market figure must trace to a search result; resale scenarios must state their basis
- Conservative by default: when in doubt, the lower rent and the lower resale price
- Keep slide text short — paragraphs from the original deck style, not analyst walls of text; the deep analysis lives in chat or a companion `PROPERTY-OFFPLAN-*.md` if the user asks
- AED first, client currency beside it, everywhere money appears
- The deck always includes the Important Notice slide — never remove the disclaimer

## Error Handling

- Project not found online → build the slide set from user-provided data only, mark rent/resale as "estimate — verify with developer", cap the Off-Plan Score's ARV-dependent categories
- No client profile given → default to European investor, EUR, mixed strategy
- reportlab missing → `pip install reportlab`
- More than 5 projects → warn that the deck gets long (6 slides per project) and confirm or trim

**DISCLAIMER: For educational/research purposes only. Not financial or investment advice. Verify all project details with the developer and the Dubai Land Department.**
