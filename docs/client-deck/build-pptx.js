/* Builds the 23-slide Dubai off-plan comparison deck as a .pptx
   Run: node build-pptx.js   (from docs/client-deck/) */

const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');

const IMGDIR = path.join(__dirname, 'img', 'deck');
const img = (f) => 'image/jpeg;base64,' + fs.readFileSync(path.join(IMGDIR, f)).toString('base64');

/* ---------- tokens ---------- */
const GROUND = '0F1412', SURF = '171E1B', SURF2 = '202A26', LINE = '2E3A35';
const INK = 'F3F0E8', INK2 = 'A7B0AB', INK3 = '828C87';
const VERDICT = '7BE08A';
const FLO = 'B04862', ARA = 'B08A25', CEL = '3A8FBF';
const HEAD = 'Arial', BODY = 'Calibri';

const W = 13.3, H = 7.5, MX = 0.62;
const CW = W - MX * 2;

const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';
pres.author = 'Marwan Wareth';
pres.title = 'Three Projects, One Decision — Dubai Off-Plan Comparison';

/* ---------- helpers ---------- */
let SLIDE_N = 0;
function newSlide() {
  const s = pres.addSlide();
  s.background = { color: GROUND };
  s.__n = ++SLIDE_N;
  return s;
}

function chrome(s, hue, name, sub) {
  const n = s.__n;
  if (name) {
    s.addShape(pres.ShapeType.rect, { x: MX, y: 0.42, w: 0.075, h: 0.24, fill: { color: hue } });
    s.addText(
      [{ text: name, options: { bold: true, color: INK } },
       { text: sub ? '   ' + sub : '', options: { color: INK3, bold: false } }],
      { x: MX + 0.17, y: 0.36, w: 8, h: 0.36, fontFace: BODY, fontSize: 12, margin: 0, valign: 'middle' }
    );
  }
  s.addText('Marwan Wareth', {
    x: MX, y: H - 0.62, w: 4, h: 0.3, fontFace: BODY, fontSize: 9.5, color: INK3, margin: 0, valign: 'middle'
  });
  s.addText(String(n).padStart(2, '0'), {
    x: W - MX - 1, y: H - 0.62, w: 1, h: 0.3, fontFace: BODY, fontSize: 9.5,
    color: INK3, align: 'right', margin: 0, valign: 'middle'
  });
}

function disclaimer(s, txt) {
  s.addText(txt, {
    x: W / 2 - 3.6, y: H - 0.66, w: 7.2, h: 0.38, fontFace: BODY, fontSize: 7.5,
    color: INK3, align: 'center', margin: 0, valign: 'middle'
  });
}

function eyebrow(s, txt, y, color, x, w) {
  s.addText(txt.toUpperCase(), {
    x: (x === undefined) ? MX : x, y: y, w: (w === undefined) ? CW : w,
    h: 0.26, fontFace: BODY, fontSize: 10, bold: true,
    charSpacing: 2.6, color: color || INK3, margin: 0, valign: 'middle'
  });
}

function heading(s, txt, y, size) {
  s.addText(txt, {
    x: MX, y: y, w: CW, h: (size || 30) > 26 ? 0.82 : 0.6, fontFace: HEAD,
    fontSize: size || 30, bold: true, color: INK, margin: 0, valign: 'middle'
  });
}

/* a callout: tinted panel, no edge stripe */
function callout(s, o) {
  s.addShape(pres.ShapeType.roundRect, {
    x: o.x, y: o.y, w: o.w, h: o.h, rectRadius: 0.03,
    fill: { color: SURF2 }, line: { color: LINE, width: 0.5 }
  });
  s.addText(o.rich, {
    x: o.x + 0.22, y: o.y + 0.12, w: o.w - 0.44, h: o.h - 0.24,
    fontFace: BODY, fontSize: o.size || 11, color: INK2, margin: 0, valign: 'top', lineSpacingMultiple: 1.18
  });
}

/* x0/totalW default to the full content width; pass them to keep a stat row
   inside a column, otherwise it spills under the neighbouring text */
function statRow(s, y, items, hue, x0, totalW) {
  const gap = 0.28;
  const left = (x0 === undefined) ? MX : x0;
  const span = (totalW === undefined) ? CW : totalW;
  const w = (span - gap * (items.length - 1)) / items.length;
  items.forEach((it, i) => {
    const x = left + i * (w + gap);
    s.addShape(pres.ShapeType.line, {
      x: x, y: y, w: w, h: 0, line: { color: LINE, width: 0.75 }
    });
    s.addText(
      [{ text: it.v, options: { fontSize: 26, bold: true, color: hue || INK, fontFace: HEAD } },
       { text: it.u ? ' ' + it.u : '', options: { fontSize: 12, bold: true, color: hue || INK, fontFace: HEAD } }],
      { x: x, y: y + 0.1, w: w, h: 0.5, margin: 0, valign: 'middle' }
    );
    s.addText(it.l.toUpperCase(), {
      x: x, y: y + 0.62, w: w, h: 0.26, fontFace: BODY, fontSize: 8.5,
      bold: true, charSpacing: 1.6, color: INK3, margin: 0, valign: 'middle'
    });
  });
}

/* full-bleed image with a two-band scrim so text stays legible */
function coverImage(s, file) {
  s.addImage({ data: img(file), x: 0, y: 0, w: W, h: H, sizing: { type: 'cover', w: W, h: H } });
  /* a real alpha gradient — stacked translucent rectangles leave a visible seam */
  s.addImage({ data: 'image/png;base64,' + fs.readFileSync(path.join(IMGDIR, 'scrim.png')).toString('base64'),
               x: 0, y: 0, w: W, h: H });
}

function coverText(s, o) {
  let y = 3.55;
  s.addText(o.eyebrow.toUpperCase(), {
    x: MX, y: y, w: CW, h: 0.3, fontFace: BODY, fontSize: 10.5, bold: true,
    charSpacing: 2.6, color: 'D8D4CA', margin: 0, valign: 'middle'
  });
  s.addText(o.title, {
    x: MX - 0.06, y: y + 0.34, w: CW, h: o.two ? 1.9 : 1.15, fontFace: HEAD,
    fontSize: o.size || 60, bold: true, color: 'FAF8F2', margin: 0, valign: 'top',
    lineSpacingMultiple: 0.92,
    shadow: { type: 'outer', color: '000000', blur: 14, offset: 2, angle: 90, opacity: 0.45 }
  });
  const ty = y + 0.34 + (o.two ? 1.9 : 1.15);
  if (o.tagline) {
    s.addText(o.tagline.toUpperCase(), {
      x: MX, y: ty, w: CW, h: 0.32, fontFace: BODY, fontSize: 12,
      charSpacing: 2.2, color: 'CFCBC0', margin: 0, valign: 'middle'
    });
  }
  if (o.meta) {
    s.addText(o.meta, {
      x: MX, y: ty + (o.tagline ? 0.42 : 0.06), w: CW, h: 0.36,
      fontFace: BODY, fontSize: 13, color: 'EDEAE1', margin: 0, valign: 'middle'
    });
  }
}

