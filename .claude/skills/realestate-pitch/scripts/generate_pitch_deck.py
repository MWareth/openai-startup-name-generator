#!/usr/bin/env python3
"""
Investor Pitch Deck Generator — AI Real Estate Claude Code Skills
Generates a client-ready, 16:9 landscape PDF presentation for UAE/Dubai
off-plan projects, styled after the Bridges & Allies investor deck:
dark charcoal slides, green geometric accents, agent footer branding.

All financial figures (DLD fee, totals, net rent, yields, resale ROI) are
COMPUTED by this script from base inputs so the deck never contains
arithmetic errors. Currency conversion uses the provided fx rate.

Requires: reportlab (pip install reportlab)

Usage:
  python3 generate_pitch_deck.py                      # Demo mode
  python3 generate_pitch_deck.py data.json            # From JSON
  python3 generate_pitch_deck.py data.json deck.pdf   # Custom output
"""

import sys
import json
from datetime import datetime

try:
    from reportlab.lib.units import inch
    from reportlab.lib.colors import HexColor
    from reportlab.pdfgen import canvas as pdfcanvas
except ImportError:
    print("Error: reportlab is required. Install with: pip install reportlab")
    sys.exit(1)

# 16:9 slide
PAGE_W, PAGE_H = 13.333 * inch, 7.5 * inch
MARGIN = 0.55 * inch

C = {
    "bg": HexColor("#101312"),
    "bg_panel": HexColor("#1a1f1c"),
    "green": HexColor("#4caf6d"),
    "green_dark": HexColor("#2e7d44"),
    "green_deep": HexColor("#1f5530"),
    "green_light": HexColor("#8fc49a"),
    "white": HexColor("#f5f7f5"),
    "gray": HexColor("#9aa39c"),
    "gray_dark": HexColor("#39413c"),
    "amber": HexColor("#e0b84a"),
    "red": HexColor("#d9534f"),
}

GRADE_COLORS = {"A+": "#4caf6d", "A": "#4caf6d", "B": "#e0b84a",
                "C": "#e0b84a", "D": "#d9534f", "F": "#d9534f"}


def fmt(n, dec=0):
    if n is None:
        return "—"
    return f"{n:,.{dec}f}"


def grade_for(score):
    if score >= 85: return "A+"
    if score >= 70: return "A"
    if score >= 55: return "B"
    if score >= 40: return "C"
    if score >= 25: return "D"
    return "F"


# ---------------------------------------------------------------------------
# Financial computation — single source of truth for all deck numbers
# ---------------------------------------------------------------------------

def compute_financials(project, fx, admin_fee_aed=5250):
    """Derive every financial figure from base inputs in project['unit']."""
    u = project["unit"]
    price = u["price_aed"]
    size = u["size_sqft"]
    dld = price * 0.04
    total = price + dld + admin_fee_aed
    sc_rate = u.get("service_charge_aed_sqft", 15)
    gross_rent = u.get("gross_rent_aed", 0)
    service = sc_rate * size
    net_rent = gross_rent - service
    fin = {
        "price": price, "size": size, "dld": dld, "admin": admin_fee_aed,
        "psf": price / size, "total": total,
        "gross_rent": gross_rent, "service": service, "net_rent": net_rent,
        "net_yield": (net_rent / total * 100) if total else 0,
        "gross_yield": (gross_rent / total * 100) if total else 0,
    }
    fin["resale"] = []
    for sc in u.get("resale_scenarios", []):
        sell = sc["sell_price_aed"]
        profit = sell - total
        fin["resale"].append({
            "label": sc["label"], "note": sc.get("note", ""),
            "sell": sell, "profit": profit, "roi": profit / total * 100,
        })
    fin["fx"] = fx
    return fin


# ---------------------------------------------------------------------------
# Drawing helpers
# ---------------------------------------------------------------------------

def begin_slide(c, color=None):
    c.setFillColor(color or C["bg"])
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)


def footer(c, br):
    c.setFillColor(C["gray"])
    c.setFont("Helvetica", 7.5)
    c.drawString(MARGIN, 0.28 * inch, br.get("agent_name", ""))
    stamp = br.get("date_stamp", datetime.now().strftime("%b %Y").upper())
    c.drawRightString(PAGE_W - MARGIN, 0.28 * inch, stamp)


def geo_pattern(c, x0, y0, w, h, cols=6, rows=5):
    """Green geometric triangle mosaic (brand motif), corner-anchored."""
    cw, ch = w / cols, h / rows
    shades = [C["green_deep"], C["green_dark"], C["green"], C["green_light"]]
    for r in range(rows):
        for col in range(cols):
            if (r * 7 + col * 3) % 4 == 0:
                continue  # gaps make the mosaic feel organic
            shade = shades[(r + col * 2) % len(shades)]
            x, y = x0 + col * cw, y0 + r * ch
            c.setFillColor(shade)
            p = c.beginPath()
            if (r + col) % 2 == 0:
                p.moveTo(x, y); p.lineTo(x + cw * 0.92, y)
                p.lineTo(x + cw * 0.92, y + ch * 0.92)
            else:
                p.moveTo(x, y); p.lineTo(x, y + ch * 0.92)
                p.lineTo(x + cw * 0.92, y + ch * 0.92)
            p.close()
            c.drawPath(p, stroke=0, fill=1)


def wrap_text(c, text, font, size, max_w):
    words, lines, cur = text.split(), [], ""
    for w in words:
        trial = (cur + " " + w).strip()
        if c.stringWidth(trial, font, size) <= max_w:
            cur = trial
        else:
            if cur: lines.append(cur)
            cur = w
    if cur: lines.append(cur)
    return lines


