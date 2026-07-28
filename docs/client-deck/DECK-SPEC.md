# Client deck — 3-project comparison (source spec)

Built from Marwan's existing presentation slides, shared in batches.
This file is the single source of truth for the Claude Design build.

---

## Deck template (per project — 4 slides, this exact order)

1. **Title** — kicker (`High End Apartments`) · project name · `Developer : [name]` · 📍 location
2. **Developer** — big "Developer" wordmark + name, right-hand descriptive paragraph block
3. **Project overview** — header strip (location highlights + starting price), photo grid
   (5 images: hero exterior, interior, bedroom, pool/amenity, view), right-hand fact table,
   price ladder by bedroom, payment plan, `Project Location` link bar at the bottom
4. **Price to be paid + rental return** — two stacked tables, dual currency AED | EURO

### Visual system
- Full-bleed project render as background, heavy dark overlay, white type
- **Green accent** (bright/lime) — used on the logo lozenge, name flourish, developer name
- Tables: transparent rows, thin light 1px borders, generous row height
- Top-left persistent project chip: project name + `By [developer]`, green highlight
- Bottom-left credit: `Marwan Wareth`
- Top-right watermark: `BRANDED RESIDENCES BY …`
- Fonts: bold geometric sans for headings, light sans for body/tables

### Table structure — reuse verbatim
**PRICE TO BE PAID** — `For a [SIZE] SQFT [TYPE] : [EUR PRICE]`
| row | AED | EURO |
|---|---|---|
| Unit Price · DLD Registration Fee 4% · Admin Fee · Avg Price / Sqft · **Total** | ✓ | ✓ |

**RENTAL RETURN SCENARIO**
| row | AED | EURO |
|---|---|---|
| Avg Gross Rental Estimate · Unit Size · Service Charge · Net Rental Estimate · **Net Rental Yield** | ✓ | ✓ |

FX used throughout: **1 EUR ≈ 4.29 AED** (consistent across all rows — keep it)
Yield basis: Net Rental ÷ **Total** cost incl. fees (178,160 ÷ 2,928,856 = 6.1% ✓)

---

## FORMAT REFERENCE EXAMPLE — Villa Del Garda

> Not one of the three client projects. This is a worked example of the table format,
> field list, and math conventions to replicate. Keep the structure, swap the content.

| | |
|---|---|
| Developer | Mr 8 |
| Location | Dubai Islands |
| Positioning | High End Apartments · branded residences |
| Types | 1, 2, 2-duplex, 3–5 bedrooms |
| Total units | **135** |
| Delivery | 2027 |
| Service charge | AED 30 / sqft |
| Starting price | €655,000 |

**Location highlights:** directly on the sea, 270° open view · ~20 min Dubai Mall · ~15 min DXB

**Price ladder:** 1 Bed €655,000 · 2 Beds €961,446 · 3 Beds €1,900,000 · 5 PH on request

**Payment plan:** 20% down payment · 15% during construction (3 installments) · 65% on completion

**Developer note (Mr 8):** boutique luxury developer, low-density design-led residential,
exclusivity + architectural integrity + long-term value. Limited residence count →
scarcity and price resilience. Optional white-glove services incl. chauffeured Rolls-Royce
airport transfers.

### Priced unit — 1 BR, 728 sqft
| | AED | EURO |
|---|---:|---:|
| Unit Price | 2,811,160 | €655,000 |
| DLD Registration Fee 4% | 112,446 | €26,200 |
| Admin Fee | 5,250 | €1,223 |
| Avg Price / Sqft | 3,980 | €927 |
| **Total** | **2,928,856** | **€682,917** |

| Rental return | AED | EURO |
|---|---:|---:|
| Avg Gross Rental Estimate | 200,000 | €46,600 |
| Unit Size | 728 sqft | — |
| Service Charge | 21,840 | €5,089 |
| Net Rental Estimate | 178,160 | €41,511 |
| **Net Rental Yield** | **6.1%** | |

**Fix on rebuild:** the price table's first header cell reads `Studio` but the unit is a
1 BR / 728 sqft — should read `1 Bedroom`.

---

---

# The three client projects

## PROJECT 1 — **Floareá Skies** by Mashriq Elite Developments

**Slide content written up: [`PROJECT-1-FLOAREA-SKIES.md`](PROJECT-1-FLOAREA-SKIES.md)**
Sourced from the attached brochure + deliverables PDFs. **17 renders extracted** to
[`img/floarea/`](img/floarea/README.md).

JVC Dubai · Studio/1BR/2BR · G+4P+19 floors · 192 units (CONFIRM) · Q3–Q4 2027 (CONFIRM) ·
1BR from AED 1,050,000 / 717 sqft (CONFIRM — not in brochure) · 50/50 payment plan ·
fully fitted · 4% DLD waiver (CONFIRM)

_(The `eddy.pro/pdf/7374005` link was blocked by egress policy; superseded by the attached PDFs.)_

## PROJECT 2 — Anarcia → correct name **Arancia at The Yards** by BEYOND (OMNIYAT)

**Slide content written up: [`PROJECT-2-ANARCIA.md`](PROJECT-2-ANARCIA.md)** — all four slides,
sourced from public data (not the brochure). Service charge and gross rent are flagged
ASSUMED there and must be replaced from the price list.