/* table builder — dual currency and comparison tables */
function tbl(s, o) {
  const hdr = o.head.map((h, i) => ({
    text: h,
    options: {
      bold: true, fontSize: 8.5, charSpacing: 1.4, color: INK3, fill: { color: SURF2 },
      align: i === 0 ? 'left' : 'right', valign: 'middle'
    }
  }));
  const rows = [hdr].concat(o.rows.map((r, ri) => r.map((c, i) => {
    const cell = (typeof c === 'object' && c !== null) ? c : { t: c };
    const isTotal = !!cell.total;
    return {
      text: cell.t,
      options: {
        bold: isTotal || !!cell.b,
        color: cell.c || (i === 0 ? (isTotal ? INK : INK2) : INK),
        fill: { color: isTotal ? SURF2 : (ri % 2 ? '1B2320' : SURF) },
        align: i === 0 ? 'left' : 'right',
        valign: 'middle'
      }
    };
  })));
  s.addTable(rows, {
    x: o.x, y: o.y, w: o.w, colW: o.colW, rowH: o.rowH || 0.29,
    fontFace: BODY, fontSize: o.size || 10.5, color: INK,
    border: { type: 'solid', color: LINE, pt: 0.5 },
    margin: [0.04, 0.09, 0.04, 0.09], autoPage: false
  });
}

function caption(s, txt, x, y, w) {
  s.addText(txt.toUpperCase(), {
    x: x, y: y, w: w, h: 0.28, fontFace: BODY, fontSize: 10, bold: true,
    charSpacing: 1.8, color: INK, margin: 0, valign: 'middle'
  });
}

/* three-column cards */
function cards(s, y, h, items) {
  const gap = 0.3, w = (CW - gap * 2) / 3;
  items.forEach((it, i) => {
    const x = MX + i * (w + gap);
    s.addShape(pres.ShapeType.roundRect, {
      x: x, y: y, w: w, h: h, rectRadius: 0.03,
      fill: { color: SURF2 }, line: { color: LINE, width: 0.5 }
    });
    s.addShape(pres.ShapeType.ellipse, {
      x: x + 0.26, y: y + 0.28, w: 0.16, h: 0.16, fill: { color: it.hue }
    });
    s.addText(it.title, {
      x: x + 0.52, y: y + 0.2, w: w - 0.78, h: 0.32, fontFace: HEAD,
      fontSize: 15, bold: true, color: INK, margin: 0, valign: 'middle'
    });
    if (it.kicker) {
      s.addText(it.kicker.toUpperCase(), {
        x: x + 0.26, y: y + 0.58, w: w - 0.52, h: 0.24, fontFace: BODY,
        fontSize: 8.5, bold: true, charSpacing: 1.6, color: INK3, margin: 0, valign: 'middle'
      });
    }
    s.addText(it.bullets.map((b, k) => ({
      text: b,
      options: { bullet: true, breakLine: k < it.bullets.length - 1 }
    })), {
      x: x + 0.26, y: y + (it.kicker ? 0.88 : 0.66), w: w - 0.52, h: h - (it.kicker ? 1.12 : 0.9),
      fontFace: BODY, fontSize: 10.5, color: INK2, margin: 0, valign: 'top',
      paraSpaceAfter: 5, lineSpacingMultiple: 1.1
    });
  });
}

/* ================= SLIDES ================= */

/* 1 — cover */
{
  const s = newSlide();
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: '0C1210' } });
  coverText(s, {
    eyebrow: 'Dubai off-plan · investment comparison · July 2026',
    title: 'Three projects.\nOne decision.', two: true, size: 62
  });
  const names = [
    { n: 'Floareá Skies', d: 'JVC · 2027', hue: FLO },
    { n: 'Arancia', d: 'City of Arabia · 2029', hue: ARA },
    { n: 'Celesto Tower 4', d: 'DLRC · 2028', hue: CEL }
  ];
  let x = MX;
  names.forEach((p) => {
    s.addShape(pres.ShapeType.ellipse, { x: x, y: 6.02, w: 0.13, h: 0.13, fill: { color: p.hue } });
    s.addText([{ text: p.n, options: { bold: true, color: INK } },
               { text: ' · ' + p.d, options: { color: INK2 } }], {
      x: x + 0.24, y: 5.86, w: 3.9, h: 0.34, fontFace: BODY, fontSize: 12, margin: 0, valign: 'middle'
    });
    x += 4.1;
  });
  chrome(s);
}

/* 2 — the brief */
{
  const s = newSlide();
  eyebrow(s, 'The brief', 1.0);
  heading(s, "What we're solving for", 1.36, 32);
  s.addText('One buyer, roughly AED 1M of capital, looking for an off-plan one-bedroom that earns. Three shortlisted projects that answer it in three completely different ways.', {
    x: MX, y: 2.34, w: 6.2, h: 1.0, fontFace: BODY, fontSize: 15, color: INK,
    margin: 0, valign: 'top', lineSpacingMultiple: 1.25
  });
  callout(s, {
    x: MX, y: 3.5, w: 6.2, h: 1.05,
    rich: [{ text: 'Edit this slide before you present. ', options: { bold: true, color: INK } },
           { text: "Replace the budget, unit type and priority order with the client's own words — the rest of the deck holds up whatever you put here.", options: {} }]
  });
  tbl(s, {
    x: 7.3, y: 1.36, w: 5.38, colW: [2.7, 2.68], rowH: 0.375, size: 11,
    head: ['Requirement', 'Client brief'],
    rows: [
      ['Budget', '≈ AED 1,000,000'], ['Unit type', '1 Bedroom'], ['Purchase stage', 'Off-plan'],
      ['Priority 1', 'Net rental yield'], ['Priority 2', 'Time to first rent'],
      ['Priority 3', 'Capital before handover'], ['Priority 4', 'Resale liquidity']
    ]
  });
  statRow(s, 5.35, [
    { v: '3', l: 'Projects' }, { v: '3', l: 'Communities' }, { v: '18', u: 'months', l: 'Handover spread' }
  ]);
  chrome(s);
}

/* 3 — at a glance */
{
  const s = newSlide();
  eyebrow(s, 'Head to head', 0.94);
  heading(s, 'The three, side by side', 1.28, 32);
  const g = (t) => ({ t: t, c: VERDICT, b: true });
  tbl(s, {
    x: MX, y: 2.16, w: CW, colW: [3.3, 2.92, 2.92, 2.92], rowH: 0.278, size: 10.5,
    head: ['Metric', 'Floareá Skies', 'Arancia', 'Celesto 4'],
    rows: [
      ['Community', 'JVC', 'City of Arabia', 'DLRC'],
      ['Developer', 'Mashriq Elite', 'BEYOND · OMNIYAT', 'Al Tarrad'],
      ['Handover', g('Q1 2028'), 'Q1 2029', 'Q4 2028'],
      ['Units in building', g('192'), '272', '414'],
      ['1 BR size', g('837 sqft'), '750–762 sqft', '550–598 sqft'],
      ['1 BR all-in cost', 'AED 1,204,160', 'AED 1,045,250', g('≈837,250  est')],
      ['Price per sqft', 'AED 1,378', g('AED 1,333'), 'AED 1,454  est'],
      ['Net rental yield', '5.7%', '6.1%', g('6.2%  est')],
      ['Capital in before keys', g('30%'), '40%', '50%'],
      ['4% DLD fee', 'Payable', 'Payable', 'To confirm'],
      ['Furnished on handover', g('Yes'), 'No', g('Yes')],
      ['Metro', 'Purple Line, future', '—', g('Blue Line, 1 min')],
      ['To DXB airport', '35 min', 'To confirm', g('18 min')]
    ]
  });
  s.addText([
    { text: 'Green', options: { bold: true, color: VERDICT } },
    { text: " marks the strongest of the three on that row. Floareá's figures come from a live sales offer (unit FS 611, 18 July 2026); Arancia and Celesto are published or estimated and still to be confirmed on a price list. Not financial advice.", options: {} }
  ], {
    x: MX, y: 6.0, w: CW, h: 0.5, fontFace: BODY, fontSize: 9, color: INK3, margin: 0, valign: 'top'
  });
  chrome(s);
}

