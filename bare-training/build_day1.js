// BARE — Off-Plan Agent Training · DAY 1 sample build (slides 1-21)
// Theme: "Dubai Premium" navy + gold (placeholder; BARE brand swaps in later)
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Fa = require("react-icons/fa");

const C = {
  navy:"0F1F3D", navyCard:"1A2F54", gold:"C9A24B", goldLight:"E4C77E",
  ink:"1E293B", slate:"64748B", cloud:"F4F6FA", ice:"EAF0F8", white:"FFFFFF", green:"2E7D5B"
};
const F = { head:"Cambria", body:"Calibri" };
const sh = () => ({ type:"outer", color:"9AA3B2", opacity:0.45, blur:8, offset:3, angle:90 });

// ---- icon -> png data url (recolored, transparent bg) ----
async function icon(name, hex, px=240){
  const Ic = Fa[name];
  if(!Ic) return null;
  let svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Ic, { size: px }));
  svg = svg.replace(/currentColor/g, "#"+hex);
  const buf = await sharp(Buffer.from(svg)).resize(px,px,{fit:"contain",background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
  return "data:image/png;base64,"+buf.toString("base64");
}
const ICONSET = {
  building:"FaBuilding", gavel:"FaGavel", grad:"FaGraduationCap", id:"FaIdCard",
  shield:"FaShieldAlt", key:"FaKey", contract:"FaFileContract", coins:"FaCoins",
  chart:"FaChartLine", check:"FaCheckCircle", book:"FaBook", users:"FaUsers",
  passport:"FaPassport", mobile:"FaMobileAlt", map:"FaMapMarkedAlt", bolt:"FaBolt",
  scroll:"FaScroll", balance:"FaBalanceScale"
};

(async () => {
  const I = {};
  for(const [k,v] of Object.entries(ICONSET)){ I[k] = { w: await icon(v, C.white), g: await icon(v, C.gold), n: await icon(v, C.navy) }; }

  const pptx = new pptxgen();
  pptx.defineLayout({ name:"W", width:13.333, height:7.5 });
  pptx.layout = "W";
  pptx.author = "BARE"; pptx.company = "BARE";

  const M = 0.6, PW = 13.333, CW = PW - M*2;

  // ---------- helpers ----------
  const bg = (s,c)=> s.background = { color:c };
  const logoTag = (s, color)=> s.addText("BARE", { x:PW-1.7, y:0.32, w:1.2, h:0.4, align:"right",
    fontFace:F.head, fontSize:14, bold:true, color:color||C.gold, charSpacing:3 });
  function title(s, t, sub){
    s.addText(t, { x:M, y:0.45, w:CW-1.4, h:0.75, fontFace:F.head, fontSize:27, bold:true, color:C.navy, align:"left", valign:"middle" });
    if(sub) s.addText(sub, { x:M+0.02, y:1.18, w:CW-1.4, h:0.4, fontFace:F.body, fontSize:13.5, italic:true, color:C.slate, align:"left" });
    logoTag(s, C.gold);
  }
  function card(s,x,y,w,h,fill){
    s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.09,fill:{color:fill||C.cloud},line:{type:"none"},shadow:sh()});
  }
  function circleNum(s,x,y,d,txt){
    s.addShape(pptx.ShapeType.ellipse,{x,y,w:d,h:d,fill:{color:C.gold},line:{type:"none"},shadow:sh()});
    s.addText(String(txt),{x,y,w:d,h:d,align:"center",valign:"middle",fontFace:F.head,fontSize:d>0.75?22:15,bold:true,color:C.navy});
  }
  function circleIcon(s,x,y,d,iconData){
    s.addShape(pptx.ShapeType.ellipse,{x,y,w:d,h:d,fill:{color:C.gold},line:{type:"none"},shadow:sh()});
    if(iconData) s.addImage({data:iconData,x:x+d*0.26,y:y+d*0.26,w:d*0.48,h:d*0.48});
  }
  const notes = (s,t)=> s.addNotes(t);

  // ===================================================== SLIDE 1 — TITLE
  let s = pptx.addSlide(); bg(s, C.navy);
  s.addShape(pptx.ShapeType.ellipse,{x:10.3,y:-1.6,w:5,h:5,fill:{color:C.navyCard},line:{type:"none"}});
  s.addShape(pptx.ShapeType.ellipse,{x:11.0,y:4.6,w:3.6,h:3.6,fill:{color:"13284D"},line:{type:"none"}});
  circleIcon(s,M,1.0,1.0,I.building.w);
  s.addText("BARE", { x:M, y:2.25, w:8, h:0.5, fontFace:F.head, fontSize:18, bold:true, color:C.gold, charSpacing:6 });
  s.addText("Off-Plan Mastery", { x:M, y:2.7, w:11.5, h:1.1, fontFace:F.head, fontSize:52, bold:true, color:C.white });
  s.addText("A 4-Day Agent Training Programme", { x:M, y:3.85, w:11.5, h:0.6, fontFace:F.body, fontSize:22, color:C.goldLight });
  s.addText("From zero to running an off-plan deal — start to finish.", { x:M, y:4.5, w:11.5, h:0.5, fontFace:F.body, fontSize:14, color:"AEB8CC" });
  s.addText("Presenter: ______________     ·     BARE — Off-Plan Team", { x:M, y:6.55, w:11.5, h:0.4, fontFace:F.body, fontSize:12, color:"8794AD" });
  notes(s,"Welcome the room warmly. This is a presenter-led, 4-day live programme. Goal: take a complete beginner to confidently running an off-plan deal end to end. Set the tone — professional, high-energy, 'we build a great team and rise together'. Swap BARE logo onto this slide when ready.");

  // ===================================================== SLIDE 2 — WELCOME & VISION
  s = pptx.addSlide(); bg(s, C.white);
  title(s, "Welcome — and why this programme exists");
  const vis = [
    ["grad","We train, we don't gatekeep","You don't need a real estate background. We take you from zero to closing — step by step."],
    ["users","We rise together","One team, shared standards. Your growth is the team's growth. We win as a unit."],
    ["chart","The timing is rare","Dubai is one of the world's most active property markets. Learn now, position before the next surge."],
  ];
  vis.forEach((v,i)=>{ const x=M+i*(CW/3)+ (i? 0.15:0); const w=CW/3-0.2; const yy=1.9;
    card(s,M+i*(CW/3),yy,w+0.0,3.9);
    circleIcon(s,M+i*(CW/3)+0.35,yy+0.4,0.95,I[v[0]].w);
    s.addText(v[1],{x:M+i*(CW/3)+0.3,y:yy+1.55,w:w-0.6,h:0.8,fontFace:F.head,fontSize:17,bold:true,color:C.navy});
    s.addText(v[2],{x:M+i*(CW/3)+0.3,y:yy+2.35,w:w-0.6,h:1.4,fontFace:F.body,fontSize:13,color:C.ink,valign:"top",lineSpacingMultiple:1.05});
  });
  s.addText("“Make a great team that becomes rich — and rises together.”",{x:M,y:6.15,w:CW,h:0.5,fontFace:F.head,italic:true,fontSize:16,color:C.gold});
  notes(s,"Reassure career-changers and fresh grads: no prior experience needed. Emphasise the mentorship model and the team-first culture. The market timing point: Dubai's scale means learning now pays off when the cycle turns. Keep it motivating, not salesy.");

  // ===================================================== SLIDE 3 — HOW THE 4 DAYS WORK
  s = pptx.addSlide(); bg(s, C.white);
  title(s, "How the 4 days work", "Each day builds on the last — and ends with a short quiz.");
  const days = [
    ["1","Foundations & the rules","The market, the authorities (DLD · RERA · DREI), and the path to becoming a legal broker."],
    ["2","Off-plan & contracts","The off-plan lifecycle, escrow, Oqood, and the RERA forms — A, B, F, I."],
    ["3","The money","Payment plans, mortgages & LTV, the fee stack, ROI, and the Golden Visa."],
    ["4","Selling & closing","Lead handling, discovery, objections, closing techniques and follow-up discipline."],
  ];
  days.forEach((d,i)=>{ const w=(CW-0.45)/4; const x=M+i*(w+0.15); const yy=2.0;
    card(s,x,yy,w,3.6);
    circleNum(s,x+w/2-0.45,yy+0.35,0.9,d[0]);
    s.addText("DAY "+d[0],{x,y:yy+1.35,w,h:0.3,align:"center",fontFace:F.body,fontSize:11,bold:true,color:C.gold,charSpacing:2});
    s.addText(d[1],{x:x+0.18,y:yy+1.62,w:w-0.36,h:0.7,align:"center",fontFace:F.head,fontSize:15,bold:true,color:C.navy});
    s.addText(d[2],{x:x+0.2,y:yy+2.35,w:w-0.4,h:1.1,align:"center",fontFace:F.body,fontSize:11.5,color:C.ink,valign:"top",lineSpacingMultiple:1.05});
  });
  s.addText([{text:"Every day ends with a 5-question quiz",options:{bold:true,color:C.navy}},{text:"  — questions, then an answer key. Attendance and the quizzes track your readiness.",options:{color:C.ink}}],{x:M,y:6.0,w:CW,h:0.5,fontFace:F.body,fontSize:13});
  notes(s,"Walk the room through the arc. Day 1 = rules of the game; Day 2 = the mechanics and paperwork; Day 3 = the numbers; Day 4 = how to actually sell. Quizzes are low-stakes confidence checks, not exams. Encourage questions throughout.");

  // ===================================================== SLIDE 4 — DAY 1 DIVIDER
  s = pptx.addSlide(); bg(s, C.navy);
  s.addShape(pptx.ShapeType.ellipse,{x:-1.4,y:4.4,w:4.6,h:4.6,fill:{color:C.navyCard},line:{type:"none"}});
  s.addText("DAY 1",{x:M,y:2.5,w:7,h:1.0,fontFace:F.head,fontSize:60,bold:true,color:C.gold});
  s.addText("Foundations & the rules of the game",{x:M,y:3.7,w:11,h:0.7,fontFace:F.head,fontSize:26,color:C.white});
  s.addText("The market · the authorities · becoming a legal broker · AML",{x:M,y:4.45,w:11,h:0.5,fontFace:F.body,fontSize:15,color:"AEB8CC"});
  logoTag(s,C.gold);
  notes(s,"Day 1 sets the foundation every later day depends on. By the end they'll know who regulates what, the legal path to working as an agent, and the core vocabulary.");

  // ===================================================== SLIDE 5 — DAY 1 AGENDA
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Day 1 — agenda");
  const ag = [
    ["chart","Dubai market at a glance"],["building","Why off-plan?"],["balance","The players: DLD · RERA · DREI"],
    ["map","Freehold vs leasehold"],["id","Becoming a legal broker (the path)"],["book","Core concepts & glossary"],
    ["shield","AML — what every agent must know"],["check","Recap & Day 1 quiz"],
  ];
  ag.forEach((a,i)=>{ const col=i%2; const row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.95+row*1.18;
    card(s,x,yy,w,0.95,C.ice);
    circleIcon(s,x+0.22,yy+0.17,0.6,I[a[0]].w);
    s.addText(a[1],{x:x+1.0,y:yy,w:w-1.2,h:0.95,valign:"middle",fontFace:F.body,fontSize:15,bold:true,color:C.navy});
  });
  notes(s,"Preview the day. Keep it brisk — this is a signpost slide.");

  // ===================================================== SLIDE 6 — MARKET AT A GLANCE
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Dubai market at a glance","Sources: DLD / Dubai REST weekly reports — verify weekly (figures mid-June 2026).");
  const stats=[["AED 11.3B","transactions last week","coins"],["AED 252B","Q1 2026 (+31% YoY)","chart"],["AED 682.5B","2025 sales (record year)","building"]];
  stats.forEach((st,i)=>{ const w=(CW/3)-0.2; const x=M+i*(CW/3); const yy=1.95;
    card(s,x,yy,w,1.9);
    circleIcon(s,x+0.3,yy+0.5,0.85,I[st[2]].w);
    s.addText(st[0],{x:x+1.3,y:yy+0.35,w:w-1.5,h:0.6,fontFace:F.head,fontSize:23,bold:true,color:C.gold});
    s.addText(st[1],{x:x+1.3,y:yy+1.0,w:w-1.5,h:0.6,fontFace:F.body,fontSize:12.5,color:C.ink,valign:"top"});
  });
  s.addText("Recent weekly transaction value (AED bn)",{x:M,y:4.1,w:CW,h:0.35,fontFace:F.body,fontSize:13,bold:true,color:C.navy});
  s.addChart(pptx.ChartType.bar, [{name:"AED bn", labels:["wk-4","wk-3","wk-2","wk-1","last wk"], values:[10.0,14.7,15.2,21.0,11.3]}],
    { x:M, y:4.5, w:CW, h:2.4, barDir:"col", chartColors:[C.gold], showLegend:false, showTitle:false,
      showValue:true, dataLabelColor:C.ink, dataLabelFontFace:F.body, dataLabelFontSize:10,
      catAxisLabelColor:C.slate, catAxisLabelFontFace:F.body, catAxisLabelFontSize:11,
      valAxisHidden:true, catGridLine:{style:"none"}, valGridLine:{style:"none"}, barGapWidthPct:60 });
  notes(s,"Anchor them in scale. Weekly transaction values swing roughly AED 10B–21B; Q1 2026 hit AED 252B (+31% YoY); 2025 was a record AED 682.5B in sales. These figures move — re-check the weekly DLD report before quoting. The point: this is a deep, liquid market with constant deal flow.");

  // ===================================================== SLIDE 7 — WHY OFF-PLAN
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Why off-plan?","How buying before completion differs from ready / secondary.");
  const why=[
    ["coins","Lower entry","Smaller upfront outlay — secure a unit with a booking deposit, not the full price."],
    ["scroll","Payment plans","Pay in stages through construction, often with post-handover tails (1–5 yrs)."],
    ["chart","Appreciation during build","Value can rise between launch and handover as the project completes."],
    ["bolt","Developer incentives","Waived fees, DLD-fee deals, furnishing packages and launch pricing."],
  ];
  why.forEach((w0,i)=>{ const col=i%2; const row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.95+row*1.85;
    card(s,x,yy,w,1.65);
    circleIcon(s,x+0.28,yy+0.35,0.85,I[w0[0]].w);
    s.addText(w0[1],{x:x+1.35,y:yy+0.25,w:w-1.6,h:0.45,fontFace:F.head,fontSize:16,bold:true,color:C.navy});
    s.addText(w0[2],{x:x+1.35,y:yy+0.72,w:w-1.6,h:0.8,fontFace:F.body,fontSize:12,color:C.ink,valign:"top",lineSpacingMultiple:1.03});
  });
  notes(s,"Frame off-plan as the engine of new-launch sales. The four advantages — entry, payment plans, appreciation, incentives — are also your selling points later in Day 4. Balance: note risks too (construction, market timing) which Day 2 escrow content addresses.");

  // ===================================================== SLIDE 8 — THE PLAYERS
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"The players — who does what","Know the difference; clients will test you on it.");
  const players=[
    ["balance","DLD","Dubai Land Department — the overarching authority that registers and regulates all property and transactions."],
    ["gavel","RERA","Real Estate Regulatory Agency — the regulatory arm of DLD: licenses brokers, sets conduct, oversees escrow."],
    ["grad","DREI","Dubai Real Estate Institute — DLD's training arm; runs the broker certification course."],
  ];
  players.forEach((p,i)=>{ const w=(CW/3)-0.2; const x=M+i*(CW/3); const yy=1.95;
    card(s,x,yy,w,3.0);
    circleIcon(s,x+w/2-0.48,yy+0.35,0.95,I[p[0]].w);
    s.addText(p[1],{x,y:yy+1.45,w,h:0.5,align:"center",fontFace:F.head,fontSize:22,bold:true,color:C.gold});
    s.addText(p[2],{x:x+0.25,y:yy+2.0,w:w-0.5,h:0.9,align:"center",fontFace:F.body,fontSize:11.5,color:C.ink,valign:"top",lineSpacingMultiple:1.04});
  });
  card(s,M,5.25,CW,1.4,C.ice);
  circleIcon(s,M+0.3,5.5,0.85,I.mobile.w);
  s.addText([{text:"Trakheesi",options:{bold:true,color:C.navy}},{text:" — DLD's permit system: every advert carries a Trakheesi permit number.    ",options:{color:C.ink}},
    {text:"Dubai REST / Dubai Brokers",options:{bold:true,color:C.navy}},{text:" — official DLD apps where brokers generate forms & access services.",options:{color:C.ink}}],
    {x:M+1.35,y:5.5,w:CW-1.7,h:0.9,valign:"middle",fontFace:F.body,fontSize:12.5,lineSpacingMultiple:1.05});
  notes(s,"Common confusion: DLD vs RERA. DLD is the parent authority; RERA is its regulatory arm. DREI trains. Trakheesi is the advertising-permit system — no permit, no advert (a hard compliance rule). Dubai REST is the app brokers actually use day to day.");

  // ===================================================== SLIDE 9 — FREEHOLD VS LEASEHOLD
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Freehold vs leasehold","Where foreign buyers can own — and what they own.");
  const fl=[["key","Freehold","FFF7E6",[
      "Full ownership of the unit AND the land, in perpetuity.",
      "Open to all nationalities in designated freehold zones.",
      "Can sell, lease, or pass on freely; qualifies for residency visas.",
      "Most off-plan you'll sell sits in freehold areas."]],
    ["scroll","Leasehold","EEF3FB",[
      "Right to use the property for a long term (commonly up to 99 years).",
      "Land stays with the freeholder; reverts at lease end.",
      "Found in select older / non-freehold districts.",
      "Less common for new off-plan launches."]]];
  fl.forEach((f,i)=>{ const w=(CW-0.4)/2; const x=M+i*(w+0.4); const yy=1.95;
    card(s,x,yy,w,4.4,f[2]);
    circleIcon(s,x+0.3,yy+0.35,0.9,I[f[0]].w);
    s.addText(f[1],{x:x+1.35,y:yy+0.5,w:w-1.6,h:0.6,fontFace:F.head,fontSize:21,bold:true,color:C.navy});
    s.addText(f[3].map(t=>({text:t,options:{bullet:{indent:14},breakLine:true}})),{x:x+0.35,y:yy+1.6,w:w-0.7,h:2.6,fontFace:F.body,fontSize:13,color:C.ink,valign:"top",lineSpacingMultiple:1.12});
  });
  notes(s,"Buyers care most about freehold — full ownership of unit and land, available to all nationalities in designated zones, and the basis for residency visas. Leasehold = long-term use right, land reverts. Almost all new off-plan you sell is freehold.");

  // ===================================================== SLIDE 10 — BECOMING A BROKER (PATH)
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Becoming a legal broker — the path","Six steps. There is no individual/freelance broker licence in Dubai.");
  const path=[
    "Hold a UAE residency visa, sponsored by a licensed brokerage.",
    "Complete the broker training course at DREI (~4 days / 32 hours).",
    "Pass the RERA exam (~100 questions; pass mark ~75% — confirm).",
    "Receive your Broker Card + BRN (Broker Registration Number).",
    "Renew the licence annually via DLD.",
    "Every advert must carry a valid Trakheesi permit number."
  ];
  path.forEach((p,i)=>{ const col=i%2; const row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.95+row*1.45;
    card(s,x,yy,w,1.22,C.cloud);
    circleNum(s,x+0.22,yy+0.27,0.68,i+1);
    s.addText(p,{x:x+1.05,y:yy,w:w-1.25,h:1.22,valign:"middle",fontFace:F.body,fontSize:12.5,color:C.ink,lineSpacingMultiple:1.03});
  });
  notes(s,"The single most important takeaway: you cannot freelance — you must be sponsored by a licensed brokerage (that's us). The next four slides detail steps 2–4. Pass mark is commonly cited 75% but has shifted; confirm at registration.");

  // ===================================================== SLIDE 11 — STEP: SPONSORSHIP
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Step 1 — Residency + brokerage sponsorship");
  card(s,M,1.95,CW,2.0,C.ice);
  circleIcon(s,M+0.35,2.25,1.0,I.id.w);
  s.addText("No freelance / individual broker licence exists in Dubai.",{x:M+1.7,y:2.2,w:CW-2.0,h:0.5,fontFace:F.head,fontSize:18,bold:true,color:C.navy});
  s.addText("You must hold a valid UAE residency visa and be employed/sponsored by a RERA-licensed brokerage. That sponsorship is what makes you eligible to be carded.",{x:M+1.7,y:2.75,w:CW-2.0,h:1.0,fontFace:F.body,fontSize:13.5,color:C.ink,valign:"top",lineSpacingMultiple:1.08});
  const sp=[["building","We sponsor you","As your licensed brokerage, BARE provides the sponsorship and visa pathway."],["check","Then you certify","With sponsorship in place, you move to the DREI course and RERA exam."]];
  sp.forEach((p,i)=>{ const w=(CW-0.4)/2; const x=M+i*(w+0.4); const yy=4.25;
    card(s,x,yy,w,2.0);
    circleIcon(s,x+0.3,yy+0.35,0.8,I[p[0]].w);
    s.addText(p[1],{x:x+1.3,y:yy+0.35,w:w-1.5,h:0.5,fontFace:F.head,fontSize:16,bold:true,color:C.navy});
    s.addText(p[2],{x:x+1.3,y:yy+0.9,w:w-1.5,h:0.9,fontFace:F.body,fontSize:12.5,color:C.ink,valign:"top",lineSpacingMultiple:1.05});
  });
  notes(s,"Reassure new joiners: the brokerage handles sponsorship. This removes the biggest barrier people worry about. Visa + sponsorship first, certification second.");

  // ===================================================== SLIDE 12 — STEP: DREI COURSE
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Step 2 — Broker training at DREI");
  card(s,M,1.95,CW,2.3,C.cloud);
  circleIcon(s,M+0.4,2.45,1.1,I.grad.w);
  s.addText("Certified broker training course",{x:M+1.9,y:2.25,w:CW-2.2,h:0.55,fontFace:F.head,fontSize:20,bold:true,color:C.navy});
  s.addText([
    {text:"~4 days · 32 hours of instruction.",options:{breakLine:true,bullet:{indent:14}}},
    {text:"Delivered in English or Arabic.",options:{breakLine:true,bullet:{indent:14}}},
    {text:"Attendance is mandatory to be eligible to sit the RERA exam.",options:{breakLine:true,bullet:{indent:14}}},
  ],{x:M+1.9,y:2.85,w:CW-2.2,h:1.3,fontFace:F.body,fontSize:13.5,color:C.ink,lineSpacingMultiple:1.12});
  const cost=[["coins","Course fee","~AED 2,400 (typical)"],["scroll","Format","Classroom / instructor-led"],["check","Outcome","Eligibility to sit the exam"]];
  cost.forEach((c,i)=>{ const w=(CW/3)-0.2; const x=M+i*(CW/3); const yy=4.55;
    card(s,x,yy,w,1.8,C.ice);
    circleIcon(s,x+w/2-0.4,yy+0.3,0.8,I[c[0]].w);
    s.addText(c[1],{x,y:yy+1.15,w,h:0.3,align:"center",fontFace:F.body,fontSize:11.5,color:C.slate,bold:true});
    s.addText(c[2],{x,y:yy+1.4,w,h:0.35,align:"center",fontFace:F.head,fontSize:13.5,bold:true,color:C.navy});
  });
  notes(s,"DREI is DLD's training arm. The course is ~32 hours over ~4 days, English or Arabic, attendance mandatory. Fee ~AED 2,400 (confirm current pricing). It's the prerequisite to the RERA exam.");

  // ===================================================== SLIDE 13 — STEP: RERA EXAM
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Step 3 — The RERA exam","Figures shift — confirm current values when you register.");
  const ex=[["scroll","Format","~100 multiple-choice questions"],["check","Pass mark","~75% (cited 70–75%) — confirm"],["coins","Exam fee","~AED 785 (incl. add-on fees)"],["id","Result","Eligible for your Broker Card"]];
  ex.forEach((e,i)=>{ const w=(CW-0.45)/4; const x=M+i*(w+0.15); const yy=1.95;
    card(s,x,yy,w,2.9);
    circleIcon(s,x+w/2-0.45,yy+0.35,0.9,I[e[0]].w);
    s.addText(e[1],{x,y:yy+1.45,w,h:0.3,align:"center",fontFace:F.body,fontSize:11.5,bold:true,color:C.slate});
    s.addText(e[2],{x:x+0.12,y:yy+1.75,w:w-0.24,h:0.9,align:"center",fontFace:F.head,fontSize:14,bold:true,color:C.navy,valign:"top"});
  });
  card(s,M,5.2,CW,1.45,"FFF7E6");
  circleIcon(s,M+0.3,5.45,0.85,I.bolt.g===null?I.bolt.w:I.bolt.w);
  s.addText("Study tip: the exam leans on the regulatory content in this very programme — forms, escrow, fees, and the authorities. Know Days 1–3 cold and you're most of the way there.",{x:M+1.35,y:5.4,w:CW-1.7,h:1.0,valign:"middle",fontFace:F.body,fontSize:13,color:C.ink,lineSpacingMultiple:1.06});
  notes(s,"Exam ~100 MCQs, pass mark commonly 75% (some sources 70%), fee ~AED 785 all-in. These move — verify at registration. Encourage them: this training maps directly onto the exam syllabus.");

  // ===================================================== SLIDE 14 — STEP: CARD + BRN
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Step 4 — Broker Card, BRN & staying licensed");
  const br=[["id","Broker Card","Your official licence to operate as an agent in Dubai."],
    ["scroll","BRN","Broker Registration Number — your unique ID on every deal & form."],
    ["mobile","Trakheesi on every ad","No advert goes live without a valid Trakheesi permit number."],
    ["check","Renew annually","The licence is renewed each year via DLD to stay active."]];
  br.forEach((b,i)=>{ const col=i%2; const row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.95+row*1.85;
    card(s,x,yy,w,1.65);
    circleIcon(s,x+0.28,yy+0.35,0.85,I[b[0]].w);
    s.addText(b[1],{x:x+1.35,y:yy+0.28,w:w-1.6,h:0.45,fontFace:F.head,fontSize:16,bold:true,color:C.navy});
    s.addText(b[2],{x:x+1.35,y:yy+0.75,w:w-1.6,h:0.8,fontFace:F.body,fontSize:12,color:C.ink,valign:"top",lineSpacingMultiple:1.03});
  });
  notes(s,"Once you pass, you're issued a Broker Card and a BRN — quote the BRN on forms and adverts. Trakheesi permit on every single advertisement is non-negotiable. Renew annually. First-year all-in cost is often cited ~AED 10,000–13,000 depending on setup (confirm).");

  // ===================================================== SLIDE 15 — CORE CONCEPTS
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Core concepts — quick primer","We go deep on these in Days 2–3; lock the meaning now.");
  const cc=[["key","Freehold","Full ownership of unit + land, in designated zones."],
    ["building","Off-plan","A property bought before/under construction, off the plans."],
    ["scroll","Ready / secondary","A completed, already-titled property resold on the market."],
    ["shield","Escrow","A ring-fenced bank account that protects buyer payments on off-plan."],
    ["id","Oqood","The interim off-plan register that converts to a Title Deed at handover."],
    ["balance","Title Deed","The final proof of ownership, issued by DLD."]];
  cc.forEach((c,i)=>{ const col=i%3; const row=Math.floor(i/3); const w=(CW-0.4)/3; const x=M+col*(w+0.2); const yy=1.95+row*2.2;
    card(s,x,yy,w,2.0,C.cloud);
    circleIcon(s,x+0.25,yy+0.3,0.8,I[c[0]].w);
    s.addText(c[1],{x:x+1.2,y:yy+0.45,w:w-1.4,h:0.5,fontFace:F.head,fontSize:15,bold:true,color:C.navy});
    s.addText(c[2],{x:x+0.28,y:yy+1.2,w:w-0.56,h:0.7,fontFace:F.body,fontSize:11.5,color:C.ink,valign:"top",lineSpacingMultiple:1.04});
  });
  notes(s,"A vocabulary checkpoint so nobody is lost later. Don't over-explain — these each get a full slide in Day 2. Just make sure the words land now.");

  // ===================================================== SLIDE 16 — GLOSSARY 1
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Glossary 1 — authorities & process");
  const g1=[["DLD","Dubai Land Department"],["RERA","Real Estate Regulatory Agency"],["DREI","Dubai Real Estate Institute"],
    ["BRN","Broker Registration Number"],["Trakheesi","DLD advertising-permit system"],["Ejari","Tenancy contract registration"],
    ["NOC","No Objection Certificate"],["SPA","Sale & Purchase Agreement"],["MOU","Memorandum of Understanding (Form F)"],["Oqood","Interim off-plan property register"]];
  g1.forEach((g,i)=>{ const col=i%2; const row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.9+row*0.98;
    card(s,x,yy,w,0.82,i%2?C.ice:C.cloud);
    s.addText(g[0],{x:x+0.2,y:yy,w:2.1,h:0.82,valign:"middle",fontFace:F.head,fontSize:15,bold:true,color:C.gold});
    s.addText(g[1],{x:x+2.3,y:yy,w:w-2.5,h:0.82,valign:"middle",fontFace:F.body,fontSize:12.5,color:C.ink});
  });
  notes(s,"Reference slide — don't read every line. Point out the ones people mix up: MOU = Form F; Oqood = the off-plan register; Ejari is for rentals. Full definitions live in the speaker notes.");

  // ===================================================== SLIDE 17 — GLOSSARY 2
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Glossary 2 — finance & transaction");
  const g2=[["LTV","Loan-to-Value ratio"],["DBR","Debt Burden Ratio (max ~50%)"],["EIBOR","Emirates Interbank Offered Rate"],
    ["ROI","Return on Investment"],["DEWA","Dubai Electricity & Water Authority"],["DNFBP","Designated Non-Financial Business/Profession"],
    ["KYC","Know Your Customer"],["AML","Anti-Money Laundering"],["CFT","Combating the Financing of Terrorism"],["FIU","Financial Intelligence Unit"]];
  g2.forEach((g,i)=>{ const col=i%2; const row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.9+row*0.98;
    card(s,x,yy,w,0.82,i%2?C.ice:C.cloud);
    s.addText(g[0],{x:x+0.2,y:yy,w:2.1,h:0.82,valign:"middle",fontFace:F.head,fontSize:15,bold:true,color:C.gold});
    s.addText(g[1],{x:x+2.3,y:yy,w:w-2.5,h:0.82,valign:"middle",fontFace:F.body,fontSize:12.5,color:C.ink});
  });
  notes(s,"These come back in Day 3 (the money) and the AML slide. LTV, DBR, EIBOR drive mortgages; KYC/AML/CFT/FIU/DNFBP are the compliance cluster — preview the next slide.");

  // ===================================================== SLIDE 18 — AML
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"AML — what every agent must know","Anti-Money Laundering. Brokers are a 'DNFBP' with real legal duties.");
  card(s,M,1.9,CW,1.5,"FFF7E6");
  circleIcon(s,M+0.35,2.15,1.0,I.shield.w);
  s.addText("As a broker you are a Designated Non-Financial Business or Profession (DNFBP) with AML/CFT obligations under UAE law.",{x:M+1.75,y:2.05,w:CW-2.1,h:1.2,valign:"middle",fontFace:F.body,fontSize:14,color:C.ink,lineSpacingMultiple:1.08});
  const aml=[["id","KYC","Verify client identity & source of funds."],["coins","Watch cash","Flag high-value & cash-heavy deals."],
    ["mobile","goAML","Register on the goAML portal; appoint a compliance officer."],["gavel","Report","File suspicious-transaction reports to the FIU."]];
  aml.forEach((a,i)=>{ const w=(CW-0.45)/4; const x=M+i*(w+0.15); const yy=3.7;
    card(s,x,yy,w,2.5,C.cloud);
    circleIcon(s,x+w/2-0.42,yy+0.3,0.84,I[a[0]].w);
    s.addText(a[1],{x,y:yy+1.3,w,h:0.4,align:"center",fontFace:F.head,fontSize:15,bold:true,color:C.navy});
    s.addText(a[2],{x:x+0.15,y:yy+1.75,w:w-0.3,h:0.65,align:"center",fontFace:F.body,fontSize:11,color:C.ink,valign:"top",lineSpacingMultiple:1.03});
  });
  s.addText("Non-compliance carries serious penalties. When in doubt, escalate to your compliance officer.",{x:M,y:6.4,w:CW,h:0.4,fontFace:F.body,italic:true,fontSize:12,color:C.slate});
  notes(s,"Keep this serious but simple. Brokers are DNFBPs — legally obliged to do KYC, verify source of funds, monitor cash/high-value deals, register on goAML, and report suspicious transactions to the FIU. Penalties are severe. New agents: never handle a deal that feels off without escalating.");

  // ===================================================== SLIDE 19 — RECAP
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Day 1 — recap");
  const rc=[
    "DLD regulates; RERA licenses & oversees conduct; DREI trains.",
    "No freelance licence — you work under a sponsoring brokerage.",
    "The path: sponsorship → DREI course → RERA exam → Broker Card + BRN → renew yearly.",
    "Every advert needs a Trakheesi permit; brokers use Dubai REST.",
    "You're a DNFBP — KYC, monitor, and report under AML law."
  ];
  rc.forEach((r,i)=>{ const yy=1.95+i*0.95; card(s,M,yy,CW,0.8,i%2?C.ice:C.cloud);
    circleNum(s,M+0.2,yy+0.13,0.55,i+1);
    s.addText(r,{x:M+1.0,y:yy,w:CW-1.2,h:0.8,valign:"middle",fontFace:F.body,fontSize:13.5,color:C.ink});
  });
  notes(s,"Recap the five anchors before the quiz. Ask the room to call them back to you rather than reading them out yourself.");

  // ===================================================== SLIDE 20 — QUIZ QUESTIONS
  s = pptx.addSlide(); bg(s, C.navy);
  s.addText("Day 1 — Quiz",{x:M,y:0.5,w:CW,h:0.8,fontFace:F.head,fontSize:30,bold:true,color:C.gold});
  s.addText("Five quick questions. Answers on the next slide.",{x:M,y:1.25,w:CW,h:0.4,fontFace:F.body,fontSize:14,color:"AEB8CC"});
  const q1=[
    "Which body is the regulatory arm that licenses brokers?  (DREI / RERA / Trakheesi / Ejari)",
    "Can you legally work as an agent as an independent freelancer with no brokerage?",
    "What permit number must appear on every property advertisement?",
    "What does BRN stand for?",
    "What does AML stand for — and name one obligation it places on you?"
  ];
  q1.forEach((q,i)=>{ const yy=1.85+i*1.02;
    s.addShape(pptx.ShapeType.roundRect,{x:M,y:yy,w:CW,h:0.86,rectRadius:0.08,fill:{color:C.navyCard},line:{type:"none"},shadow:sh()});
    circleNum(s,M+0.22,yy+0.13,0.6,i+1);
    s.addText(q,{x:M+1.05,y:yy,w:CW-1.25,h:0.86,valign:"middle",fontFace:F.body,fontSize:13,color:C.white});
  });
  logoTag(s,C.gold);
  notes(s,"Give them 3–4 minutes. Let people discuss in pairs — it cements learning. Then reveal the answer key.");

  // ===================================================== SLIDE 21 — ANSWER KEY
  s = pptx.addSlide(); bg(s, C.white);
  title(s,"Day 1 — Quiz answer key");
  const ans=[
    ["RERA","RERA is the regulatory arm of DLD that licenses brokers."],
    ["No","You must be sponsored/employed by a licensed brokerage — no freelance licence exists."],
    ["Trakheesi permit number","Required on every single advertisement."],
    ["Broker Registration Number","Your unique broker ID, quoted on deals & forms."],
    ["Anti-Money Laundering","e.g. perform KYC / verify source of funds, or report suspicious deals via goAML to the FIU."]
  ];
  ans.forEach((a,i)=>{ const yy=1.9+i*0.98; card(s,M,yy,CW,0.84,C.cloud);
    s.addImage({data:I.check.g,x:M+0.22,y:yy+0.22,w:0.4,h:0.4});
    s.addText([{text:(i+1)+".  ",options:{bold:true,color:C.navy}},{text:a[0],options:{bold:true,color:C.green}},{text:"  —  "+a[1],options:{color:C.ink}}],
      {x:M+0.85,y:yy,w:CW-1.05,h:0.84,valign:"middle",fontFace:F.body,fontSize:12.5,lineSpacingMultiple:1.02});
  });
  notes(s,"Walk through each answer and expand with the rationale. If many missed one, re-teach that point briefly before moving to Day 2.");

  await pptx.writeFile({ fileName: "BARE_OffPlan_Training_Day1.pptx" });
  console.log("WROTE BARE_OffPlan_Training_Day1.pptx — slides:", 21);
})().catch(e=>{ console.error("BUILD ERROR:", e); process.exit(1); });