def para(c, text, x, y, max_w, font="Helvetica", size=10.5,
         color=None, leading=None, max_lines=None):
    """Draw wrapped paragraph top-down from y. Returns y after last line."""
    leading = leading or size * 1.45
    c.setFillColor(color or C["white"])
    c.setFont(font, size)
    lines = wrap_text(c, text, font, size, max_w)
    if max_lines:
        lines = lines[:max_lines]
    for ln in lines:
        c.drawString(x, y, ln)
        y -= leading
    return y


def bullet_list(c, items, x, y, max_w, size=10.5, gap=6, color=None):
    for it in items:
        c.setFillColor(C["green"])
        c.circle(x + 2.5, y + size * 0.32, 2.2, stroke=0, fill=1)
        y = para(c, it, x + 14, y, max_w - 14, size=size, color=color)
        y -= gap
    return y


def section_label(c, text, x, y):
    c.setFillColor(C["green"])
    c.setFont("Helvetica-Bold", 11)
    c.drawString(x, y, text.upper())
    c.setStrokeColor(C["green_dark"])
    c.setLineWidth(2)
    c.line(x, y - 7, x + 36, y - 7)


def slide_title(c, text, y=None, size=26):
    y = y or PAGE_H - 1.05 * inch
    c.setFillColor(C["white"])
    c.setFont("Helvetica-Bold", size)
    c.drawString(MARGIN, y, text)
    return y - 0.55 * inch


def dark_table(c, x, y_top, col_widths, rows, header=True, row_h=0.34 * inch,
               font_size=9.5, align=None):
    """Simple dark-theme table. rows = list of lists. Returns bottom y."""
    n_cols = len(col_widths)
    align = align or (["left"] + ["right"] * (n_cols - 1))
    y = y_top
    for i, row in enumerate(rows):
        is_header = header and i == 0
        # row background
        if is_header:
            c.setFillColor(C["green_deep"])
        elif i % 2 == (1 if header else 0):
            c.setFillColor(C["bg_panel"])
        else:
            c.setFillColor(C["bg"])
        c.rect(x, y - row_h, sum(col_widths), row_h, stroke=0, fill=1)
        cx = x
        for j, cell in enumerate(row):
            txt = str(cell)
            bold = is_header or (j == 0)
            c.setFont("Helvetica-Bold" if bold else "Helvetica", font_size)
            c.setFillColor(C["white"] if is_header else
                           (C["gray"] if j == 0 else C["white"]))
            if j == 0 and not is_header:
                c.setFillColor(C["white"])
            ty = y - row_h + (row_h - font_size) / 2 + 1
            if align[j] == "right":
                c.drawRightString(cx + col_widths[j] - 8, ty, txt)
            else:
                c.drawString(cx + 8, ty, txt)
            cx += col_widths[j]
        y -= row_h
    c.setStrokeColor(C["gray_dark"])
    c.setLineWidth(0.5)
    c.rect(x, y, sum(col_widths), y_top - y, stroke=1, fill=0)
    return y


def stat_chip(c, x, y, w, h, label, value, value_color=None):
    c.setFillColor(C["bg_panel"])
    c.roundRect(x, y, w, h, 6, stroke=0, fill=1)
    c.setFillColor(C["gray"])
    c.setFont("Helvetica", 8)
    c.drawString(x + 10, y + h - 16, label.upper())
    c.setFillColor(value_color or C["green"])
    c.setFont("Helvetica-Bold", 15)
    c.drawString(x + 10, y + 10, value)


# ---------------------------------------------------------------------------
# Slides
# ---------------------------------------------------------------------------

def slide_cover(c, d):
    br = d["branding"]
    begin_slide(c)
    geo_pattern(c, PAGE_W * 0.52, PAGE_H * 0.30, PAGE_W * 0.48, PAGE_H * 0.70)
    c.setFillColor(C["white"])
    c.setFont("Helvetica-Bold", 38)
    y = PAGE_H * 0.52
    for line in d["deck"]["title_lines"]:
        c.drawString(MARGIN, y, line)
        y -= 0.62 * inch
    c.setFillColor(C["green"])
    c.setFont("Helvetica-Bold", 38)
    c.drawString(MARGIN, y, d["deck"].get("title_accent", "Presentation"))
    if d["deck"].get("prepared_for"):
        c.setFillColor(C["gray"])
        c.setFont("Helvetica", 13)
        c.drawString(MARGIN, y - 0.55 * inch,
                     f"Prepared for {d['deck']['prepared_for']}")
    footer(c, br)
    c.showPage()


def slide_agenda(c, d):
    begin_slide(c)
    geo_pattern(c, -PAGE_W * 0.06, -PAGE_H * 0.1, PAGE_W * 0.30, PAGE_H * 0.42)
    c.setFillColor(C["gray"])
    c.setFont("Helvetica-Bold", 16)
    c.drawString(MARGIN, PAGE_H - 1.2 * inch, "Presentation")
    c.setFillColor(C["white"])
    c.setFont("Helvetica-Bold", 26)
    c.drawString(MARGIN, PAGE_H - 1.62 * inch, "Agenda")
    x = PAGE_W * 0.40
    y = PAGE_H - 1.3 * inch
    for i, item in enumerate(d["deck"]["agenda"], 1):
        c.setFillColor(C["green"])
        c.setFont("Helvetica-Bold", 13)
        c.drawString(x, y, f"{i:02d}")
        c.setFillColor(C["white"])
        c.setFont("Helvetica", 15)
        c.drawString(x + 0.45 * inch, y, item)
        y -= 0.62 * inch
    footer(c, d["branding"])
    c.showPage()