/* 3b — two bedrooms */
{
  const s = newSlide();
  eyebrow(s, 'If the brief moves up a size', 0.94);
  heading(s, 'The two-bedroom picture', 1.28, 32);
  s.addText('All three quote a two-bedroom, and the spread is wide — AED 780,000 between the cheapest and the dearest before a single fee is added.', {
    x: MX, y: 2.06, w: 9.8, h: 0.4, fontFace: BODY, fontSize: 12, color: INK2, margin: 0, valign: 'top'
  });
  const req = (t) => ({ t: t, c: INK3 });
  const g2 = (t) => ({ t: t, c: VERDICT, b: true });
  tbl(s, {
    x: MX, y: 2.56, w: CW, colW: [3.3, 2.92, 2.92, 2.92], rowH: 0.278, size: 10.5,
    head: ['2 Bedroom', 'Floareá Skies', 'Arancia', 'Celesto 4'],
    rows: [
      ['Price from', 'AED 1,900,000', 'AED 2,100,000', g2('AED 1,320,000')],
      ['Size', req('To confirm'), '1,100–1,179 sqft', '852–1,070 sqft'],
      ['Price per sqft', req('To confirm'), 'AED 1,909', g2('AED 1,550')],
      ['Step-up vs own 1 BR / sqft', req('To confirm'), '+43%', g2('+7%')],
      ['DLD 4%', '76,000', '84,000', '52,800'],
      ['Admin fee', '4,000', '5,250  est', '5,250  est'],
      [{ t: 'All-in cost', total: true }, { t: 'AED 1,980,000', total: true }, { t: 'AED 2,189,250', total: true }, { t: 'AED 1,378,050', total: true, c: VERDICT }],
      ['Units of this type', req('To confirm'), req('To confirm'), '72 of 414'],
      ['Payment plan', g2('30 / 70'), '40 / 60', '50 / 50, 1% monthly'],
      ['Handover', g2('Q1 2028'), 'Q1 2029', 'Q4 2028']
    ]
  });
  callout(s, {
    x: MX, y: 5.72, w: 6.0, h: 1.12, size: 10,
    rich: [{ text: 'The number worth saying out loud. ', options: { bold: true, color: INK } },
           { text: "Celesto's two-bedroom is 851.64 sqft — within fourteen square feet of Floareá's ONE-bedroom at 837.54. Same floor area, an extra bedroom, for AED 173,890 more all-in.", options: {} }]
  });
  callout(s, {
    x: 7.0, y: 5.72, w: 5.68, h: 1.12, size: 10,
    rich: [{ text: 'How each prices the step up. ', options: { bold: true, color: INK } },
           { text: 'Arancia charges 43% more per sqft for its two-bedroom than its one-bedroom. Celesto charges 7%. Arancia is the better 1 BR buy; Celesto is by far the better 2 BR buy.', options: {} }]
  });
  chrome(s);
}

/* 4 — capital exposure */
{
  const s = newSlide();
  eyebrow(s, 'Where your money sits, and when', 0.94);
  heading(s, 'Capital exposure before you hold keys', 1.28, 30);
  s.addText("Each bar is 100% of the purchase price. The question that matters isn't the headline split — it's how much is out of your pocket before the asset can earn anything.", {
    x: MX, y: 2.06, w: 8.6, h: 0.6, fontFace: BODY, fontSize: 12, color: INK2, margin: 0, valign: 'top'
  });
  /* categories are plotted bottom-up on a horizontal bar chart, so feed them reversed
     to read Floareá → Arancia → Celesto down the slide */
  const CATS = ['Celesto 4', 'Arancia', 'Floareá Skies'];
  s.addChart(pres.ChartType.bar, [
    { name: 'Down payment / booking', labels: CATS, values: [20, 10, 20] },
    { name: 'During construction', labels: CATS, values: [30, 30, 10] },
    { name: 'On handover', labels: CATS, values: [50, 60, 70] }
  ], {
    x: MX - 0.1, y: 2.7, w: CW + 0.1, h: 2.5,
    barDir: 'bar', barGrouping: 'stacked', barGapWidthPct: 58,
    chartColors: ['CDE4F2', '8FC0DC', '4E93BB'],
    showValue: true, dataLabelPosition: 'ctr', dataLabelColor: '0F1412',
    dataLabelFontFace: BODY, dataLabelFontSize: 10, dataLabelFormatCode: '0"%"',
    catAxisLabelColor: INK, catAxisLabelFontFace: BODY, catAxisLabelFontSize: 12,
    valAxisLabelColor: INK3, valAxisLabelFontFace: BODY, valAxisLabelFontSize: 9,
    valAxisMinVal: 0, valAxisMaxVal: 100, valAxisMajorUnit: 25, valAxisLabelFormatCode: '0"%"',
    valGridLine: { color: LINE, size: 0.5 }, catGridLine: { style: 'none' },
    catAxisLineShow: false, valAxisLineShow: false,
    showLegend: true, legendPos: 'b', legendColor: INK2, legendFontFace: BODY, legendFontSize: 10,
    showTitle: false, plotArea: { fill: { color: GROUND } }, chartArea: { fill: { color: GROUND } }
  });
  tbl(s, {
    x: MX, y: 5.42, w: 6.0, colW: [2.1, 1.3, 1.3, 1.3], rowH: 0.3, size: 10.5,
    head: ['Project', 'Before keys', 'On handover', 'Shape'],
    rows: [
      ['Floareá Skies', { t: '30%', c: VERDICT, b: true }, '70%', 'Milestone'],
      ['Arancia', '40%', '60%', 'Milestone'],
      ['Celesto 4', '50%', { t: '50%', c: VERDICT, b: true }, { t: '1% monthly', c: VERDICT, b: true }]
    ]
  });
  callout(s, {
    x: 7.0, y: 5.42, w: 5.68, h: 1.32, size: 10.5,
    rich: [{ text: 'Two different kinds of easy. ', options: { bold: true, color: INK } },
           { text: "Floareá asks the least before keys — 30%, of which 20% is the booking. It also carries the largest payment at the end: 70% on completion, usually the point a mortgage is drawn. Celesto's 1% a month is the opposite trade.", options: {} }]
  });
  chrome(s);
}

/* 5 — Floareá title */
{
  const s = newSlide();
  coverImage(s, 'floarea-hero.jpg');
  coverText(s, {
    eyebrow: 'High end apartments · Jumeirah Village Circle',
    title: 'Floareá Skies', size: 58,
    tagline: 'A life painted in pastel horizons',
    meta: 'Developer · Mashriq Elite Developments        Handover · Q3–Q4 2027        From · AED 1,050,000'
  });
  chrome(s);
}

