#!/usr/bin/env python3
"""Branded Samana off-plan comparison PDF (Bridges and Allies Real Estate).
Usage: python3 generate_samana_comparison.py "Mr Faisal" output.pdf
"""
import os
import sys
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, PageBreak)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

# ---- Register cooler modern fonts (Outfit for display, Work Sans for text) ----
_FD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "fonts")
HEAD, BODY, BODYB, BODYI = "Helvetica-Bold", "Helvetica", "Helvetica-Bold", "Helvetica-Oblique"
try:
    pdfmetrics.registerFont(TTFont("Outfit", os.path.join(_FD, "Outfit-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("Outfit-Bold", os.path.join(_FD, "Outfit-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("WorkSans", os.path.join(_FD, "WorkSans-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("WorkSans-Bold", os.path.join(_FD, "WorkSans-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("WorkSans-Italic", os.path.join(_FD, "WorkSans-Italic.ttf")))
    registerFontFamily("Outfit", normal="Outfit", bold="Outfit-Bold",
                       italic="Outfit", boldItalic="Outfit-Bold")
    registerFontFamily("WorkSans", normal="WorkSans", bold="WorkSans-Bold",
                       italic="WorkSans-Italic", boldItalic="WorkSans-Bold")
    HEAD, BODY, BODYB, BODYI = "Outfit-Bold", "WorkSans", "WorkSans-Bold", "WorkSans-Italic"
except Exception as e:
    print("Font registration fell back to Helvetica:", e)

NAVY = HexColor("#1a2332")
GREEN = HexColor("#2e7d4f")
GOLD = HexColor("#c79a3b")
BLUE = HexColor("#1f6feb")
LIGHT = HexColor("#f4f6f8")
BORDER = HexColor("#d4dae0")
TEXT = HexColor("#2b3440")
GRAY = HexColor("#7a8694")
WINCOL = HexColor("#eaf3ee")

ss = getSampleStyleSheet()
def st(name, **kw):
    return ParagraphStyle(name, parent=ss["Normal"], **kw)

S = {
    "company": st("co", fontSize=19, leading=23, alignment=TA_CENTER,
                  textColor=NAVY, fontName=HEAD),
    "tag": st("tag", fontSize=10, alignment=TA_CENTER, textColor=GRAY, fontName=BODY),
    "title": st("ti", fontSize=29, leading=34, alignment=TA_CENTER,
                textColor=NAVY, fontName=HEAD),
    "sub": st("su", fontSize=14, leading=18, alignment=TA_CENTER,
              textColor=GREEN, fontName=HEAD),
    "for": st("fo", fontSize=13, leading=17, alignment=TA_CENTER,
              textColor=GOLD, fontName=HEAD),
    # small blue "Presented by" line
    "presented": st("pr", fontSize=8.5, leading=12, alignment=TA_CENTER,
                    textColor=BLUE, fontName=BODYI),
    "muted": st("mu", fontSize=11, alignment=TA_CENTER, textColor=GRAY, fontName=BODY),
    "h": st("h", fontSize=18, leading=22, textColor=NAVY,
            fontName=HEAD, spaceBefore=10, spaceAfter=8),
    "h2": st("h2", fontSize=13, leading=16, textColor=GREEN,
             fontName=HEAD, spaceBefore=8, spaceAfter=4),
    "body": st("b", fontSize=10, leading=14, textColor=TEXT, spaceAfter=5, fontName=BODY),
    "cell": st("c", fontSize=8.5, leading=11, textColor=TEXT, fontName=BODY),
    "cellb": st("cb", fontSize=8.5, leading=11, textColor=TEXT, fontName=BODYB),
    "hd": st("hd", fontSize=9, leading=11, textColor=white,
             fontName=HEAD, alignment=TA_CENTER),
    "foot": st("ft", fontSize=7.5, leading=10, textColor=GRAY, alignment=TA_CENTER, fontName=BODYI),
}

P = lambda t, s="cell": Paragraph(t, S[s])

# ----- Comparison data -----
ATTRS = [
    ("Location", "Dubai South", "Al Warsan 4 / Int'l City Ph2", "DLRC / Dubailand"),
    ("Project size", "~147 units (boutique)", "~310 units", "~541 units (largest)"),
    ("Studio from", "<b>~AED 639K</b>", "~AED 620–720K", "AED 693K"),
    ("1-Bed", "~AED 1.0–1.15M", "~AED 900K", "~AED 1.15M"),
    ("2-Bed", "—", "~AED 1.3M", "~AED 1.6M"),
    ("Price / sqft", "~1,500–1,750", "~1,370–1,580", "~1,300–1,600"),
    ("Gross yield", "<b>7.0–7.5%</b>", "6.1–6.7%", "6.5–8.5%"),
    ("Net yield", "<b>~5.0–5.5%</b>", "~4.0–4.6%", "~4.5–6.0%"),
    ("Handover", "~Q4 2028", "Q4 2028–Q1 2029", "Q1 2029"),
    ("5-yr appreciation", "<b>+25–40%</b>", "+15–30%", "Low single digit"),
    ("Key catalyst", "Al Maktoum Airport + Expo City", "Blue Line Metro 2029 (3 IC stations)", "Blue Line nearby (no in-zone stop)"),
    ("Payment plan", "1%/mo × ~70–75 mo", "1%/mo × ~80–85 mo", "1%/mo × ~70 mo"),
    ("Investment Score", "<b>72 / 100</b>", "68 / 100", "64 / 100"),
]

CARDS = [
    ("1", "Hills South 3 — Dubai South", "72 / 100", GREEN,
     "Lowest entry (~AED 639K), best net yield, and the strongest infrastructure-led appreciation story — the $35B Al Maktoum Airport expansion is Dubai's #1 housing-demand driver. Boutique 147-unit building means less internal competition.",
     "Risk: Dubai South is an elevated near-term supply zone; Metro/rail are future-dated.",
     "Best for: patient, appreciation-focused capital with a 5+ year horizon."),
    ("2", "Greenfield 1 — Al Warsan 4", "68 / 100", GOLD,
     "Sits in one of Dubai's highest-yield rental corridors with a hard 2029 catalyst — the Blue Line Metro (3 International City stations, RTA projects up to +25% uplift).",
     "Catch: priced ~45–65% above Warsan 4 resale, so yield-on-cost lands below the area's headline rates — you pay premium for metro-driven appreciation.",
     "Best for: clients who will hold to 2029+ and back the metro thesis."),
    ("3", "Boulevard Heights — DLRC", "64 / 100", HexColor("#b06a2c"),
     "Genuinely differentiated — a private pool in nearly every unit — in an affordable, deep-demand mid-market (DLRC yields 7–9.5%).",
     "But: largest project (541 units) handing over (~Q1 2029) right as Dubailand absorbs a record delivery wave; carries the most Samana delivery/quality risk (mixed reviews, ~1yr delays reported).",
     "Best for: income buyers with reserves who can wait out a slow start."),
]

RISKS = [
    "All three hand over ~2028–2029 — directly into Dubai's record supply wave; expect 2026–28 rent softness.",
    "All carry a new-build premium (~45–65% above area resale comps); yield-on-cost is lower than area headline yields.",
    "Samana is a high-volume mid-market developer — verify the delivery track record and any handover delays on DLD.",
    "Lock the payment plan, exact unit price/size, and service charge in writing before committing.",
    "These are 5+ year buy-and-hold plays — not short-term flips (transaction costs ~8–9% round-trip).",
]


def build(prepared_for, out):
    doc = SimpleDocTemplate(out, pagesize=letter, leftMargin=46, rightMargin=46,
                            topMargin=46, bottomMargin=46)
    E = []
    # ---- Cover ----
    E.append(Spacer(1, 0.5 * inch))
    E.append(Paragraph("Bridges and Allies Real Estate", S["company"]))
    E.append(Paragraph("Property Research & Advisory", S["tag"]))
    E.append(Spacer(1, 40))
    E.append(Paragraph("Samana Off-Plan Comparison", S["title"]))
    E.append(Spacer(1, 14))
    E.append(Paragraph("Hills South 3 &nbsp;·&nbsp; Greenfield 1 &nbsp;·&nbsp; Boulevard Heights", S["sub"]))
    E.append(Spacer(1, 28))
    E.append(Paragraph(f"Prepared exclusively for {prepared_for}", S["for"]))
    E.append(Spacer(1, 6))
    E.append(Paragraph("Presented by Marwan Wareth", S["presented"]))
    E.append(Spacer(1, 10))
    E.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", S["muted"]))
    E.append(Spacer(1, 40))
    # Top pick badge
    badge = Table([[Paragraph("TOP PICK", S["hd"]),
                    Paragraph("<b>Hills South 3</b> — Dubai South &nbsp;|&nbsp; Score 72/100 &nbsp;|&nbsp; Best appreciation + yield balance", S["cellb"])]],
                  colWidths=[80, 410])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), GREEN),
        ("BACKGROUND", (1, 0), (1, 0), WINCOL),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("BOX", (0, 0), (-1, -1), 0.5, GREEN),
    ]))
    E.append(badge)
    E.append(PageBreak())

    # ---- Comparison matrix ----
    E.append(Paragraph("Side-by-Side Comparison", S["h"]))
    data = [[P("", "hd"),
             P("Hills South 3", "hd"), P("Greenfield 1", "hd"), P("Boulevard Heights", "hd")]]
    for a in ATTRS:
        data.append([P(a[0], "cellb"), P(a[1]), P(a[2]), P(a[3])])
    t = Table(data, colWidths=[112, 134, 134, 130], repeatRows=1)
    style = [
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BACKGROUND", (1, 1), (1, -1), WINCOL),   # highlight winner column
        ("ROWBACKGROUNDS", (0, 1), (0, -1), [LIGHT, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]
    t.setStyle(TableStyle(style))
    E.append(t)
    E.append(Spacer(1, 8))
    E.append(Paragraph("<i>Shaded column = top-ranked. All figures AED.</i>", S["foot"]))
    E.append(PageBreak())

    # ---- Project cards ----
    E.append(Paragraph("The Verdict on Each", S["h"]))
    for rank, name, score, col, summ, risk, best in CARDS:
        head = Table([[Paragraph(f"#{rank}", S["hd"]),
                       Paragraph(name, S["cellb"]),
                       Paragraph(score, S["hd"])]],
                     colWidths=[40, 380, 70])
        head.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), col),
            ("BACKGROUND", (2, 0), (2, 0), col),
            ("BACKGROUND", (1, 0), (1, 0), LIGHT),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        E.append(head)
        E.append(Spacer(1, 4))
        E.append(Paragraph(summ, S["body"]))
        E.append(Paragraph(risk, S["body"]))
        E.append(Paragraph(f'<font color="#2e7d4f"><b>{best}</b></font>', S["body"]))
        E.append(Spacer(1, 12))
    E.append(PageBreak())

    # ---- Recommendation + risks ----
    E.append(Paragraph("Recommendation", S["h"]))
    E.append(Paragraph("Which one to pick depends on the client's priority:", S["body"]))
    rec = [[P("Client priority", "hd"), P("Recommended project", "hd")]]
    for pr, pj in [
        ("Appreciation / long-term upside", "<b>Hills South 3</b> — Al Maktoum Airport growth corridor"),
        ("Rental demand + metro catalyst", "<b>Greenfield 1</b> — Blue Line Metro 2029"),
        ("Yield + lifestyle USP (OK with slow start)", "<b>Boulevard Heights</b> — private-pool units, DLRC"),
    ]:
        rec.append([P(pr, "cellb"), P(pj)])
    rt = Table(rec, colWidths=[210, 300])
    rt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ]))
    E.append(rt)
    E.append(Spacer(1, 16))
    E.append(Paragraph("Key Considerations &amp; Risks", S["h2"]))
    for r in RISKS:
        E.append(Paragraph(f"•&nbsp; {r}", S["body"]))

    # ---- Closing page ----
    E.append(PageBreak())
    E.append(Spacer(1, 1.6 * inch))
    E.append(Paragraph("Bridges and Allies Real Estate", S["title"]))
    E.append(Paragraph("Thank you", S["muted"]))
    E.append(Spacer(1, 30))
    E.append(Paragraph(f"Prepared exclusively for {prepared_for}", S["for"]))
    E.append(Spacer(1, 22))
    E.append(Paragraph("Marwan Wareth", S["title"]))
    E.append(Paragraph("Real Estate Consultant", S["muted"]))
    E.append(Spacer(1, 6))
    E.append(Paragraph("Presented by Marwan Wareth", S["presented"]))

    doc.build(E)
    print("Generated:", out)


if __name__ == "__main__":
    who = sys.argv[1] if len(sys.argv) > 1 else "Valued Client"
    out = sys.argv[2] if len(sys.argv) > 2 else "Samana-Comparison.pdf"
    build(who, out)
