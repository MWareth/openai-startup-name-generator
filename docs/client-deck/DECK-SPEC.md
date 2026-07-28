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

## PROJECT 1 — _awaiting batch_

## PROJECT 2 — _awaiting batch_

## PROJECT 3 — _awaiting batch_