/* 6 — Floareá developer */
{
  const s = newSlide();
  chrome(s, FLO, 'Floareá Skies', '· Mashriq Elite');
  eyebrow(s, 'The developer', 1.14, FLO);
  s.addText('Mashriq Elite\nDevelopments', {
    x: MX, y: 1.5, w: 5.2, h: 1.5, fontFace: HEAD, fontSize: 34, bold: true,
    color: INK, margin: 0, valign: 'top', lineSpacingMultiple: 0.95
  });
  statRow(s, 3.3, [{ v: '20', u: '+ yrs', l: 'Group history' }, { v: '4th', l: 'Venture' }], FLO, MX, 5.2);
  s.addText([
    { text: 'The property arm of ', options: {} },
    { text: 'Al Mashriq Group', options: { bold: true, color: INK } },
    { text: ' — a diversified house with over two decades across real estate, project development and telecommunications, with a network spanning the UAE, United States, Europe, Singapore and Saudi Arabia. Design, architecture and delivery sit under one roof in their own design centre.', options: {} }
  ], { x: 6.5, y: 1.5, w: 6.18, h: 1.5, fontFace: BODY, fontSize: 12.5, color: INK2, margin: 0, valign: 'top', lineSpacingMultiple: 1.2 });
  s.addText([
    { text: 'Floareá Skies is their fourth venture, positioned as the project that sets their benchmark. The record is short but real: a project launched September 2023 was ', options: {} },
    { text: 'handed over in August 2025', options: { bold: true, color: INK } },
    { text: ', with further launches in June 2024 and February 2025, and announced chapters in Dubai Islands and Dubailand.', options: {} }
  ], { x: 6.5, y: 3.1, w: 6.18, h: 1.3, fontFace: BODY, fontSize: 12.5, color: INK2, margin: 0, valign: 'top', lineSpacingMultiple: 1.2 });
  callout(s, {
    x: 6.5, y: 4.55, w: 6.18, h: 1.55, size: 11,
    rich: [{ text: 'Said plainly: ', options: { bold: true, color: INK } },
           { text: 'this is a boutique developer, not a Binghatti or an EMAAR. The upside is a small building and negotiable terms. The risk is depth of delivery record — mitigated by verifying the escrow account, RERA registration and construction-linked SPA milestones.', options: {} }]
  });
  chrome(s, FLO, 'Floareá Skies', '· Mashriq Elite');
}

/* 7 — Floareá overview */
{
  const s = newSlide();
  chrome(s, FLO, 'Floareá Skies', '· JVC');
  eyebrow(s, 'The project', 1.14, FLO);
  s.addText("Adjacent to JVC's entry and exit, with a Purple Line metro station coming", {
    x: MX, y: 1.48, w: 5.5, h: 0.8, fontFace: HEAD, fontSize: 17, bold: true,
    color: INK, margin: 0, valign: 'top', lineSpacingMultiple: 1.1
  });
  tbl(s, {
    x: MX, y: 2.42, w: 5.5, colW: [2.35, 3.15], rowH: 0.315, size: 10.5,
    head: ['Attribute', 'Detail'],
    rows: [
      ['Location', 'Jumeirah Village Circle'], ['Types', 'Studio · 1 BR · 2 BR'],
      ['Configuration', 'G + 4P + 19 floors'], ['Total units', '192  (confirm)'],
      ['Handover', 'Q1 2028'], ['Payment plan', '30 / 70 · 20% on booking'],
      ['Service charge', 'To confirm']
    ]
  });
  s.addText([
    { text: 'Amenities. ', options: { bold: true, color: INK } },
    { text: 'Rooftop infinity pool · organic pool · sunken lounge · floating meditation deck · gym · mini golf · ground-floor retail', options: {} }
  ], { x: MX, y: 5.14, w: 5.5, h: 0.62, fontFace: BODY, fontSize: 10.5, color: INK2, margin: 0, valign: 'top' });
  s.addText([
    { text: 'Drive times. ', options: { bold: true, color: INK } },
    { text: 'Internet City & Media City 10 · Miracle Garden 5 · Marina, Burj Al Arab, Mall of the Emirates 15 · Downtown & Dubai Mall 25 · DXB 35', options: {} }
  ], { x: MX, y: 5.82, w: 5.5, h: 0.62, fontFace: BODY, fontSize: 10.5, color: INK2, margin: 0, valign: 'top' });
  s.addImage({ data: img('floarea-pool.jpg'), x: 6.5, y: 1.14, w: 6.18, h: 2.6, sizing: { type: 'cover', w: 6.18, h: 2.6 }, rounding: false });
  s.addImage({ data: img('floarea-living.jpg'), x: 6.5, y: 3.86, w: 3.0, h: 2.4, sizing: { type: 'cover', w: 3.0, h: 2.4 } });
  s.addImage({ data: img('floarea-bedroom.jpg'), x: 9.68, y: 3.86, w: 3.0, h: 2.4, sizing: { type: 'cover', w: 3.0, h: 2.4 } });
}

/* 8 — Floareá deliverables */
{
  const s = newSlide();
  chrome(s, FLO, 'Floareá Skies', "· What's included");
  eyebrow(s, 'Deliverables', 1.14, FLO);
  heading(s, "It arrives fitted — that's the whole argument", 1.5, 28);
  cards(s, 2.42, 3.0, [
    { hue: FLO, title: 'Included', bullets: [
      'Decorative wall cladding — tile and wood-textured panels',
      'Dresser console wall with mirror',
      'Glass wardrobes; glass and wooden in the bedroom',
      'Living room wall console with bookshelf',
      'Bathroom fittings, vanity, LED-lit mirror'
    ] },
    { hue: FLO, title: 'Smart home', bullets: [
      'Alexa-integrated home system',
      'Smart switch panels',
      'AC thermostats',
      'Curtains — provision only. Conduit and electrical point supplied; the smart curtains themselves are not'
    ] },
    { hue: INK3, title: 'Not included', bullets: [
      'Living room mirror', 'Bedroom decor mirror piece', 'Study room furniture',
      'Chandeliers', 'Wallpaper'
    ] }
  ]);
  callout(s, {
    x: MX, y: 5.62, w: CW, h: 0.92, size: 11,
    rich: [{ text: "A fitted unit leases faster and rents higher in JVC's young-professional tenant pool — it is the strongest single reason to choose this project over Arancia. ", options: {} },
           { text: "Note the kitchen specification is blank on the developer's own deliverables sheet", options: { bold: true, color: INK } },
           { text: ' and needs to be confirmed in writing.', options: {} }]
  });
}

/* 9 — Floareá price */
{
  const s = newSlide();
  chrome(s, FLO, 'Floareá Skies', '· Unit FS 611 · 1 BR, 837.54 sqft');
  caption(s, 'Price to be paid', MX, 1.14, 6.0);
  tbl(s, {
    x: MX, y: 1.5, w: 6.0, colW: [2.9, 1.55, 1.55], rowH: 0.315, size: 10.5,
    head: ['1 Bedroom · Type D · 837.54 sqft', 'AED', 'EURO'],
    rows: [
      ['Unit price', '1,154,000', '€269,001'],
      ['DLD registration fee 4%', '46,160', '€10,760'],
      ['Admin fee', '4,000', '€932'],
      ['Average price / sqft', '1,378', '€321'],
      [{ t: 'Total', total: true }, { t: '1,204,160', total: true }, { t: '€280,690', total: true }]
    ]
  });
  caption(s, 'Rental return scenario', 7.0, 1.14, 5.68);
  tbl(s, {
    x: 7.0, y: 1.5, w: 5.68, colW: [2.88, 1.4, 1.4], rowH: 0.315, size: 10.5,
    head: ['Annual', 'AED', 'EURO'],
    rows: [
      ['Average gross rental estimate', '80,000', '€18,648'],
      ['Unit size', '837.54 sqft', '—'],
      ['Service charge', '11,726', '€2,733'],
      ['Net rental estimate', '68,274', '€15,915'],
      [{ t: 'Net rental yield', total: true }, { t: '5.7%', total: true }, { t: '', total: true }]
    ]
  });
  callout(s, {
    x: MX, y: 3.6, w: 6.0, h: 1.0, size: 10.5,
    rich: [{ text: 'These are real numbers, not a "from" price. ', options: { bold: true, color: INK } },
           { text: "Everything above is taken from the developer's sales offer for unit FS 611 dated 18 July 2026 — a specific 6th-floor pool-view apartment with one parking bay.", options: {} }]
  });
  callout(s, {
    x: 7.0, y: 3.6, w: 5.68, h: 1.0, size: 10.5,
    rich: [{ text: 'The two estimates. ', options: { bold: true, color: INK } },
           { text: "Service charge at AED 14/sqft is modelled, not published. Gross rent of AED 80,000 is mid-range for a JVC 1BR — the range is 74–86k.", options: {} }]
  });
  statRow(s, 5.05, [
    { v: 'Q1 2028', l: 'Handover · earliest' }, { v: '837', u: 'sqft', l: 'Largest 1 BR' },
    { v: '30%', l: 'Capital before keys · least' }, { v: 'Fitted', l: 'On handover' }
  ], FLO);
  disclaimer(s, 'FX 1 EUR = 4.29 AED. Net yield is net rental divided by total cost including fees. Figures subject to change — verify on the price list and SPA. Not financial advice.');
}