City of Arabia, Dubailand · 272 units, 3 low-rise G+6/G+7 · 1–3 BR · Q1 2029 ·
1BR from AED 1,000,000 (750–762 sqft) · 40/60 payment plan

### Visual character (from renders — use for the deck's art direction)
Low-to-mid-rise garden community, not a tower. Warm sand/limestone and brick façades,
timber slat screens, deep planted balconies, terraced rooftop greenery. Buildings frame
large landscaped courtyards with citrus groves (orange + lemon trees), fountains, water
features, curved seating terraces and lawns. Palette is warm neutral — cream, sand,
travertine, pale oak, with green accents.

Interiors: soft-modern, light and airy. Full-height glazing to balconies, cream/oak
palette, marble-veined backsplashes and counters, sculptural pendant lighting, curved
furniture, stone-look large-format floor tiles. Bedrooms open directly to planted
balconies overlooking the courtyard.

### Render set (5) — mapped to the 5-image grid on the overview slide
1. Living + dining, ring pendants, terrace beyond — **hero interior**
2. Living + kitchen, green velvet sofa, marble backsplash — second interior
3. Bedroom with planted balcony
4. Balcony view over courtyard with citrus grove + fountain
5. Golden-hour courtyard view between buildings — **hero exterior**

**Positioning angle this supports:** community/lifestyle and greenery — the opposite of
the sea-view tower pitch. Worth making that contrast explicit in the head-to-head.

## PROJECT 3 — **Tarrad Celesto Tower 4** by Al Tarrad Development

**Slide content written up: [`PROJECT-3-CELESTO-4.md`](PROJECT-3-CELESTO-4.md)** ·
images in [`img/celesto/`](img/celesto/README.md)

DLRC / Wadi Al Safa 5 · 3B+G+M+3P+21 floors · **414 units** (162 studio / 180 1BR / 72 2BR) ·
Q4 2028 · from AED 540,000 (studio) · 50/50 with 1% monthly × 30 · fully furnished ·
1 min to Blue Line metro · 18 min to Downtown/DIFC/DXB

🚩 **Blocker: no 1BR price.** Only the studio entry (AED 540–560k) is public. The AED 823,000
figure online is the *earlier* Celesto Tower project, not Celesto 4 — do not carry it across.

---

# Cross-project comparison (the head-to-head slide)

| | Floareá Skies | Arancia | Celesto 4 |
|---|---|---|---|
| Location | JVC | City of Arabia | DLRC / Wadi Al Safa 5 |
| Developer | Mashriq Elite | BEYOND (OMNIYAT) | Al Tarrad |
| Handover | **Q1 2028** | Q1 2029 | Q4 2028 |
| Total units | **192** | 272 | 414 |
| 1BR size | **837.54 sqft** | 750–762 sqft | 550–598 sqft |
| 1BR all-in | AED 1,204,160 | AED 1,045,250 | **~837,250 (est)** |
| Price/sqft | 1,378 | **1,333** | 1,454 (est) |
| Net yield | 5.7% | 6.1% | **6.2% (studio 6.6%)** |
| Capital pre-handover | **30%** | 40% | 50%, 1%/month |
| Furnished | **Yes** | No | **Yes** |
| DLD 4% | Payable (confirmed) | Payable | Confirm |

Floareá's row is from sales offer S 611 (18 Jul 2026) — confirmed, not estimated.

## Two-bedroom
| | Floareá | Arancia | Celesto 4 |
|---|---|---|---|
| Price from | AED 1,900,000 | AED 2,100,000 | **AED 1,320,000** |
| Size | **size needed** | 1,100–1,179 sqft | 852–1,070 sqft |
| Price/sqft | needs size | 1,909 | **1,550** |
| Step-up vs own 1BR/sqft | needs size | +43% | **+7%** |
| All-in (price + 4% DLD + admin) | 1,980,000 | 2,189,250 | **1,378,050** |

**Key finding:** Celesto's 2BR is 851.64 sqft — 14 sqft larger than Floareá's *1BR* (837.54)
for AED 173,890 more all-in. Same footprint, extra bedroom.
| Units of type | to confirm | to confirm | 72 of 414 |

**Three genuinely different propositions, not a ranking:**
- **Floareá** — income starts soonest (2027), fitted, proven JVC leasing market. Boutique developer risk.
- **Arancia** — best developer and the only real community product. Longest wait.
- **Celesto 4** — cheapest entry, gentlest payment plan, best transport. Highest density by far.

---

## Data still needed
| Project | Outstanding |
|---|---|
| Floareá Skies | **2 BR sizes (price confirmed at 1.9M)** · service charge · unit count · kitchen spec · is FS 611 still available (1 BR now confirmed) |
| Arancia | service charge · confirm 1BR entry (1.0M vs 1.1M) · **2 BR sizes** · drive times · handover quarter · **render files (pasted images can't be read — send as attachments)** |
| Celesto 4 | **1BR price list (2BR confirmed at 1.32M)** · service charge · DLD status · Celesto 1–3 delivery record |

**Common to all three: service charge in writing.** It moves net yield 0.7–1.0 points and is
unpublished for every one of them.