def slide_intro(c, d):
    br = d["branding"]
    begin_slide(c)
    section_label(c, "Introduction", MARGIN, PAGE_H - 0.85 * inch)
    # Agent card on left
    cx, cy, cw, chh = MARGIN, PAGE_H * 0.28, 3.0 * inch, 3.4 * inch
    c.setFillColor(C["bg_panel"])
    c.roundRect(cx, cy, cw, chh, 8, stroke=0, fill=1)
    c.setFillColor(C["green_dark"])
    c.circle(cx + cw / 2, cy + chh - 0.85 * inch, 0.55 * inch, stroke=0, fill=1)
    c.setFillColor(C["white"])
    c.setFont("Helvetica-Bold", 24)
    initials = "".join(w[0] for w in br["agent_name"].split()[:2]).upper()
    c.drawCentredString(cx + cw / 2, cy + chh - 0.95 * inch, initials)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(cx + cw / 2, cy + 1.25 * inch, br["agent_name"])
    c.setFillColor(C["gray"])
    c.setFont("Helvetica", 10)
    c.drawCentredString(cx + cw / 2, cy + 1.0 * inch, br.get("agent_title", ""))
    c.setFillColor(C["green"])
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(cx + cw / 2, cy + 0.72 * inch, br.get("agency", ""))
    # Intro text right
    tx = MARGIN + 3.5 * inch
    tw = PAGE_W - tx - MARGIN
    y = PAGE_H - 1.35 * inch
    for paragraph in d["deck"]["intro_paragraphs"]:
        y = para(c, paragraph, tx, y, tw, size=11.5)
        y -= 10
    if d["deck"].get("intro_goals"):
        c.setFillColor(C["green"])
        c.setFont("Helvetica-Bold", 11.5)
        c.drawString(tx, y, "The goal is simple:")
        y -= 22
        y = bullet_list(c, d["deck"]["intro_goals"], tx, y, tw, size=11)
    footer(c, br)
    c.showPage()


def slide_why_dubai(c, d):
    begin_slide(c)
    section_label(c, "Why Invest in Dubai Now?", MARGIN, PAGE_H - 0.85 * inch)
    y = slide_title(c, d["deck"]["why_dubai"]["headline"], PAGE_H - 1.35 * inch, 19)
    blocks = d["deck"]["why_dubai"]["blocks"]
    col_w = (PAGE_W - 2 * MARGIN - 0.4 * inch) / 2
    positions = [(MARGIN, PAGE_H * 0.555), (MARGIN + col_w + 0.4 * inch, PAGE_H * 0.555),
                 (MARGIN, PAGE_H * 0.155), (MARGIN + col_w + 0.4 * inch, PAGE_H * 0.155)]
    for (bx, by), block in zip(positions, blocks[:4]):
        bh = PAGE_H * 0.345
        c.setFillColor(C["bg_panel"])
        c.roundRect(bx, by, col_w, bh, 8, stroke=0, fill=1)
        c.setFillColor(C["green"])
        c.setFont("Helvetica-Bold", 12.5)
        c.drawString(bx + 14, by + bh - 24, block["title"])
        yy = by + bh - 46
        for it in block["points"]:
            yy = para(c, "•  " + it, bx + 14, yy, col_w - 28, size=9.8,
                      color=C["white"], leading=13.5)
            yy -= 3
    footer(c, d["branding"])
    c.showPage()


def slide_tax_compare(c, d):
    tc = d["deck"].get("tax_comparison")
    if not tc:
        return
    begin_slide(c)
    section_label(c, tc.get("label", "The Investor Perspective"),
                  MARGIN, PAGE_H - 0.85 * inch)
    slide_title(c, tc["headline"], PAGE_H - 1.35 * inch, 19)
    w = PAGE_W - 2 * MARGIN
    cols = [w * 0.30, w * 0.35, w * 0.35]
    rows = [["Tax Type", "Dubai (UAE)", tc.get("region_label", "Typical Europe")]]
    rows += [[r["type"], r["dubai"], r["other"]] for r in tc["rows"]]
    dark_table(c, MARGIN, PAGE_H - 1.85 * inch, cols, rows,
               row_h=0.52 * inch, font_size=10,
               align=["left", "left", "left"])
    if tc.get("footnote"):
        para(c, tc["footnote"], MARGIN, 0.75 * inch, w, size=9, color=C["gray"])
    footer(c, d["branding"])
    c.showPage()


def slide_investor_profiles(c, d):
    ip = d["deck"].get("investor_profiles")
    if not ip:
        return
    begin_slide(c)
    section_label(c, "Investment Criteria", MARGIN, PAGE_H - 0.85 * inch)
    y = slide_title(c, ip["headline"], PAGE_H - 1.35 * inch, 18)
    if ip.get("context"):
        y = para(c, ip["context"], MARGIN, PAGE_H - 1.75 * inch,
                 PAGE_W - 2 * MARGIN, size=10, color=C["gray"])
    col_w = (PAGE_W - 2 * MARGIN - 0.4 * inch) / 2
    top = y - 16
    for i, prof in enumerate(ip["profiles"][:2]):
        bx = MARGIN + i * (col_w + 0.4 * inch)
        bh = top - 0.75 * inch
        c.setFillColor(C["bg_panel"])
        c.roundRect(bx, 0.65 * inch, col_w, bh, 8, stroke=0, fill=1)
        c.setFillColor(C["green"])
        c.setFont("Helvetica-Bold", 13)
        c.drawString(bx + 16, 0.65 * inch + bh - 26, prof["title"])
        yy = 0.65 * inch + bh - 50
        yy = bullet_list(c, prof["points"], bx + 16, yy, col_w - 32,
                         size=9.8, gap=5)
    footer(c, d["branding"])
    c.showPage()