/* Floareá — sales offer & payment schedule */
{
  const s = newSlide();
  chrome(s, FLO, 'Floareá Skies', '· Sales offer S 611 · 18 July 2026');
  eyebrow(s, 'The actual schedule', 1.14, FLO);
  tbl(s, {
    x: MX, y: 1.5, w: 6.0, colW: [1.9, 0.85, 1.65, 1.6], rowH: 0.315, size: 10.5,
    head: ['Description', '%', 'Due', 'AED'],
    rows: [
      ['Down payment', '20%', 'On booking', '230,800'],
      ['1st instalment', '5%', '1 Dec 2026', '57,700'],
      ['2nd instalment', '5%', '1 Jun 2027', '57,700'],
      ['On completion', '70%', 'Q1 2028', '807,800'],
      [{ t: 'Total', total: true }, { t: '100%', total: true }, { t: '', total: true }, { t: '1,154,000', total: true }]
    ]
  });
  tbl(s, {
    x: MX, y: 3.58, w: 6.0, colW: [1.9, 0.85, 1.65, 1.6], rowH: 0.315, size: 10.5,
    head: ['Government & admin fees', '%', 'Due', 'AED'],
    rows: [
      ['DLD fee', '4%', 'Booking date', '46,160'],
      ['Admin fee', '—', 'Booking date', '4,000'],
      [{ t: 'Due at booking, all in', total: true }, { t: '', total: true }, { t: '', total: true }, { t: '280,960', total: true }]
    ]
  });
  callout(s, {
    x: MX, y: 5.08, w: 6.0, h: 1.15, size: 10.5,
    rich: [{ text: 'What the client writes on day one: AED 280,960. ', options: { bold: true, color: INK } },
           { text: 'The 20% deposit plus DLD and admin, all due at booking. After that only AED 115,400 falls due across the next eighteen months.', options: {} }]
  });
  eyebrow(s, 'Unit FS 611 · 1 Bedroom Type D', 1.14, FLO, 7.0, 5.68);
  s.addImage({ data: img('floarea-floorplan.jpg'), x: 7.0, y: 1.5, w: 5.68, h: 4.01 });
  tbl(s, {
    x: 7.0, y: 5.68, w: 5.68, colW: [2.3, 3.38], rowH: 0.3, size: 10.5,
    head: ['Unit detail', 'Value'],
    rows: [
      ['Unit / floor / parking', 'FS 611 · 6th floor · 01'],
      ['Total area', '678.34 suite + 159.20 balcony = 837.54 sqft']
    ]
  });
}

/* 10 — Arancia title */
{
  const s = newSlide();
  s.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: W, h: H, fill: { color: '11150F' } });
  s.addShape(pres.ShapeType.ellipse, { x: 6.2, y: -2.9, w: 9.6, h: 6.4, fill: { color: ARA, transparency: 78 } });
  coverText(s, {
    eyebrow: 'Garden residences · City of Arabia',
    title: 'Arancia', size: 58,
    tagline: 'Citrus courtyards, one kilometre of green',
    meta: 'Developer · BEYOND · OMNIYAT Group        Handover · Q1 2029        From · AED 1,000,000'
  });
  chrome(s);
}

/* 11 — Arancia developer */
{
  const s = newSlide();
  chrome(s, ARA, 'Arancia', '· BEYOND · OMNIYAT');
  eyebrow(s, 'The developer', 1.14, ARA);
  s.addText('BEYOND', {
    x: MX, y: 1.5, w: 5.2, h: 0.9, fontFace: HEAD, fontSize: 40, bold: true, color: INK, margin: 0, valign: 'top'
  });
  s.addText([
    { text: 'The premium residential brand of ', options: {} },
    { text: 'OMNIYAT Group', options: { bold: true, color: INK } },
    { text: ", founded in Dubai in 2005 — the group behind the city's ultra-prime waterfront portfolio.", options: {} }
  ], { x: MX, y: 2.5, w: 5.2, h: 1.0, fontFace: BODY, fontSize: 12.5, color: INK2, margin: 0, valign: 'top', lineSpacingMultiple: 1.2 });
  statRow(s, 3.85, [{ v: 'AED 4', u: 'bn', l: 'Masterplan value' }, { v: '70%', l: 'Open landscape' }], ARA, MX, 5.2);
  s.addText([
    { text: 'The Yards', options: { bold: true, color: INK } },
    { text: " is BEYOND's master-planned destination in City of Arabia: 2.3 million sqft of gross floor area, 1,560 residences, organised along a one-kilometre green spine, with 70% of the total area given to open landscape. Mediterranean-inspired, with its own school, clinic, mosque, farm, gardens and retail — a complete community rather than an apartment block with a pool.", options: {} }
  ], { x: 6.5, y: 1.5, w: 6.18, h: 1.9, fontFace: BODY, fontSize: 12.5, color: INK2, margin: 0, valign: 'top', lineSpacingMultiple: 1.2 });
  s.addText([
    { text: 'Arancia is the first cluster to launch', options: { bold: true, color: INK } },
    { text: ' inside it: 272 residences across three low-rise buildings, G+6 and G+7, arranged around a central green valley.', options: {} }
  ], { x: 6.5, y: 3.5, w: 6.18, h: 0.9, fontFace: BODY, fontSize: 12.5, color: INK2, margin: 0, valign: 'top', lineSpacingMultiple: 1.2 });
  callout(s, {
    x: 6.5, y: 4.55, w: 6.18, h: 1.55, size: 11,
    rich: [{ text: 'Both sides of being early. ', options: { bold: true, color: INK } },
           { text: 'Your client buys at first-phase pricing into a community that will still be building around them for years. That is the upside and the risk in the same sentence — and the reason the handover is 2029.', options: {} }]
  });
}

