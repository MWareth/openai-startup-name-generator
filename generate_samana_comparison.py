#!/usr/bin/env python3
"""Branded Samana off-plan comparison PDF (Bridges and Allies Real Estate).
Bilingual: English + Arabic (RTL).

Usage:
  python3 generate_samana_comparison.py "Mr Faisal" out_en.pdf        # English
  python3 generate_samana_comparison.py "Mr Faisal" out_ar.pdf ar     # Arabic
"""
import os
import sys
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, white
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (SimpleDocTemplate, Paragraph, Spacer, Table,
                                TableStyle, PageBreak)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase.pdfmetrics import registerFontFamily

_FD = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "fonts")

# ---- Fonts ----
def _reg():
    fams = {
        "Outfit": ("Outfit-Regular.ttf", "Outfit-Bold.ttf", None),
        "WorkSans": ("WorkSans-Regular.ttf", "WorkSans-Bold.ttf", "WorkSans-Italic.ttf"),
        "Tajawal": ("Tajawal-Regular.ttf", "Tajawal-Bold.ttf", None),
        "Amiri": ("Amiri-Regular.ttf", "Amiri-Bold.ttf", None),
    }
    ok = True
    for fam, (r, b, i) in fams.items():
        try:
            pdfmetrics.registerFont(TTFont(fam, os.path.join(_FD, r)))
            pdfmetrics.registerFont(TTFont(fam + "-Bold", os.path.join(_FD, b)))
            it = fam + "-Bold"
            if i:
                pdfmetrics.registerFont(TTFont(fam + "-Italic", os.path.join(_FD, i)))
                it = fam + "-Italic"
            registerFontFamily(fam, normal=fam, bold=fam + "-Bold", italic=it, boldItalic=fam + "-Bold")
        except Exception as e:
            print("font fail", fam, e); ok = False
    return ok
_HAVE = _reg()

# ---- Arabic shaping ----
try:
    import arabic_reshaper
    from bidi.algorithm import get_display
    _AR = True
except Exception:
    _AR = False

def _has_ar(s):
    return any('؀' <= c <= 'ۿ' for c in str(s))

def shape(s, lang):
    s = str(s)
    if lang == "ar" and _AR and _has_ar(s):
        return get_display(arabic_reshaper.reshape(s))
    return s

NAVY = HexColor("#1a2332"); GREEN = HexColor("#2e7d4f"); GOLD = HexColor("#c79a3b")
BLUE = HexColor("#1f6feb"); LIGHT = HexColor("#f4f6f8"); BORDER = HexColor("#d4dae0")
TEXT = HexColor("#2b3440"); GRAY = HexColor("#7a8694"); WINCOL = HexColor("#eaf3ee")
ORANGE = HexColor("#b06a2c")
ss = getSampleStyleSheet()