def slide_project_cover(c, d, p, idx, total):
    begin_slide(c)
    geo_pattern(c, PAGE_W * 0.62, 0, PAGE_W * 0.38, PAGE_H, cols=4, rows=7)
    c.setFillColor(C["gray"])
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN, PAGE_H * 0.70, f"PROJECT {idx} OF {total}")
    if p.get("category"):
        c.setFillColor(C["amber"])
        c.setFont("Helvetica-Bold", 13)
        c.drawString(MARGIN, PAGE_H * 0.63, p["category"].upper())
    c.setFillColor(C["white"])
    c.setFont("Helvetica-Bold", 44)
    y = PAGE_H * 0.48
    for word_line in p["name"].split("\n"):
        c.drawString(MARGIN, y, word_line)
        y -= 0.75 * inch
    c.setFillColor(C["gray"])
    c.setFont("Helvetica", 15)
    c.drawString(MARGIN, y, "Developer : ")
    c.setFillColor(C["green"])
    c.setFont("Helvetica-Bold", 15)
    c.drawString(MARGIN + c.stringWidth("Developer : ", "Helvetica", 15), y,
                 p["developer"])
    if "score" in p:
        s = p["score"]["total"]
        g = p["score"].get("grade", grade_for(s))
        stat_chip(c, MARGIN, PAGE_H * 0.13, 2.4 * inch, 0.7 * inch,
                  "Off-Plan Score", f"{s}/100  ({g})",
                  HexColor(GRADE_COLORS.get(g, "#4caf6d")))
    footer(c, d["branding"])
    c.showPage()


def slide_developer(c, d, p):
    begin_slide(c)
    section_label(c, "Developer", MARGIN, PAGE_H - 0.85 * inch)
    c.setFillColor(C["green"])
    c.setFont("Helvetica-Bold", 24)
    c.drawString(MARGIN, PAGE_H - 1.45 * inch, p["developer"])
    tier = p.get("developer_tier")
    if tier:
        c.setFillColor(C["gray"])
        c.setFont("Helvetica-Bold", 10.5)
        c.drawString(MARGIN, PAGE_H - 1.75 * inch, tier)
    tx, tw = PAGE_W * 0.40, PAGE_W * 0.60 - MARGIN
    y = PAGE_H - 1.15 * inch
    y = para(c, p["developer_profile"], tx, y, tw, size=11, leading=17)
    if p.get("developer_facts"):
        y -= 12
        y = bullet_list(c, p["developer_facts"], tx, y, tw, size=10)
    footer(c, d["branding"])
    c.showPage()


def slide_fact_sheet(c, d, p, fin):
    fx, cur = fin["fx"], d["client"]["currency_symbol"]
    begin_slide(c)
    c.setFillColor(C["white"])
    c.setFont("Helvetica-Bold", 22)
    c.drawString(MARGIN, PAGE_H - 0.95 * inch, p["name"].replace("\n", " "))
    c.setFillColor(C["gray"])
    c.setFont("Helvetica", 11)
    c.drawString(MARGIN, PAGE_H - 1.25 * inch, f"By {p['developer']}")
    # starting price box top right
    sp = p["facts"].get("starting_price_aed")
    if sp:
        bw = 2.7 * inch
        c.setFillColor(C["green_deep"])
        c.roundRect(PAGE_W - MARGIN - bw, PAGE_H - 1.45 * inch, bw,
                    0.85 * inch, 8, stroke=0, fill=1)
        c.setFillColor(C["green_light"])
        c.setFont("Helvetica", 8.5)
        c.drawString(PAGE_W - MARGIN - bw + 12, PAGE_H - 0.85 * inch,
                     "STARTING PRICE")
        c.setFillColor(C["white"])
        c.setFont("Helvetica-Bold", 16)
        c.drawString(PAGE_W - MARGIN - bw + 12, PAGE_H - 1.12 * inch,
                     f"AED {fmt(sp)}")
        c.setFillColor(C["green_light"])
        c.setFont("Helvetica-Bold", 11)
        c.drawString(PAGE_W - MARGIN - bw + 12, PAGE_H - 1.33 * inch,
                     f"≈ {cur}{fmt(sp * fx)}")
    # left column: drive times + payment plan
    y = PAGE_H - 1.9 * inch
    if p.get("drive_times"):
        c.setFillColor(C["green"])
        c.setFont("Helvetica-Bold", 11)
        c.drawString(MARGIN, y, "CONNECTIVITY")
        y -= 20
        y = bullet_list(c, p["drive_times"], MARGIN, y,
                        PAGE_W * 0.44 - MARGIN, size=10, gap=4)
    y -= 10
    c.setFillColor(C["green"])
    c.setFont("Helvetica-Bold", 11)
    c.drawString(MARGIN, y, "PAYMENT PLAN")
    y -= 20
    y = bullet_list(c, p["payment_plan"], MARGIN, y,
                    PAGE_W * 0.44 - MARGIN, size=10, gap=4)
    # right column: facts table
    f = p["facts"]
    rows = [["Location", f.get("location", "—")],
            ["Unit Types", f.get("types", "—")],
            ["Total Units", f.get("total_units", "—")],
            ["Delivery / Completion", f.get("delivery", "—")],
            ["Service Charge", f.get("service_charge", "—")]]
    for label, val in f.get("price_list", []):
        rows.append([label, val])
    tx = PAGE_W * 0.48
    tw = PAGE_W - tx - MARGIN
    dark_table(c, tx, PAGE_H - 1.95 * inch, [tw * 0.45, tw * 0.55], rows,
               header=False, row_h=0.40 * inch, font_size=10,
               align=["left", "right"])
    footer(c, d["branding"])
    c.showPage()