/* 12 — Arancia overview */
{
  const s = newSlide();
  chrome(s, ARA, 'Arancia', '· City of Arabia');
  eyebrow(s, 'The project', 1.14, ARA);
  s.addText('Three low-rise buildings around a central green valley, inside a AED 4bn masterplan', {
    x: MX, y: 1.48, w: 5.5, h: 0.8, fontFace: HEAD, fontSize: 17, bold: true, color: INK, margin: 0, valign: 'top', lineSpacingMultiple: 1.1
  });
  tbl(s, {
    x: MX, y: 2.42, w: 5.5, colW: [2.35, 3.15], rowH: 0.315, size: 10.5,
    head: ['Attribute', 'Detail'],
    rows: [
      ['Location', 'City of Arabia, Dubailand'], ['Types', '1 · 2 · 3 Bedrooms'],
      ['Buildings', '3 low-rise, G+6 / G+7'], ['Total units', '272 in phase · 1,560 masterplan'],
      ['Handover', 'Q1 2029'], ['Ceiling height', '3.1 m'],
      ['Payment plan', '40 / 60'], ['Service charge', 'To confirm']
    ]
  });
  caption(s, 'Price ladder', 6.5, 1.14, 6.18);
  tbl(s, {
    x: 6.5, y: 1.5, w: 6.18, colW: [1.9, 2.28, 2.0], rowH: 0.315, size: 10.5,
    head: ['Type', 'Size', 'From'],
    rows: [
      ['1 Bed', '750–762 sqft', 'AED 1,000,000'],
      ['2 Beds', '1,100–1,179 sqft', 'AED 2,100,000'],
      ['3 Beds', '1,700–1,751 sqft', 'AED 3,370,000']
    ]
  });
  s.addText([
    { text: 'In-unit. ', options: { bold: true, color: INK } },
    { text: 'Private terraces to every residence · 3.1 m ceilings · floor-to-ceiling thermally insulated glazing · courtyard views', options: {} }
  ], { x: 6.5, y: 3.15, w: 6.18, h: 0.6, fontFace: BODY, fontSize: 10.5, color: INK2, margin: 0, valign: 'top' });
  s.addText([
    { text: 'Amenities. ', options: { bold: true, color: INK } },
    { text: "Lagoon pool · lounge pool with lap pool · gyms · spa · cinema room · kids' club · yoga areas · sports court · amphitheatre · orchard gardens · farm", options: {} }
  ], { x: 6.5, y: 3.85, w: 6.18, h: 0.8, fontFace: BODY, fontSize: 10.5, color: INK2, margin: 0, valign: 'top' });
  s.addShape(pres.ShapeType.roundRect, {
    x: 6.5, y: 4.82, w: 6.18, h: 1.28, rectRadius: 0.03,
    fill: { color: SURF }, line: { color: LINE, width: 0.75, dashType: 'dash' }
  });
  s.addText('Render slot — drop the five Arancia images in here as a photo grid', {
    x: 6.6, y: 4.82, w: 5.98, h: 1.28, fontFace: BODY, fontSize: 11, color: INK3,
    align: 'center', valign: 'middle', margin: 0
  });
}

/* 13 — Arancia price */
{
  const s = newSlide();
  chrome(s, ARA, 'Arancia', '· 1 BR, 750 sqft');
  caption(s, 'Price to be paid', MX, 1.14, 6.0);
  tbl(s, {
    x: MX, y: 1.5, w: 6.0, colW: [2.9, 1.55, 1.55], rowH: 0.315, size: 10.5,
    head: ['1 Bedroom · 750 sqft', 'AED', 'EURO'],
    rows: [
      ['Unit price', '1,000,000', '€233,100'],
      ['DLD registration fee 4%', '40,000', '€9,324'],
      ['Admin fee', '5,250', '€1,224'],
      ['Average price / sqft', { t: '1,333', c: VERDICT, b: true }, '€311'],
      [{ t: 'Total', total: true }, { t: '1,045,250', total: true }, { t: '€243,648', total: true }]
    ]
  });
  caption(s, 'Rental return scenario', 7.0, 1.14, 5.68);
  tbl(s, {
    x: 7.0, y: 1.5, w: 5.68, colW: [2.88, 1.4, 1.4], rowH: 0.315, size: 10.5,
    head: ['Annual', 'AED', 'EURO'],
    rows: [
      ['Average gross rental estimate', '75,000', '€17,483'],
      ['Unit size', '750 sqft', '—'],
      ['Service charge', '11,250', '€2,622'],
      ['Net rental estimate', '63,750', '€14,860'],
      [{ t: 'Net rental yield', total: true }, { t: '6.1%', total: true }, { t: '', total: true }]
    ]
  });
  callout(s, {
    x: MX, y: 3.6, w: 6.0, h: 1.0, size: 10.5,
    rich: [{ text: 'Cheapest land per foot of the three. ', options: { bold: true, color: INK } },
           { text: "AED 1,333/sqft buys the largest one-bedroom in the comparison — 750 sqft against Celesto's 550.", options: {} }]
  });
  callout(s, {
    x: 7.0, y: 3.6, w: 5.68, h: 1.0, size: 10.5,
    rich: [{ text: 'Assumptions. ', options: { bold: true, color: INK } },
           { text: 'Service charge modelled at AED 14/sqft — unpublished, and the amenity load is heavy. At AED 25/sqft the net yield falls to roughly 5.4%.', options: {} }]
  });
  statRow(s, 5.05, [
    { v: '2029', l: 'Handover · longest wait' }, { v: '272', l: 'Units in phase' },
    { v: '40%', l: 'Capital before keys · least' }, { v: '750', u: 'sqft', l: 'Largest 1 BR' }
  ], ARA);
  disclaimer(s, 'FX 1 EUR = 4.29 AED. Net yield is net rental divided by total cost including fees. Figures subject to change — verify on the price list and SPA. Not financial advice.');
}

/* 14 — Celesto title */
{
  const s = newSlide();
  coverImage(s, 'celesto-hero.jpg');
  coverText(s, {
    eyebrow: 'High end apartments · Dubailand Residence Complex',
    title: 'Celesto Tower 4', size: 58,
    meta: 'Developer · Al Tarrad Development        Handover · Q4 2028        From · AED 540,000'
  });
  chrome(s);
}

/* 15 — Celesto developer */
{
  const s = newSlide();
  chrome(s, CEL, 'Celesto Tower 4', '· Al Tarrad');
  eyebrow(s, 'The developer', 1.14, CEL);
  s.addText('Al Tarrad\nDevelopment', {
    x: MX, y: 1.5, w: 5.2, h: 1.5, fontFace: HEAD, fontSize: 34, bold: true, color: INK, margin: 0, valign: 'top', lineSpacingMultiple: 0.95
  });
  statRow(s, 3.3, [{ v: '4th', l: 'In the series' }, { v: '99.99%', l: 'Of allowed GFA used' }], CEL, MX, 5.2);
  s.addText([
    { text: 'Al Tarrad runs a focused, repeatable formula: mid-rise residential towers in Dubailand aimed at the investor and entry end-user market — fully furnished, smart-home fitted, priced below the mid-market. ', options: {} },
    { text: 'Celesto 4 is the fourth in a numbered series', options: { bold: true, color: INK } },
    { text: ', which tells you the model works well enough to keep running.', options: {} }
  ], { x: 6.5, y: 1.5, w: 6.18, h: 1.6, fontFace: BODY, fontSize: 12.5, color: INK2, margin: 0, valign: 'top', lineSpacingMultiple: 1.2 });
  s.addText('The submitted design package is itself a confidence signal: a full climate and solar study, site accessibility and land-use analysis, verified area calculations against permitted GFA, a reconciled unit matrix and complete floor plans. Residential GFA comes in at 22,309.05 sqm against an allowed 22,311.00.', {
    x: 6.5, y: 3.2, w: 6.18, h: 1.25, fontFace: BODY, fontSize: 12.5, color: INK2, margin: 0, valign: 'top', lineSpacingMultiple: 1.2
  });
  callout(s, {
    x: 6.5, y: 4.6, w: 6.18, h: 1.5, size: 11,
    rich: [{ text: 'Be straight about what that number means. ', options: { bold: true, color: INK } },
           { text: 'The developer has taken essentially every square metre the plot allows. That is efficient — and it is why there are 414 units here. Density drives the low entry price and the competition at handover. Both, not one.', options: {} }]
  });
}