# ============================ CONTENT ============================
def content(lang, who):
    date = datetime.now().strftime("%B %d, %Y")
    if lang == "ar":
        return {
            "tag": "أبحاث واستشارات عقارية",
            "title": "مقارنة مشاريع سمانا على الخارطة",
            "sub": "Hills South 3  ·  Greenfield 1  ·  Boulevard Heights",
            "for": f"أُعدّ خصيصاً لـ {who}",
            "presented": "مقدّم من مروان وارث",
            "gen": f"تاريخ الإصدار: {date}",
            "toppick": "الخيار الأفضل",
            "badge": "Hills South 3 — دبي ساوث  |  الدرجة 72/100  |  أفضل توازن بين النمو والعائد",
            "h_compare": "مقارنة جنباً إلى جنب",
            "compare_note": "العمود المظلَّل = الأعلى تصنيفاً. جميع الأرقام بالدرهم.",
            "cols": ["", "Hills South 3", "Greenfield 1", "Boulevard Heights"],
            "rows": [
                ("الموقع", "دبي ساوث", "الورسان 4 / المدينة العالمية 2", "مجمع DLRC / دبي لاند"),
                ("حجم المشروع", "~147 وحدة (بوتيك)", "~310 وحدة", "~541 وحدة (الأكبر)"),
                ("أنواع الغرف", "استوديو · غرفة · غرفتان", "استوديو · غرفة · غرفتان", "استوديو · غرفة · غرفتان"),
                ("استوديو يبدأ من", "~639 ألف", "~620–720 ألف", "693 ألف"),
                ("غرفة نوم واحدة", "~1.0–1.15 مليون", "~900 ألف", "~1.15 مليون"),
                ("غرفتا نوم", "—", "~1.3 مليون", "~1.6 مليون"),
                ("السعر / قدم²", "~1,500–1,750", "~1,370–1,580", "~1,300–1,600"),
                ("العائد الإجمالي", "7.0–7.5%", "6.1–6.7%", "6.5–8.5%"),
                ("العائد الصافي", "~5.0–5.5%", "~4.0–4.6%", "~4.5–6.0%"),
                ("التسليم", "~الربع 4 2028", "الربع 4 2028 – الربع 1 2029", "الربع 1 2029"),
                ("النمو خلال 5 سنوات", "+25–40%", "+15–30%", "رقم أحادي منخفض"),
                ("المحفّز الرئيسي", "مطار آل مكتوم + إكسبو سيتي", "مترو الخط الأزرق 2029", "الخط الأزرق قريب (بلا محطة)"),
                ("خطة السداد", "1% شهرياً × ~70–75 شهر", "1% شهرياً × ~80–85 شهر", "1% شهرياً × ~70 شهر"),
                ("درجة الاستثمار", "72 / 100", "68 / 100", "64 / 100"),
            ],
            "h_beds": "أنواع الغرف ومزيج الوحدات",
            "beds_cols": ["المشروع", "استوديو", "غرفة", "غرفتان", "الميزة المميزة"],
            "beds": [
                ("Hills South 3", "متوفر", "~659 قدم²", "متوفر", "مسابح غاطسة خاصة (وحدات مختارة)"),
                ("Greenfield 1", "متوفر", "متوفر", "متوفر", "طراز منتجعي؛ خيارات مسبح خاص"),
                ("Boulevard Heights", "400–450 قدم²", "650–750 قدم²", "حتى 1,200 قدم²", "مسبح خاص في كل وحدة"),
            ],
            "beds_note": "الميزة المشتركة لسمانا: مسابح خاصة في الوحدات وطراز منتجعي بمرافق غنية. تتراوح المساحات بين ~400 و1,200 قدم².",
            "h_metro": "المترو والاتصالية",
            "metro_intro": "الخط الأزرق لمترو دبي (يُفتتح 9 سبتمبر 2029، باستثمار 20.5 مليار درهم و14 محطة) يربط أخيراً المدينة العالمية وواحة السيليكون والمدينة الأكاديمية وخور دبي وفستيفال سيتي ومردف والورقاء بالمترو.",
            "metro": [
                ("Greenfield 1", "الأكبر استفادةً: بجوار محطتي المدينة العالمية 2 و3 على الخط الأزرق ← مترو مباشر من 2029؛ وتتوقع هيئة الطرق ارتفاعاً يصل إلى +25% قرب المحطات."),
                ("Hills South 3", "قريب من محطة مترو إكسبو سيتي (الخط الأحمر / مسار 2020)؛ وهناك خطط مستقبلية لربط آل مكتوم (DWC) ومحطة لقطار الاتحاد — يتحسّن لكنه مؤجَّل."),
                ("Boulevard Heights", "لا يوجد مترو في DLRC / دبي لاند؛ يعتمد على السيارة (شارع الخيل / محمد بن زايد) — أقرب المحطات تبعد مسافة قيادة."),
            ],
            "h_verdict": "الحُكم على كل مشروع",
            "cards": [
                ("1", "Hills South 3 — دبي ساوث", "72 / 100", GREEN,
                 "أقل سعر دخول (~639 ألف درهم) وأفضل عائد صافٍ، مع أقوى قصة نمو مدفوعة بالبنية التحتية — توسعة مطار آل مكتوم (35 مليار دولار) هي المحرّك الأول للطلب السكني. مشروع بوتيك (147 وحدة) يعني منافسة داخلية أقل.",
                 "الأنسب لرأس المال الصبور الباحث عن النمو بأفق 5 سنوات فأكثر. تنبيه: دبي ساوث منطقة معروض مرتفع حالياً والمترو مؤجَّل."),
                ("2", "Greenfield 1 — الورسان 4", "68 / 100", GOLD,
                 "يقع في أحد أعلى ممرات العائد الإيجاري بدبي، مع محفّز قوي في 2029: الخط الأزرق (3 محطات بالمدينة العالمية، وارتفاع متوقع حتى +25%).",
                 "لكنه مُسعّر أعلى بـ ~45–65% من أسعار إعادة البيع بالورسان، فالعائد على التكلفة أقل من المعلَن للمنطقة. الأنسب لمن يحتفظ حتى 2029+."),
                ("3", "Boulevard Heights — DLRC", "64 / 100", ORANGE,
                 "متميّز فعلاً بمسبح خاص في كل وحدة تقريباً، ضمن سوق متوسط بأسعار معقولة وطلب عميق (عوائد DLRC 7–9.5%).",
                 "لكنه الأكبر (541 وحدة) ويُسلَّم (~الربع 1 2029) بالتزامن مع موجة تسليمات قياسية بدبي لاند؛ ويحمل أعلى مخاطر تسليم/جودة لسمانا. الأنسب لمشترٍ يركّز على الدخل ويملك احتياطياً."),
            ],
            "h_rec": "التوصية",
            "rec_intro": "يعتمد الاختيار على أولوية العميل:",
            "rec_cols": ["أولوية العميل", "المشروع الموصى به"],
            "rec": [
                ("النمو وارتفاع القيمة على المدى الطويل", "Hills South 3 — ممر نمو مطار آل مكتوم"),
                ("الطلب الإيجاري + محفّز المترو", "Greenfield 1 — مترو الخط الأزرق 2029"),
                ("العائد + ميزة المسبح (مع بداية بطيئة)", "Boulevard Heights — وحدات بمسابح خاصة، DLRC"),
            ],
            "h_risk": "اعتبارات ومخاطر رئيسية",
            "risks": [
                "تُسلَّم المشاريع الثلاثة ~2028–2029 وسط موجة المعروض القياسية بدبي — توقّع ضعفاً إيجارياً 2026–28.",
                "جميعها تحمل علاوة بناء جديد (~45–65% فوق أسعار إعادة البيع)؛ العائد على التكلفة أقل من المعلَن للمنطقة.",
                "سمانا مطوّر متوسط عالي الإنتاج — تحقّق من سجل التسليم وأي تأخيرات عبر دائرة الأراضي.",
                "ثبّت خطة السداد والسعر/المساحة ورسوم الخدمة كتابةً قبل الالتزام.",
                "هذه استثمارات احتفاظ لـ 5 سنوات فأكثر — وليست مضاربة قصيرة (تكاليف التداول ~8–9% ذهاباً وإياباً).",
            ],
            "thanks": "شكراً لكم",
            "consultant": "مستشار عقاري",
            "win_label": "Hills South 3 — دبي ساوث  |  الدرجة 72/100  |  أفضل توازن بين النمو والعائد",
        }
    # ---------- English ----------
    return {
        "tag": "Property Research & Advisory",
        "title": "Samana Off-Plan Comparison",
        "sub": "Hills South 3  ·  Greenfield 1  ·  Boulevard Heights",
        "for": f"Prepared exclusively for {who}",
        "presented": "Presented by Marwan Wareth",
        "gen": f"Generated: {date}",
        "toppick": "TOP PICK",
        "badge": "Hills South 3 — Dubai South  |  Score 72/100  |  Best appreciation + yield balance",
        "h_compare": "Side-by-Side Comparison",
        "compare_note": "Shaded column = top-ranked. All figures AED.",
        "cols": ["", "Hills South 3", "Greenfield 1", "Boulevard Heights"],
        "rows": [
            ("Location", "Dubai South", "Al Warsan 4 / Int'l City Ph2", "DLRC / Dubailand"),
            ("Project size", "~147 units (boutique)", "~310 units", "~541 units (largest)"),
            ("Bedroom types", "Studio · 1 · 2-bed", "Studio · 1 · 2-bed", "Studio · 1 · 2-bed"),
            ("Studio from", "~AED 639K", "~AED 620–720K", "AED 693K"),
            ("1-Bed", "~AED 1.0–1.15M", "~AED 900K", "~AED 1.15M"),
            ("2-Bed", "—", "~AED 1.3M", "~AED 1.6M"),
            ("Price / sqft", "~1,500–1,750", "~1,370–1,580", "~1,300–1,600"),
            ("Gross yield", "7.0–7.5%", "6.1–6.7%", "6.5–8.5%"),
            ("Net yield", "~5.0–5.5%", "~4.0–4.6%", "~4.5–6.0%"),
            ("Handover", "~Q4 2028", "Q4 2028 – Q1 2029", "Q1 2029"),
            ("5-yr appreciation", "+25–40%", "+15–30%", "Low single digit"),
            ("Key catalyst", "Al Maktoum Airport + Expo", "Blue Line Metro 2029", "Blue Line nearby (no stop)"),
            ("Payment plan", "1%/mo × ~70–75 mo", "1%/mo × ~80–85 mo", "1%/mo × ~70 mo"),
            ("Investment Score", "72 / 100", "68 / 100", "64 / 100"),
        ],
        "h_beds": "Bedroom Types & Unit Mix",
        "beds_cols": ["Project", "Studio", "1-Bed", "2-Bed", "Signature"],
        "beds": [
            ("Hills South 3", "Yes", "~659 sqft", "Yes", "Private plunge pools (select units)"),
            ("Greenfield 1", "Yes", "Yes", "Yes", "Resort-style; private-pool options"),
            ("Boulevard Heights", "400–450 sqft", "650–750 sqft", "up to 1,200 sqft", "Private pool in every unit"),
        ],
        "beds_note": "Samana's signature across all three: private pools in units + amenity-rich resort-style living. Unit sizes range ~400–1,200 sqft.",
        "h_metro": "Metro & Connectivity",
        "metro_intro": "The Dubai Metro Blue Line (opens 9 Sep 2029, AED 20.5bn, 14 stations) finally brings metro to International City, Dubai Silicon Oasis, Academic City, Dubai Creek Harbour, Festival City, Mirdif & Al Warqa.",
        "metro": [
            ("Greenfield 1", "Biggest metro winner — beside the International City 2 & 3 Blue Line stations → direct metro from 2029; RTA/analysts project up to +25% value uplift near stations."),
            ("Hills South 3", "Served by Expo City metro (Red Line / Route 2020) nearby; future plans for an Al Maktoum (DWC) metro link + Etihad Rail station — improving but future-dated."),
            ("Boulevard Heights", "No metro in DLRC / Dubailand; remains car-dependent (Al Khail / Sheikh Mohammed Bin Zayed Rd) — nearest stations are a drive away."),
        ],
        "h_verdict": "The Verdict on Each",
        "cards": [
            ("1", "Hills South 3 — Dubai South", "72 / 100", GREEN,
             "Lowest entry (~AED 639K), best net yield, and the strongest infrastructure-led appreciation story — the $35B Al Maktoum Airport expansion is Dubai's #1 housing-demand driver. Boutique 147-unit building means less internal competition.",
             "Best for: patient, appreciation-focused capital with a 5+ year horizon. Risk: Dubai South is an elevated near-term supply zone; Metro/rail are future-dated."),
            ("2", "Greenfield 1 — Al Warsan 4", "68 / 100", GOLD,
             "Sits in one of Dubai's highest-yield rental corridors with a hard 2029 catalyst — the Blue Line Metro (3 International City stations, up to +25% projected uplift).",
             "But priced ~45–65% above Warsan 4 resale, so yield-on-cost lands below the area headline. Best for clients who will hold to 2029+ and back the metro thesis."),
            ("3", "Boulevard Heights — DLRC", "64 / 100", ORANGE,
             "Genuinely differentiated — a private pool in nearly every unit — in an affordable, deep-demand mid-market (DLRC yields 7–9.5%).",
             "But it's the largest project (541 units) handing over (~Q1 2029) into a record Dubailand delivery wave, and carries the most Samana delivery/quality risk. Best for income buyers with reserves who can wait out a slow start."),
        ],
        "h_rec": "Recommendation",
        "rec_intro": "Which one to pick depends on the client's priority:",
        "rec_cols": ["Client priority", "Recommended project"],
        "rec": [
            ("Appreciation / long-term upside", "Hills South 3 — Al Maktoum Airport corridor"),
            ("Rental demand + metro catalyst", "Greenfield 1 — Blue Line Metro 2029"),
            ("Yield + lifestyle USP (OK with slow start)", "Boulevard Heights — private-pool units, DLRC"),
        ],
        "h_risk": "Key Considerations & Risks",
        "risks": [
            "All three hand over ~2028–2029 — into Dubai's record supply wave; expect 2026–28 rent softness.",
            "All carry a new-build premium (~45–65% above area resale comps); yield-on-cost is below area headline yields.",
            "Samana is a high-volume mid-market developer — verify delivery track record and any handover delays on DLD.",
            "Lock the payment plan, exact unit price/size, and service charge in writing before committing.",
            "These are 5+ year buy-and-hold plays — not short-term flips (transaction costs ~8–9% round-trip).",
        ],
        "thanks": "Thank you",
        "consultant": "Real Estate Consultant",
        "win_label": "Hills South 3 — Dubai South  |  Score 72/100  |  Best appreciation + yield balance",
    }