def slide_price_rental(c, d, p, fin):
    fx, cur = fin["fx"], d["client"]["currency_symbol"]
    begin_slide(c)
    c.setFillColor(C["white"])
    c.setFont("Helvetica-Bold", 20)
    c.drawString(MARGIN, PAGE_H - 0.95 * inch, p["name"].replace("\n", " "))
    c.setFillColor(C["green"])
    c.setFont("Helvetica-Bold", 13)
    c.drawString(
        MARGIN, PAGE_H - 1.3 * inch,
        f"PRICE TO BE PAID — {p['unit']['label']}, {fmt(fin['size'])} sq ft: "
        f"AED {fmt(fin['total'])}  (≈ {cur}{fmt(fin['total'] * fx)})")
    w = PAGE_W - 2 * MARGIN
    cols = [w * 0.4, w * 0.3, w * 0.3]
    rows = [["", "AED", f"{d['client']['currency']}"],
            ["Unit Price", fmt(fin["price"]), cur + fmt(fin["price"] * fx)],
            ["DLD Registration Fee (4%)", fmt(fin["dld"]), cur + fmt(fin["dld"] * fx)],
            ["Admin Fee (Oqood)", fmt(fin["admin"]), cur + fmt(fin["admin"] * fx)],
            ["Avg Price / Sq Ft", fmt(fin["psf"]), cur + fmt(fin["psf"] * fx)],
            ["TOTAL", fmt(fin["total"]), cur + fmt(fin["total"] * fx)]]
    y = dark_table(c, MARGIN, PAGE_H - 1.6 * inch, cols, rows,
                   row_h=0.33 * inch, font_size=10)
    c.setFillColor(C["green"])
    c.setFont("Helvetica-Bold", 12)
    c.drawString(MARGIN, y - 26, "RENTAL RETURN SCENARIO")
    rows2 = [
        ["Avg Gross Rental Estimate / yr", fmt(fin["gross_rent"]),
         cur + fmt(fin["gross_rent"] * fx)],
        [f"Service Charge ({fmt(p['unit'].get('service_charge_aed_sqft', 15))}"
         f" AED/sq ft)", "-" + fmt(fin["service"]),
         "-" + cur + fmt(fin["service"] * fx)],
        ["Net Rental Estimate / yr", fmt(fin["net_rent"]),
         cur + fmt(fin["net_rent"] * fx)],
        ["NET RENTAL YIELD (on total paid)", f"{fin['net_yield']:.1f}%",
         f"gross {fin['gross_yield']:.1f}%"]]
    dark_table(c, MARGIN, y - 38, cols, rows2, header=False,
               row_h=0.33 * inch, font_size=10)
    footer(c, d["branding"])
    c.showPage()


def slide_resale(c, d, p, fin):
    fx, cur = fin["fx"], d["client"]["currency_symbol"]
    begin_slide(c)
    c.setFillColor(C["white"])
    c.setFont("Helvetica-Bold", 20)
    c.drawString(MARGIN, PAGE_H - 0.95 * inch, p["name"].replace("\n", " "))
    c.setFillColor(C["green"])
    c.setFont("Helvetica-Bold", 13)
    c.drawString(MARGIN, PAGE_H - 1.3 * inch,
                 f"RESALE SCENARIOS — originally paid AED {fmt(fin['total'])} "
                 f"(≈ {cur}{fmt(fin['total'] * fx)})")
    col_w = (PAGE_W - 2 * MARGIN - 0.4 * inch) / 2
    for i, sc in enumerate(fin["resale"][:2]):
        bx = MARGIN + i * (col_w + 0.4 * inch)
        by, bh = 1.1 * inch, PAGE_H - 2.85 * inch
        c.setFillColor(C["bg_panel"])
        c.roundRect(bx, by, col_w, bh, 8, stroke=0, fill=1)
        c.setFillColor(C["amber"] if i == 0 else C["green"])
        c.setFont("Helvetica-Bold", 13)
        c.drawString(bx + 16, by + bh - 28, sc["label"])
        if sc["note"]:
            para(c, sc["note"], bx + 16, by + bh - 48, col_w - 32,
                 size=9, color=C["gray"], max_lines=2)
        rows = [["Estimated Selling Price", f"AED {fmt(sc['sell'])}"],
                ["", cur + fmt(sc["sell"] * fx)],
                ["Estimated Profit", f"AED {fmt(sc['profit'])}"],
                ["", cur + fmt(sc["profit"] * fx)]]
        yy = by + bh - 70
        for label, val in rows:
            c.setFillColor(C["gray"])
            c.setFont("Helvetica", 10)
            c.drawString(bx + 16, yy, label)
            c.setFillColor(C["white"])
            c.setFont("Helvetica-Bold", 11)
            c.drawRightString(bx + col_w - 16, yy, val)
            yy -= 22
        c.setFillColor(C["green"])
        c.setFont("Helvetica-Bold", 22)
        c.drawString(bx + 16, by + 16, f"ROI  {sc['roi']:.0f}%")
    footer(c, d["branding"])
    c.showPage()