/* 16 — Celesto overview */
{
  const s = newSlide();
  chrome(s, CEL, 'Celesto Tower 4', '· DLRC');
  eyebrow(s, 'The project', 1.14, CEL);
  s.addText('One minute from a Blue Line metro station, eighteen from Downtown, DIFC and the airport', {
    x: MX, y: 1.48, w: 5.5, h: 0.8, fontFace: HEAD, fontSize: 17, bold: true, color: INK, margin: 0, valign: 'top', lineSpacingMultiple: 1.1
  });
  tbl(s, {
    x: MX, y: 2.42, w: 5.5, colW: [2.35, 3.15], rowH: 0.315, size: 10.5,
    head: ['Attribute', 'Detail'],
    rows: [
      ['Location', 'DLRC, Wadi Al Safa 5'], ['Types', 'Studio · 1 BHK · 2 BHK'],
      ['Configuration', '3B + G + M + 3P + 21 floors'], ['Total units', '414'],
      ['Handover', 'Q4 2028'], ['Parking', '1 space per apartment'],
      ['Furnishing', 'Fully furnished, smart home'], ['Service charge', 'To confirm']
    ]
  });
  s.addText([
    { text: 'Amenities. ', options: { bold: true, color: INK } },
    { text: 'Indoor and outdoor gym · indoor and outdoor kids play areas · adults and kids pools · sauna and jacuzzi · BBQ area · yoga area · outdoor cinema · zen garden · ground-floor retail', options: {} }
  ], { x: MX, y: 5.44, w: 5.5, h: 0.9, fontFace: BODY, fontSize: 10.5, color: INK2, margin: 0, valign: 'top' });
  caption(s, 'Unit mix', 6.5, 1.14, 6.18);
  tbl(s, {
    x: 6.5, y: 1.5, w: 6.18, colW: [2.28, 2.4, 1.5], rowH: 0.315, size: 10.5,
    head: ['Type', 'Size incl. balcony', 'Units'],
    rows: [
      ['Studio · A–D', '326–363 sqft', '162'],
      ['1 BHK · A–C', '550–598 sqft', '180'],
      ['2 BHK · A–D', '852–1,070 sqft', '72'],
      [{ t: 'Total', total: true }, { t: '', total: true }, { t: '414', total: true }]
    ]
  });
  s.addImage({ data: img('celesto-night.jpg'), x: 6.5, y: 3.4, w: 6.18, h: 2.6, sizing: { type: 'cover', w: 6.18, h: 2.6 } });
}

/* 17 — Celesto price */
{
  const s = newSlide();
  chrome(s, CEL, 'Celesto Tower 4', '· Studio & 1 BR');
  caption(s, 'Studio · 326 sqft · confirmed entry price', MX, 1.14, 6.0);
  tbl(s, {
    x: MX, y: 1.5, w: 6.0, colW: [2.9, 1.55, 1.55], rowH: 0.3, size: 10.5,
    head: ['Studio', 'AED', 'EURO'],
    rows: [
      ['Unit price', '540,000', '€125,874'],
      ['DLD registration fee 4%', '21,600', '€5,035'],
      ['Admin fee', '5,250', '€1,224'],
      ['Average price / sqft', '1,657', '€386'],
      [{ t: 'Total', total: true }, { t: '566,850', total: true }, { t: '€132,133', total: true }],
      ['Net rental estimate', '37,439', '€8,727'],
      [{ t: 'Net rental yield', total: true }, { t: '6.6%', total: true, c: VERDICT }, { t: '', total: true }]
    ]
  });
  caption(s, '1 Bedroom · 550 sqft · price estimated', 7.0, 1.14, 5.68);
  tbl(s, {
    x: 7.0, y: 1.5, w: 5.68, colW: [2.88, 1.4, 1.4], rowH: 0.3, size: 10.5,
    head: ['1 Bedroom', 'AED', 'EURO'],
    rows: [
      ['Unit price  (estimate)', '≈800,000', '€186,480'],
      ['DLD registration fee 4%', '32,000', '€7,459'],
      ['Admin fee', '5,250', '€1,224'],
      ['Average price / sqft', '1,454', '€339'],
      [{ t: 'Total', total: true }, { t: '837,250', total: true }, { t: '€195,163', total: true }],
      ['Net rental estimate', '52,295', '€12,190'],
      [{ t: 'Net rental yield', total: true }, { t: '6.2%', total: true }, { t: '', total: true }]
    ]
  });
  callout(s, {
    x: MX, y: 3.85, w: 6.0, h: 1.1, size: 10.5,
    rich: [{ text: 'The 1BR price is not confirmed. ', options: { bold: true, color: 'E0A45C' } },
           { text: 'Only the AED 540,000 studio entry is published. The AED 823,000 figure online belongs to Celesto Tower — the earlier 272-unit, Q4 2027 project. Replace this column from the price list.', options: {} }]
  });
  callout(s, {
    x: 7.0, y: 3.85, w: 5.68, h: 1.1, size: 10.5,
    rich: [{ text: 'Read the price per foot, not the ticket. ', options: { bold: true, color: INK } },
           { text: "At AED 1,454/sqft this is level with Floareá's 1,464. The low entry price comes from a smaller apartment, not a discount.", options: {} }]
  });
  statRow(s, 5.2, [
    { v: '2028', l: 'Handover' }, { v: '414', l: 'Units · most' },
    { v: '1%', u: '/month', l: 'For 30 months' }, { v: '1', u: 'min', l: 'To Blue Line metro' }
  ], CEL);
  disclaimer(s, 'FX 1 EUR = 4.29 AED. Service charge modelled at AED 14/sqft. Net yield is net rental divided by total cost including fees. Not financial advice.');
}

/* 18 — trade-offs */
{
  const s = newSlide();
  eyebrow(s, 'What each one costs you', 0.94);
  heading(s, 'No project here is perfect', 1.28, 32);
  s.addText('Every option has a real weakness. These are the ones worth knowing before signing, not after.', {
    x: MX, y: 2.06, w: 9, h: 0.36, fontFace: BODY, fontSize: 12, color: INK2, margin: 0, valign: 'middle'
  });
  cards(s, 2.6, 3.7, [
    { hue: FLO, title: 'Floareá Skies', kicker: 'The catch', bullets: [
      'Boutique developer with a thin delivery record — the real risk on this deal',
      "JVC is Dubai's most crowded pipeline: 16,800–22,000 units to 2028, so rents may soften 5–10% at handover",
      '70% falls due on completion — the largest single payment of the three, usually the point a mortgage is drawn',
      'Highest all-in cost of the three at AED 1.2M, and the lowest modelled net yield at 5.7%',
      'Service charge unpublished on a heavily amenitised rooftop'
    ] },
    { hue: ARA, title: 'Arancia', kicker: 'The catch', bullets: [
      'Q1 2029 handover — the longest wait. Four years before a dirham of rent',
      "1,560 units across the masterplan: resale competes with the developer's own later phases",
      'Inland City of Arabia — resale depends on the community delivering as drawn',
      'Not furnished, unlike the other two',
      'Heaviest amenity load with no published service charge'
    ] },
    { hue: CEL, title: 'Celesto Tower 4', kicker: 'The catch', bullets: [
      '414 units in one building — at handover the 1BR competes with 179 identical neighbours',
      '39% of the building is studios — investor-heavy, higher churn, weaker resale base',
      'The 1BR is small at 550 sqft; price per foot is not cheap',
      'One parking space per apartment, no resident surplus',
      'Least established developer; record on Celesto 1–3 unverified'
    ] }
  ]);
  chrome(s);
}

