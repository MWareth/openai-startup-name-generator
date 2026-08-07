#!/usr/bin/env python3
"""Dubai South off-plan comparison PDF — South Living vs South Square.
Cooler fonts (Outfit + Work Sans), small blue 'Presented by'. No agency name.
Usage: python3 generate_dubaisouth_comparison.py out.pdf
"""
import os, sys
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

_FD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "fonts")
HEAD, BODY, BODYB = "Helvetica-Bold", "Helvetica", "Helvetica-Bold"
try:
    pdfmetrics.registerFont(TTFont("Outfit", os.path.join(_FD, "Outfit-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("Outfit-Bold", os.path.join(_FD, "Outfit-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("WorkSans", os.path.join(_FD, "WorkSans-Regular.ttf")))
    pdfmetrics.registerFont(TTFont("WorkSans-Bold", os.path.join(_FD, "WorkSans-Bold.ttf")))
    pdfmetrics.registerFont(TTFont("WorkSans-Italic", os.path.join(_FD, "WorkSans-Italic.ttf")))
    registerFontFamily("WorkSans", normal="WorkSans", bold="WorkSans-Bold", italic="WorkSans-Italic", boldItalic="WorkSans-Bold")
    registerFontFamily("Outfit", normal="Outfit", bold="Outfit-Bold", italic="Outfit", boldItalic="Outfit-Bold")
    HEAD, BODY, BODYB = "Outfit-Bold", "WorkSans", "WorkSans-Bold"
except Exception as e:
    print("font fallback:", e)

NAVY = HexColor("#1a2332"); GREEN = HexColor("#2e7d4f"); GOLD = HexColor("#c79a3b")
BLUE = HexColor("#1f6feb"); LIGHT = HexColor("#f4f6f8"); BORDER = HexColor("#d4dae0")
TEXT = HexColor("#2b3440"); GRAY = HexColor("#7a8694"); TINT = HexColor("#eef2f7")
ss = getSampleStyleSheet()
def st(n, **k): return ParagraphStyle(n, parent=ss["Normal"], **k)
S = {
    "tag": st("tag", fontSize=10, alignment=TA_CENTER, textColor=GRAY, fontName=BODY),
    "title": st("ti", fontSize=28, leading=34, alignment=TA_CENTER, textColor=NAVY, fontName=HEAD),
    "sub": st("su", fontSize=15, leading=20, alignment=TA_CENTER, textColor=GREEN, fontName=HEAD),
    "presented": st("pr", fontSize=8.5, leading=13, alignment=TA_CENTER, textColor=BLUE, fontName=BODY),
    "muted": st("mu", fontSize=11, leading=15, alignment=TA_CENTER, textColor=GRAY, fontName=BODY),
    "h": st("h", fontSize=18, leading=23, textColor=NAVY, fontName=HEAD, spaceBefore=8, spaceAfter=8),
    "body": st("b", fontSize=10, leading=15, textColor=TEXT, spaceAfter=5, fontName=BODY),
    "cell": st("c", fontSize=8.7, leading=11.5, textColor=TEXT, fontName=BODY),
    "cellb": st("cb", fontSize=8.7, leading=11.5, textColor=TEXT, fontName=BODYB),
    "hd": st("hd", fontSize=9.5, leading=12, textColor=white, fontName=HEAD, alignment=TA_CENTER),
    "foot": st("ft", fontSize=7.5, leading=10.5, textColor=GRAY, alignment=TA_CENTER, fontName=BODY),
}
P = lambda t, s="cell": Paragraph(str(t), S[s])

COLS = ["", "South Living", "South Square"]
ROWS = [
    ("Developer", "Dubai South Properties (govt-backed)", "Dubai South Properties (govt-backed)"),
    ("District", "Residential District", "Logistics City district"),
    ("Concept", "Residential — gardens, pool-villa views", "Wellness-led — water ponds, green corridors"),
    ("Unit types", "Studio · 1 · 2 · 3-bed", "1 · 2 · 2.5 · 3-bed"),
    ("Entry price", "<b>Studio fr AED 600K · 1BR fr 1.0M</b>", "1BR fr ~AED 1.1–1.43M"),
    ("2-Bed from", "~AED 1.2M", "~AED 1.6–2.0M"),
    ("3-Bed", "~AED 1.85M", "AED 2.2–2.9M"),
    ("Price / sqft", "~1,300–1,400", "~1,000–1,460"),
    ("Gross yield", "<b>~6–7.5%</b> (studio/1BR best)", "~5.5% (2–3BR)"),
    ("Net yield", "~4.5–6%", "~4.0–4.5%"),
    ("Handover", "<b>Q1 2027 (sooner)</b>", "Q4 2028"),
    ("Payment plan", "5 / 55 / 16 + 24% PHP (2-yr) — 76/24", "5 / 55 / 20 + 20% PHP (2-yr) — 80/20"),
    ("Key catalyst", "Al Maktoum Airport + Expo City", "Al Maktoum Airport + Expo City"),
    ("Launch demand", "Strong", "<b>First tower sold out in ~3 hrs</b>"),
    ("Investment Score", "72 / 100", "72 / 100"),
]
PAY = [
    ("Down payment (booking)", "5%", "5%"),
    ("During construction", "55%", "55%"),
    ("On handover", "16%  (Q1 2027)", "20%  (Q4 2028)"),
    ("Post-handover (2 years)", "24%", "20%"),
]
CARDS = [
    ("South Living", "72 / 100", GREEN,
     "The cash-flow & speed pick. Lowest entry (studio fr AED 600K, 1BR fr AED 1.0M), the best yields on this list (~6–7.5% gross on studios/1BR), and the SOONER handover — Q1 2027 — so rental income starts ~18 months earlier. Residential District, gardens and pool-villa-view layouts, with a 2-year post-handover tail.",
     "Best for: yield-focused & first-time investors who want lower entry and faster completion."),
    ("South Square", "72 / 100", GOLD,
     "The appreciation & product pick. A wellness-led design (water ponds, green corridors, larger 2–3BR family units) in Logistics City, with explosive launch demand (first tower sold out in ~3 hours) supporting resale/assignment liquidity. Longer build to Q4 2028 with an 80/20 plan.",
     "Best for: medium-term capital-growth buyers who want a premium product and bigger units, and can wait to 2028."),
]
REC = [
    ("Earliest handover / fastest rental income", "South Living — Q1 2027"),
    ("Lowest entry & best yield (studio/1BR)", "South Living"),
    ("Capital growth, premium wellness product, bigger family units", "South Square"),
    ("Strongest resale / assignment liquidity", "South Square (sold-out launches)"),
]
RISKS = [
    "Both sit in Dubai South — a heavy 2026–28 off-plan pipeline that can soften rents and resale around handover.",
    "Net yields on larger 2–3BR units are modest (~4–4.5%); the strongest cash-on-cash is South Living studios/1BR.",
    "The airport-led growth thesis is multi-year; metro/retail/schools are still building out (car-dependent today).",
    "Both are off-plan — confirm the exact price list, unit size, service charge, handover date and payment plan in the SPA.",
    "Government-backed developer lowers delivery risk, but exit timing (2027 vs 2028) still carries market-cycle risk.",
]


def build(out):
    doc = SimpleDocTemplate(out, pagesize=letter, leftMargin=46, rightMargin=46, topMargin=46, bottomMargin=46)
    E = []
    # Cover
    E.append(Spacer(1, 0.7 * inch))
    E.append(Paragraph("Off-Plan Research &amp; Advisory", S["tag"]))
    E.append(Spacer(1, 26))
    E.append(Paragraph("Dubai South Off-Plan Comparison", S["title"]))
    E.append(Spacer(1, 14))
    E.append(Paragraph("South Living &nbsp;vs&nbsp; South Square", S["sub"]))
    E.append(Spacer(1, 22))
    E.append(Paragraph("Presented by Marwan Wareth", S["presented"]))
    E.append(Spacer(1, 8))
    E.append(Paragraph(f"Generated: {datetime.now().strftime('%B %d, %Y')}", S["muted"]))
    E.append(Spacer(1, 40))
    badge = Table([[Paragraph("BOTH 72/100", S["hd"]),
                    Paragraph("Two strong Dubai South plays — choose by goal: <b>South Living</b> for yield &amp; faster handover, <b>South Square</b> for growth &amp; product.", S["cellb"])]],
                  colWidths=[95, 395])
    badge.setStyle(TableStyle([("BACKGROUND", (0, 0), (0, 0), NAVY), ("BACKGROUND", (1, 0), (1, 0), TINT),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("BOX", (0, 0), (-1, -1), 0.5, NAVY)]))
    E.append(badge)
    E.append(PageBreak())
    # Matrix
    E.append(Paragraph("Side-by-Side Comparison", S["h"]))
    data = [[P(c, "hd") for c in COLS]]
    for r in ROWS:
        data.append([P(r[0], "cellb"), P(r[1]), P(r[2])])
    t = Table(data, colWidths=[140, 185, 185], repeatRows=1)
    t.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6)]))
    E.append(t)
    E.append(Spacer(1, 7))
    E.append(Paragraph("All figures AED. Both projects offer a 2-year post-handover payment plan.", S["foot"]))
    E.append(PageBreak())
    # Payment plan + verdict
    E.append(Paragraph("Payment Plan Comparison", S["h"]))
    pd = [[P("Stage", "hd"), P("South Living", "hd"), P("South Square", "hd")]]
    for r in PAY:
        pd.append([P(r[0], "cellb"), P(r[1]), P(r[2])])
    pt = Table(pd, colWidths=[200, 155, 155])
    pt.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER), ("ALIGN", (1, 0), (-1, -1), "CENTER"), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6)]))
    E.append(pt)
    E.append(Spacer(1, 6))
    E.append(Paragraph("Both reach handover at ~76–80% paid, with the balance spread over <b>24 months after handover</b> — so the unit can be leased and rent applied toward the tail.", S["body"]))
    E.append(Spacer(1, 10))
    E.append(Paragraph("The Verdict on Each", S["h"]))
    for name, score, col, summ, best in CARDS:
        head = Table([[Paragraph(name, S["cellb"]), Paragraph(score, S["hd"])]], colWidths=[420, 70])
        head.setStyle(TableStyle([("BACKGROUND", (1, 0), (1, 0), col), ("BACKGROUND", (0, 0), (0, 0), LIGHT),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 8)]))
        E.append(head)
        E.append(Spacer(1, 4))
        E.append(Paragraph(summ, S["body"]))
        E.append(Paragraph(f'<font color="#2e7d4f"><b>{best}</b></font>', S["body"]))
        E.append(Spacer(1, 10))
    E.append(PageBreak())
    # Recommendation + risks
    E.append(Paragraph("Recommendation", S["h"]))
    E.append(Paragraph("Both score 72/100 — the right pick depends on the client's goal:", S["body"]))
    rec = [[P("Client priority", "hd"), P("Recommended project", "hd")]]
    for a, b in REC:
        rec.append([P(a, "cellb"), P(b)])
    rt = Table(rec, colWidths=[260, 250])
    rt.setStyle(TableStyle([("BACKGROUND", (0, 0), (-1, 0), NAVY), ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7)]))
    E.append(rt)
    E.append(Spacer(1, 14))
    E.append(Paragraph("Key Considerations &amp; Risks", S["h"]))
    for r in RISKS:
        E.append(Paragraph(f"•&nbsp; {r}", S["body"]))
    # Closing
    E.append(PageBreak())
    E.append(Spacer(1, 1.9 * inch))
    E.append(Paragraph("Thank you", S["muted"]))
    E.append(Spacer(1, 26))
    E.append(Paragraph("Prepared by", S["muted"]))
    E.append(Paragraph("Marwan Wareth", S["title"]))
    E.append(Paragraph("Real Estate Consultant", S["muted"]))
    E.append(Spacer(1, 6))
    E.append(Paragraph("Presented by Marwan Wareth", S["presented"]))
    doc.build(E)
    print("Generated:", out)


if __name__ == "__main__":
    build(sys.argv[1] if len(sys.argv) > 1 else "DubaiSouth-Comparison.pdf")