def slide_score(c, d, p):
    s = p.get("score")
    if not s:
        return
    begin_slide(c)
    section_label(c, "AI Analyst Verdict", MARGIN, PAGE_H - 0.85 * inch)
    c.setFillColor(C["white"])
    c.setFont("Helvetica-Bold", 22)
    c.drawString(MARGIN, PAGE_H - 1.4 * inch,
                 f"{p['name'].replace(chr(10), ' ')} — Off-Plan Score")
    grade = s.get("grade", grade_for(s["total"]))
    gc = HexColor(GRADE_COLORS.get(grade, "#4caf6d"))
    # big score circle
    ccx, ccy, r = PAGE_W - 2.1 * inch, PAGE_H * 0.52, 0.95 * inch
    c.setStrokeColor(C["gray_dark"]); c.setLineWidth(8)
    c.circle(ccx, ccy, r, stroke=1, fill=0)
    c.setStrokeColor(gc)
    c.setLineWidth(8)
    c.arc(ccx - r, ccy - r, ccx + r, ccy + r, 90,
          -int(360 * s["total"] / 100))
    c.setFillColor(C["white"])
    c.setFont("Helvetica-Bold", 30)
    c.drawCentredString(ccx, ccy - 2, str(s["total"]))
    c.setFillColor(gc)
    c.setFont("Helvetica-Bold", 14)
    c.drawCentredString(ccx, ccy - 26, grade)
    c.setFillColor(C["gray"])
    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(ccx, ccy - r - 24, s.get("signal", ""))
    # breakdown bars
    bx, bw = MARGIN, PAGE_W * 0.55
    y = PAGE_H - 2.0 * inch
    for item in s.get("breakdown", []):
        pct = item["points"] / item["max"]
        c.setFillColor(C["white"])
        c.setFont("Helvetica", 10)
        c.drawString(bx, y, item["label"])
        c.setFillColor(C["gray"])
        c.drawRightString(bx + bw, y, f"{item['points']}/{item['max']}")
        c.setFillColor(C["gray_dark"])
        c.roundRect(bx, y - 14, bw, 7, 3, stroke=0, fill=1)
        c.setFillColor(C["green"] if pct >= 0.6 else
                       (C["amber"] if pct >= 0.35 else C["red"]))
        c.roundRect(bx, y - 14, bw * pct, 7, 3, stroke=0, fill=1)
        y -= 0.48 * inch
    if s.get("comment"):
        para(c, s["comment"], bx, y - 4, bw, size=9.5, color=C["gray"])
    footer(c, d["branding"])
    c.showPage()


def slide_comparison(c, d, fins):
    if len(d["projects"]) < 2:
        return
    cur = d["client"]["currency_symbol"]
    begin_slide(c)
    section_label(c, "Side-by-Side", MARGIN, PAGE_H - 0.85 * inch)
    slide_title(c, "Project Comparison", PAGE_H - 1.35 * inch, 22)
    w = PAGE_W - 2 * MARGIN
    n = len(d["projects"])
    first = w * 0.24
    cols = [first] + [(w - first) / n] * n
    header = ["Metric"] + [p["name"].replace("\n", " ") for p in d["projects"]]
    rows = [header]

    def row(label, getter):
        rows.append([label] + [getter(p, f) for p, f in zip(d["projects"], fins)])

    fx = d["client"]["fx_aed_to_client"]
    row("Developer", lambda p, f: p["developer"])
    row("Delivery", lambda p, f: p["facts"].get("delivery", "—"))
    row("Unit Analyzed", lambda p, f: p["unit"]["label"])
    row("Total Price (AED)", lambda p, f: fmt(f["total"]))
    row(f"Total Price ({d['client']['currency']})",
        lambda p, f: cur + fmt(f["total"] * fx))
    row("Price / Sq Ft (AED)", lambda p, f: fmt(f["psf"]))
    row("Net Yield", lambda p, f: f"{f['net_yield']:.1f}%")
    row("ROI @ Handover", lambda p, f:
        f"{f['resale'][0]['roi']:.0f}%" if f["resale"] else "—")
    row("ROI Long-Term", lambda p, f:
        f"{f['resale'][1]['roi']:.0f}%" if len(f["resale"]) > 1 else "—")
    row("Off-Plan Score", lambda p, f:
        f"{p['score']['total']}/100 ({p['score'].get('grade', grade_for(p['score']['total']))})"
        if p.get("score") else "—")
    dark_table(c, MARGIN, PAGE_H - 1.85 * inch, cols, rows,
               row_h=0.40 * inch, font_size=9,
               align=["left"] + ["right"] * n)
    footer(c, d["branding"])
    c.showPage()


def slide_text_page(c, d, label, title, paragraphs, accent_pattern=False):
    begin_slide(c)
    if accent_pattern:
        geo_pattern(c, PAGE_W * 0.74, -PAGE_H * 0.08, PAGE_W * 0.26,
                    PAGE_H * 0.36)
    section_label(c, label, MARGIN, PAGE_H - 0.85 * inch)
    slide_title(c, title, PAGE_H - 1.4 * inch, 24)
    y = PAGE_H - 2.0 * inch
    for ptext in paragraphs:
        y = para(c, ptext, MARGIN, y, PAGE_W * 0.72, size=11.5, leading=18)
        y -= 14
    footer(c, d["branding"])
    c.showPage()


def slide_thanks(c, d):
    br = d["branding"]
    begin_slide(c)
    geo_pattern(c, PAGE_W * 0.55, PAGE_H * 0.42, PAGE_W * 0.45, PAGE_H * 0.58)
    c.setFillColor(C["white"])
    c.setFont("Helvetica-Bold", 40)
    c.drawString(MARGIN, PAGE_H * 0.55, "Thank you")
    c.setFillColor(C["gray"])
    c.setFont("Helvetica", 13)
    c.drawString(MARGIN, PAGE_H * 0.55 - 0.45 * inch,
                 "Please feel free to reach me anytime if you have questions")
    y = PAGE_H * 0.30
    c.setFillColor(C["green"])
    c.setFont("Helvetica-Bold", 15)
    c.drawString(MARGIN, y, br["agent_name"])
    c.setFillColor(C["white"])
    c.setFont("Helvetica", 12)
    if br.get("email"):
        c.drawString(MARGIN, y - 0.3 * inch, br["email"])
    if br.get("phone"):
        c.drawString(MARGIN, y - 0.58 * inch, br["phone"])
    footer(c, br)
    c.showPage()