def build(lang, who, out):
    rtl = (lang == "ar")
    HEAD = "Amiri-Bold" if rtl else "Outfit-Bold"
    BODY = "Amiri" if rtl else "WorkSans"
    BODYB = "Amiri-Bold" if rtl else "WorkSans-Bold"
    A_BODY = TA_RIGHT if rtl else TA_LEFT
    C = content(lang, who)
    sh = lambda s: shape(s, lang)

    def st(name, **kw):
        return ParagraphStyle(name, parent=ss["Normal"], **kw)

    S = {
        "company": st("co", fontSize=19, leading=23, alignment=TA_CENTER, textColor=NAVY, fontName="Outfit-Bold"),
        "tag": st("tag", fontSize=10, alignment=TA_CENTER, textColor=GRAY, fontName=BODY),
        "title": st("ti", fontSize=29, leading=36, alignment=TA_CENTER, textColor=NAVY, fontName=HEAD),
        "sub": st("su", fontSize=14, leading=20, alignment=TA_CENTER, textColor=GREEN, fontName=HEAD),
        "for": st("fo", fontSize=13, leading=18, alignment=TA_CENTER, textColor=GOLD, fontName=HEAD),
        "presented": st("pr", fontSize=8.5, leading=13, alignment=TA_CENTER, textColor=BLUE, fontName=BODY),
        "muted": st("mu", fontSize=11, leading=15, alignment=TA_CENTER, textColor=GRAY, fontName=BODY),
        "h": st("h", fontSize=18, leading=24, textColor=NAVY, fontName=HEAD, spaceBefore=10, spaceAfter=8, alignment=A_BODY),
        "body": st("b", fontSize=10, leading=15, textColor=TEXT, spaceAfter=5, fontName=BODY, alignment=A_BODY),
        "cell": st("c", fontSize=8.5, leading=12, textColor=TEXT, fontName=BODY, alignment=A_BODY),
        "cellb": st("cb", fontSize=8.5, leading=12, textColor=TEXT, fontName=BODYB, alignment=A_BODY),
        "hd": st("hd", fontSize=9, leading=12, textColor=white, fontName=HEAD, alignment=TA_CENTER),
        "foot": st("ft", fontSize=7.5, leading=11, textColor=GRAY, alignment=TA_CENTER, fontName=BODY),
    }
    P = lambda t, s="cell": Paragraph(sh(t), S[s])
    doc = SimpleDocTemplate(out, pagesize=letter, leftMargin=46, rightMargin=46, topMargin=46, bottomMargin=46)
    E = []

    # ---- Cover ----
    E.append(Spacer(1, 0.5 * inch))
    E.append(Paragraph("Bridges and Allies Real Estate", S["company"]))
    E.append(Paragraph(sh(C["tag"]), S["tag"]))
    E.append(Spacer(1, 38))
    E.append(Paragraph(sh(C["title"]), S["title"]))
    E.append(Spacer(1, 12))
    E.append(Paragraph(sh(C["sub"]), S["sub"]))
    E.append(Spacer(1, 26))
    E.append(Paragraph(sh(C["for"]), S["for"]))
    E.append(Spacer(1, 6))
    E.append(Paragraph(sh(C["presented"]), S["presented"]))
    E.append(Spacer(1, 10))
    E.append(Paragraph(sh(C["gen"]), S["muted"]))
    E.append(Spacer(1, 38))
    badge = Table([[Paragraph(sh(C["toppick"]), S["hd"]), Paragraph(sh(C["win_label"]), S["cellb"])]],
                  colWidths=[88, 402])
    badge.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, 0), GREEN), ("BACKGROUND", (1, 0), (1, 0), WINCOL),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 10), ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LEFTPADDING", (0, 0), (-1, -1), 10), ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("BOX", (0, 0), (-1, -1), 0.5, GREEN),
    ]))
    E.append(badge)
    E.append(PageBreak())

    # ---- Comparison matrix ----
    E.append(Paragraph(sh(C["h_compare"]), S["h"]))
    data = [[P(c, "hd") for c in C["cols"]]]
    for r in C["rows"]:
        data.append([P(r[0], "cellb"), P(r[1]), P(r[2]), P(r[3])])
    t = Table(data, colWidths=[120, 130, 130, 130], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("BACKGROUND", (1, 1), (1, -1), WINCOL),
        ("ROWBACKGROUNDS", (0, 1), (0, -1), [LIGHT, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    E.append(t)
    E.append(Spacer(1, 7))
    E.append(Paragraph(sh(C["compare_note"]), S["foot"]))
    E.append(PageBreak())

    # ---- Bedroom types ----
    E.append(Paragraph(sh(C["h_beds"]), S["h"]))
    bd = [[P(c, "hd") for c in C["beds_cols"]]]
    for r in C["beds"]:
        bd.append([P(r[0], "cellb"), P(r[1]), P(r[2]), P(r[3]), P(r[4])])
    bt = Table(bd, colWidths=[110, 78, 86, 92, 144], repeatRows=1)
    bt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 6), ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ]))
    E.append(bt)
    E.append(Spacer(1, 8))
    E.append(Paragraph(sh(C["beds_note"]), S["body"]))

    # ---- Metro ----
    E.append(Paragraph(sh(C["h_metro"]), S["h"]))
    E.append(Paragraph(sh(C["metro_intro"]), S["body"]))
    E.append(Spacer(1, 4))
    for name, txt in C["metro"]:
        E.append(Paragraph(f'<font color="#1f6feb"><b>{sh(name)}</b></font> — {sh(txt)}', S["body"]))
    E.append(PageBreak())

    # ---- Verdict cards ----
    E.append(Paragraph(sh(C["h_verdict"]), S["h"]))
    for rank, name, score, col, summ, tail in C["cards"]:
        head = Table([[Paragraph(sh(f"#{rank}"), S["hd"]), Paragraph(sh(name), S["cellb"]), Paragraph(sh(score), S["hd"])]],
                     colWidths=[40, 380, 70])
        head.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (0, 0), col), ("BACKGROUND", (2, 0), (2, 0), col),
            ("BACKGROUND", (1, 0), (1, 0), LIGHT), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ]))
        E.append(head)
        E.append(Spacer(1, 4))
        E.append(Paragraph(sh(summ), S["body"]))
        E.append(Paragraph(sh(tail), S["body"]))
        E.append(Spacer(1, 11))
    E.append(PageBreak())

    # ---- Recommendation + risks ----
    E.append(Paragraph(sh(C["h_rec"]), S["h"]))
    E.append(Paragraph(sh(C["rec_intro"]), S["body"]))
    rec = [[P(C["rec_cols"][0], "hd"), P(C["rec_cols"][1], "hd")]]
    for a, b in C["rec"]:
        rec.append([P(a, "cellb"), P(b)])
    rt = Table(rec, colWidths=[230, 280])
    rt.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), NAVY),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [LIGHT, white]),
        ("GRID", (0, 0), (-1, -1), 0.5, BORDER), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 7), ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7),
    ]))
    E.append(rt)
    E.append(Spacer(1, 14))
    E.append(Paragraph(sh(C["h_risk"]), S["h"]))
    bullet = "•"
    for r in C["risks"]:
        E.append(Paragraph(sh(f"{bullet}  {r}"), S["body"]))

    # ---- Closing ----
    E.append(PageBreak())
    E.append(Spacer(1, 1.5 * inch))
    E.append(Paragraph("Bridges and Allies Real Estate", S["company"]))
    E.append(Paragraph(sh(C["thanks"]), S["muted"]))
    E.append(Spacer(1, 28))
    E.append(Paragraph(sh(C["for"]), S["for"]))
    E.append(Spacer(1, 20))
    E.append(Paragraph("Marwan Wareth", S["title"]))
    E.append(Paragraph(sh(C["consultant"]), S["muted"]))
    E.append(Spacer(1, 6))
    E.append(Paragraph(sh(C["presented"]), S["presented"]))

    doc.build(E)
    print("Generated:", out)


if __name__ == "__main__":
    who = sys.argv[1] if len(sys.argv) > 1 else "Valued Client"
    out = sys.argv[2] if len(sys.argv) > 2 else "Samana-Comparison.pdf"
    lang = sys.argv[3] if len(sys.argv) > 3 else "en"
    build(lang, who, out)