/* 19 — the decision */
{
  const s = newSlide();
  eyebrow(s, 'The decision', 0.94);
  heading(s, 'Three different propositions, not a ranking', 1.28, 30);
  s.addText("The numbers land close enough that they don't decide this. What decides it is which of these three sentences sounds most like you.", {
    x: MX, y: 2.02, w: 10, h: 0.36, fontFace: BODY, fontSize: 12, color: INK2, margin: 0, valign: 'middle'
  });
  const rows = [
    { hue: FLO, q: '“I want the biggest apartment, the earliest keys, and the least tied up until then.”', a: 'Floareá Skies',
      why: 'Q1 2028, 837 sqft, only 30% before handover. The trade is a lower yield and a 70% completion payment.' },
    { hue: ARA, q: '“I can wait. I want the strongest name behind it and the cheapest land per foot.”', a: 'Arancia',
      why: "OMNIYAT's premium brand at AED 1,333/sqft, and the only true community product." },
    { hue: CEL, q: '“I want the smallest cheque, paid monthly, and the best yield.”', a: 'Celesto Tower 4',
      why: 'Lowest entry by a wide margin, 1% a month for 30 months, strongest modelled yield.' }
  ];
  rows.forEach((r, i) => {
    const y = 2.6 + i * 1.06;
    s.addShape(pres.ShapeType.roundRect, {
      x: MX, y: y, w: CW, h: 0.92, rectRadius: 0.03,
      fill: { color: SURF2 }, line: { color: LINE, width: 0.5 }
    });
    s.addShape(pres.ShapeType.ellipse, { x: MX + 0.26, y: y + 0.38, w: 0.16, h: 0.16, fill: { color: r.hue } });
    s.addText(r.q, {
      x: MX + 0.54, y: y + 0.06, w: 6.1, h: 0.8, fontFace: BODY, fontSize: 13,
      color: INK, italic: true, margin: 0, valign: 'middle'
    });
    s.addText(r.a, {
      x: MX + 6.75, y: y + 0.06, w: 2.5, h: 0.8, fontFace: HEAD, fontSize: 15,
      bold: true, color: r.hue, align: 'right', margin: 0, valign: 'middle'
    });
    s.addText(r.why, {
      x: MX + 9.45, y: y + 0.08, w: 2.35, h: 0.78, fontFace: BODY, fontSize: 9,
      color: INK3, margin: 0, valign: 'middle'
    });
  });
  callout(s, {
    x: MX, y: 5.86, w: CW, h: 0.94, size: 11,
    rich: [{ text: 'My read, and it changed once the real Floareá numbers came in: ', options: { bold: true, color: INK } },
           { text: 'on a live sales offer Floareá prices at AED 1.2M all-in for 837 sqft — the largest unit and the earliest keys, but the lowest modelled yield at 5.7%. For a yield-first buyer the answer is now Celesto 4, subject to its price list. For space, earliest handover and least capital tied up, it is Floareá. ', options: {} },
           { text: 'What would change it again: ', options: { bold: true, color: INK } },
           { text: "Celesto's 1BR price is unconfirmed — above AED 900,000 its yield advantage largely disappears and Arancia takes it.", options: {} }]
  });
  chrome(s);
}

/* 20 — next steps */
{
  const s = newSlide();
  eyebrow(s, 'Next steps', 1.1);
  heading(s, 'Where we go from here', 1.46, 32);
  const steps = [
    "Shortlist one, and I'll pull live availability and the current price list the same day.",
    "I'll get the service charge in writing on your pick — it moves net yield up to a full point.",
    'Escrow account and RERA registration verified before any deposit moves.',
    'Site visit or sales-centre walkthrough arranged for the two you like most.'
  ];
  steps.forEach((t, i) => {
    const y = 2.5 + i * 0.78;
    s.addShape(pres.ShapeType.roundRect, {
      x: MX, y: y, w: 7.3, h: 0.64, rectRadius: 0.03,
      fill: { color: SURF2 }, line: { color: LINE, width: 0.5 }
    });
    s.addShape(pres.ShapeType.ellipse, { x: MX + 0.24, y: y + 0.24, w: 0.16, h: 0.16, fill: { color: VERDICT } });
    s.addText(t, {
      x: MX + 0.52, y: y, w: 6.6, h: 0.64, fontFace: BODY, fontSize: 12,
      color: INK, margin: 0, valign: 'middle'
    });
  });
  eyebrow(s, 'Your broker', 2.5, undefined, 8.4, 4.28);
  s.addText('Marwan Wareth', {
    x: 8.4, y: 2.82, w: 4.28, h: 0.68, fontFace: HEAD, fontSize: 28, bold: true, color: INK, margin: 0, valign: 'middle'
  });
  s.addText('Dubai off-plan residential', {
    x: 8.4, y: 3.5, w: 4.28, h: 0.36, fontFace: BODY, fontSize: 13, color: INK2, margin: 0, valign: 'middle'
  });
  callout(s, {
    x: 8.4, y: 4.1, w: 4.28, h: 1.2, size: 10.5,
    rich: [{ text: 'Add your phone, email and Instagram handle here before sending — this is the slide the client screenshots.', options: {} }]
  });
  chrome(s);
  disclaimer(s, 'All figures developer- and broker-published and subject to change. For information only — not financial advice. Verify on the current price list and SPA.');
}

/* 21 — internal */
{
  const s = newSlide();
  eyebrow(s, 'Internal — remove before sending to the client', 0.94, 'E0A45C');
  heading(s, 'Verify before you present', 1.28, 30);
  cards(s, 2.16, 3.5, [
    { hue: FLO, title: 'Floareá Skies', bullets: [
      '1 BR now confirmed from sales offer FS 611 — price, size, plan, fees, Q1 2028',
      '2 BR price list and sizes — needed',
      'Service charge per sqft in writing',
      'Total unit count (192?) — not in the brochure',
      'Kitchen spec — blank on the deliverables sheet',
      'Is FS 611 still available, or an indicative unit?'
    ] },
    { hue: ARA, title: 'Arancia', bullets: [
      'Service charge per sqft — at AED 25 the yield drops to ~5.4%',
      '2 BR: confirm the AED 2.1M and get sizes per unit type',
      "1BR entry: AED 1.0M on portals vs 1.1M on BEYOND's own site",
      'Drive times to Dubai Mall and DXB — unverified, so omitted',
      'Handover quarter: Q1 2029 dominant, Q2 2029 also cited',
      'Spelling — it is Arancia, not Anarcia'
    ] },
    { hue: CEL, title: 'Celesto Tower 4', bullets: [
      '1BR and 2BR price list — the blocker',
      'Service charge per sqft',
      'Is the 4% DLD payable or waived? AED 32k of difference',
      "Al Tarrad's delivery record on Celesto 1–3",
      'Escrow and RERA/DDA registration',
      'Confirm 21 residential floors — one portal says 20'
    ] }
  ]);
  callout(s, {
    x: MX, y: 5.86, w: CW, h: 0.82, size: 11,
    rich: [{ text: 'Common to all three: get the service charge in writing. ', options: { bold: true, color: INK } },
           { text: 'It is unpublished for every one of them and moves net yield 0.7–1.0 points — enough to reorder the comparison table on slide 3.', options: {} }]
  });
  chrome(s);
}

pres.writeFile({ fileName: path.join(__dirname, 'Three-Projects-One-Decision.pptx') })
  .then((f) => console.log('wrote', f));