# ---------------------------------------------------------------------------
# Build
# ---------------------------------------------------------------------------

def build(data, out_path):
    c = pdfcanvas.Canvas(out_path, pagesize=(PAGE_W, PAGE_H))
    c.setTitle(" ".join(data["deck"]["title_lines"]))
    fx = data["client"]["fx_aed_to_client"]
    fins = [compute_financials(p, fx) for p in data["projects"]]

    slide_cover(c, data)
    slide_agenda(c, data)
    slide_intro(c, data)
    slide_why_dubai(c, data)
    slide_tax_compare(c, data)
    slide_investor_profiles(c, data)
    total = len(data["projects"])
    for i, (p, fin) in enumerate(zip(data["projects"], fins), 1):
        slide_project_cover(c, data, p, i, total)
        slide_developer(c, data, p)
        slide_fact_sheet(c, data, p, fin)
        slide_price_rental(c, data, p, fin)
        slide_resale(c, data, p, fin)
        slide_score(c, data, p)
    slide_comparison(c, data, fins)
    slide_text_page(c, data, "Important Notice", "Please Read",
                    data["deck"]["notice_paragraphs"])
    slide_text_page(c, data, "Next Steps", "Where We Go From Here",
                    data["deck"]["next_steps_paragraphs"], accent_pattern=True)
    slide_text_page(c, data, "Why Work With Us?", "Our Commitment",
                    data["deck"]["why_us_paragraphs"], accent_pattern=True)
    slide_thanks(c, data)
    c.save()
    print(f"Deck saved: {out_path}")


# ---------------------------------------------------------------------------
# Demo data — Dubai South sample (structure reference for the skill)
# ---------------------------------------------------------------------------

DEMO = {
    "branding": {
        "agent_name": "Marwan Wareth",
        "agent_title": "International Sales Manager",
        "agency": "Bridges & Allies",
        "email": "marwan.w@bridgesandalliesre.com",
        "phone": "+971 56 1 645 645",
        "date_stamp": "JUN 2026",
    },
    "client": {
        "currency": "EUR", "currency_symbol": "€",
        "fx_aed_to_client": 0.25,
        "region": "Europe",
    },
    "deck": {
        "title_lines": ["Dubai Real Estate", "Off-Plan"],
        "title_accent": "Presentation",
        "prepared_for": "",
        "agenda": ["Introduction", "Why Invest in Dubai?",
                   "The Euro Perspective", "Investment Criteria",
                   "Projects", "Project Comparison", "Next Steps",
                   "Why Work With Us?"],
        "intro_paragraphs": [
            "My name is Marwan Wareth, and I'm honored to guide you through "
            "some of the UAE's — and especially Dubai's — most promising real "
            "estate opportunities.",
            "With over 11 years of experience in the UAE real estate market, "
            "I've worked closely with investors, end users, and developers to "
            "match the right people with the right properties. I represent "
            "Bridges & Allies, a leading real estate agency known for its "
            "integrity, transparency, and client-first approach.",
            "This presentation has been tailored specifically for you, with a "
            "curated selection of high-potential projects based on current "
            "market trends, ROI data, and future appreciation potential.",
        ],
        "intro_goals": [
            "To help you make a confident investment decision",
            "To show you the lifestyle and value these projects offer",
            "To give you a smooth, informative experience during your "
            "property tour in Dubai",
        ],
        "why_dubai": {
            "headline": "One of the safest and most profitable real estate "
                        "markets to invest in today",
            "blocks": [
                {"title": "Safe Haven Amid Global Instability",
                 "points": ["Political stability, safety, and long-term "
                            "security while many regions face uncertainty",
                            "Ranked among the safest cities globally with a "
                            "highly regulated, investor-friendly market"]},
                {"title": "High ROI & Tax-Free Income",
                 "points": ["Strong rental yields, typically 5-8% net in "
                            "growth corridors",
                            "0% income tax and no capital gains tax",
                            "Full ownership and 100% repatriation of profits"]},
                {"title": "Residency Through Investment",
                 "points": ["AED 2M+ investment qualifies for the 10-year "
                            "Golden Visa for you and your family"]},
                {"title": "Ongoing Growth & Capital Appreciation",
                 "points": ["Backed by visionary government initiatives and "
                            "mega projects (D33, Al Maktoum Airport)",
                            "Strong appreciation potential, especially in "
                            "early-phase off-plan properties"]},
            ],
        },
        "tax_comparison": {
            "label": "The Euro Perspective",
            "headline": "Dubai Tax vs Typical European Tax",
            "region_label": "Typical Europe (Germany, France, UK)",
            "rows": [
                {"type": "Income Tax on Rental Income",
                 "dubai": "0% — rental income is tax-free locally",
                 "other": "Up to 45%, significantly reducing net yields"},
                {"type": "Annual Property Tax",
                 "dubai": "0% — no recurring ownership tax",
                 "other": "0.2%-2.5%+ of property value every year"},
                {"type": "Capital Gains Tax",
                 "dubai": "0% — full profit retained on resale",
                 "other": "Up to 25-36%+ (Germany 25%, France ~36%)"},
                {"type": "Inheritance / Wealth Tax",
                 "dubai": "0% on property transfers",
                 "other": "Up to 40%+ depending on value and relation"},
                {"type": "Transfer / Registration Fees",
                 "dubai": "4% one-time DLD fee",
                 "other": "4-10% stamp duty plus notary costs"},
            ],
            "footnote": "Verify your personal tax position in your country "
                        "of tax residence — worldwide-income rules may apply.",
        },
        "investor_profiles": {
            "headline": "Two Ways to Win in Dubai Real Estate",
            "context": "Dubai's population profile has structurally shifted "
                       "toward longer-term, family-oriented residents, "
                       "creating more predictable demand for both strategies.",
            "profiles": [
                {"title": "Short-Term Investor (Capital Rotation)",
                 "points": [
                     "Focus: off-plan launches, early-phase pricing, "
                     "emerging locations, exit before or near handover",
                     "Typical timeframe: 12-24 months",
                     "Return profile: 8-12% annualized, mainly price "
                     "appreciation",
                     "Risks: market timing, liquidity, transaction costs "
                     "(DLD, agent fees)"]},
                {"title": "Long-Term Investor (Growth & Stability)",
                 "points": [
                     "Focus: established family communities, townhouses, "
                     "prime residential locations",
                     "Typical timeframe: 5-10 years",
                     "Return profile: 6-8% net rental yields plus 40-70% "
                     "appreciation over 5-7 years in prime areas",
                     "Upside: low turnover, tenant loyalty, compounding "
                     "value, long-term visa benefits"]},
            ],
        },
        "notice_paragraphs": [
            "This document was prepared using data from developers and "
            "trusted public sources. While we strive for accuracy, we do not "
            "guarantee the completeness or correctness of the information; "
            "figures may vary with average pricing. Details may change "
            "without notice.",
            "Rental estimates, resale scenarios, and scores are AI-assisted "
            "research approximations, not guarantees. Please make your "
            "purchase decision after reviewing the sales contract (SPA), "
            "verifying project registration and escrow with the Dubai Land "
            "Department, and based on your own judgment.",
            "This presentation is for educational and research purposes and "
            "is not financial or investment advice.",
        ],
        "next_steps_paragraphs": [
            "When you find interest in any of the projects presented, I'm "
            "sure you'll have many questions. I'm more than happy to jump on "
            "a call at your convenience to discuss everything in detail.",
            "From there, I can help arrange visits to these developers "
            "during your trip, so you can see the projects first hand. "
            "Please note that many of these projects tend to sell out "
            "quickly, so timely action is recommended.",
        ],
        "why_us_paragraphs": [
            "With over 11 years of experience in the UAE property market, I "
            "know the ins and outs — what works, what doesn't, and where the "
            "real opportunities are.",
            "We don't just work for you like a typical agent — we treat your "
            "investment like it's our own. We care about building a "
            "long-term relationship, not just closing a quick sale. We stick "
            "around to help manage your property and make sure it keeps "
            "growing in value.",
            "And we don't take any commission from you. Our only goal is to "
            "guide you honestly to the best option — whether it's your dream "
            "home or a smart investment.",
        ],
    },
    "projects": [
        {
            "name": "South Square",
            "category": "High End Apartments",
            "developer": "Dubai South",
            "developer_tier": "TIER 1 — GOVERNMENT-BACKED MASTER DEVELOPER",
            "developer_profile":
                "Dubai South is a government-backed master developer — a big "
                "confidence booster on its own. Several residential, "
                "logistics, and commercial zones within Dubai South have "
                "already been completed and handed over, with communities "
                "that are operational and occupied today. Infrastructure, "
                "roads, utilities, and public services were delivered as "
                "planned — which isn't always the case in emerging areas.",
            "developer_facts": [
                "History of actual handovers, not just promises",
                "Direct government support and land ownership",
                "Anchor of the Al Maktoum Airport growth corridor"],
            "drive_times": [
                "Approx. 20 mins to Palm Jebel Ali",
                "Approx. 10 mins to Al Maktoum International Airport"],
            "facts": {
                "location": "Dubai South HQ District",
                "types": "1-2-3 Bedrooms",
                "total_units": "125 Units",
                "delivery": "2028",
                "service_charge": "14 AED / sq ft",
                "starting_price_aed": 1100000,
                "price_list": [["1 Bedroom from", "AED 1,100,000"]],
            },
            "payment_plan": ["20% down payment",
                             "60% till handover",
                             "20% post-handover over 2 years"],
            "unit": {
                "label": "1 Bedroom", "size_sqft": 728,
                "price_aed": 1200000,
                "service_charge_aed_sqft": 14,
                "gross_rent_aed": 95000,
                "resale_scenarios": [
                    {"label": "Scenario A — Sell at Handover",
                     "note": "Resell at projected market price upon "
                             "handover (aggressive).",
                     "sell_price_aed": 1607000},
                    {"label": "Scenario B — Hold Long-Term",
                     "note": "Hold for long-term growth and sell later "
                             "(basic).",
                     "sell_price_aed": 2410000},
                ],
            },
            "score": {
                "total": 78, "grade": "A", "signal": "BUY",
                "breakdown": [
                    {"label": "Developer Track Record", "points": 22, "max": 25},
                    {"label": "Price & Value vs Market", "points": 11, "max": 15},
                    {"label": "Payment Plan Quality", "points": 11, "max": 15},
                    {"label": "Location & Area Growth", "points": 12, "max": 15},
                    {"label": "Regulatory / Escrow Protection", "points": 9, "max": 10},
                    {"label": "Exit & Liquidity", "points": 6, "max": 10},
                    {"label": "Completion Risk", "points": 7, "max": 10},
                ],
                "comment": "Government-backed developer with delivery "
                           "history and a post-handover payment plan; "
                           "supply pipeline in Dubai South is the main "
                           "factor to watch.",
            },
        },
    ],
}


def main():
    args = [a for a in sys.argv[1:] if a != "--demo"]
    if args:
        with open(args[0]) as f:
            data = json.load(f)
        out = args[1] if len(args) > 1 else "INVESTOR-DECK.pdf"
    else:
        data = DEMO
        out = "INVESTOR-DECK-DEMO.pdf"
    build(data, out)


if __name__ == "__main__":
    main()
