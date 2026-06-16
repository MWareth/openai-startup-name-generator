// Bridges & Allies — Off-Plan Agent Training · DAY 1 (soft / opportunity-led)
// Theme: "Dubai Premium" navy + gold
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
const sh = () => ({ type:"outer", color:"9AA3B2", opacity:0.4, blur:9, offset:3, angle:90 });

async function icon(name, hex, px=240){
  const Ic = Fa[name]; if(!Ic) return null;
  let svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Ic, { size: px }));
  svg = svg.replace(/currentColor/g, "#"+hex);
  const buf = await sharp(Buffer.from(svg)).resize(px,px,{fit:"contain",background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
  return "data:image/png;base64,"+buf.toString("base64");
}
const ICONSET = { building:"FaBuilding", grad:"FaGraduationCap", users:"FaUsers", chart:"FaChartLine",
  coins:"FaCoins", key:"FaKey", passport:"FaPassport", map:"FaMapMarkedAlt", bolt:"FaBolt",
  scroll:"FaScroll", check:"FaCheckCircle", sun:"FaSun", globe:"FaGlobe", shield:"FaShieldAlt",
  heart:"FaRegSmile", home:"FaHome", handshake:"FaHandshake", rocket:"FaRocket" };

(async () => {
  const I = {};
  for(const [k,v] of Object.entries(ICONSET)){ I[k] = { w: await icon(v, C.white), g: await icon(v, C.gold) }; }

  const pptx = new pptxgen();
  pptx.defineLayout({ name:"W", width:13.333, height:7.5 });
  pptx.layout = "W";
  pptx.author = "Bridges and Allies"; pptx.company = "Bridges and Allies";

  const M = 0.7, PW = 13.333, CW = PW - M*2;
  const bg = (s,c)=> s.background = { color:c };
  const logoTag = (s, dark)=> s.addImage({ path: dark ? "assets/logo_white.png" : "assets/logo_circle.png", x:PW-1.16, y:0.26, w:0.62, h:0.62 });
  function title(s, t, sub){
    s.addText(t, { x:M, y:0.5, w:CW-1.4, h:0.7, fontFace:F.head, fontSize:28, bold:true, color:C.navy, align:"left", valign:"middle" });
    if(sub) s.addText(sub, { x:M+0.02, y:1.22, w:CW-1.4, h:0.4, fontFace:F.body, fontSize:14, italic:true, color:C.slate });
    logoTag(s, false);
  }
  const card = (s,x,y,w,h,fill)=> s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.1,fill:{color:fill||C.cloud},line:{type:"none"},shadow:sh()});
  function circleIcon(s,x,y,d,ic){ s.addShape(pptx.ShapeType.ellipse,{x,y,w:d,h:d,fill:{color:C.gold},line:{type:"none"},shadow:sh()}); if(ic) s.addImage({data:ic,x:x+d*0.27,y:y+d*0.27,w:d*0.46,h:d*0.46}); }
  function circleNum(s,x,y,d,t){ s.addShape(pptx.ShapeType.ellipse,{x,y,w:d,h:d,fill:{color:C.gold},line:{type:"none"},shadow:sh()}); s.addText(String(t),{x,y,w:d,h:d,align:"center",valign:"middle",fontFace:F.head,fontSize:d>0.75?22:15,bold:true,color:C.navy}); }
  const notes=(s,t)=>s.addNotes(t);

  // ---- S1 TITLE ----
  let s = pptx.addSlide(); bg(s,C.navy);
  s.addShape(pptx.ShapeType.ellipse,{x:10.2,y:-1.7,w:5.2,h:5.2,fill:{color:C.navyCard},line:{type:"none"}});
  s.addShape(pptx.ShapeType.ellipse,{x:11.1,y:4.7,w:3.4,h:3.4,fill:{color:"13284D"},line:{type:"none"}});
  s.addImage({ path:"assets/logo_white.png", x:M, y:0.7, w:1.5, h:1.5 });
  s.addText("BRIDGES & ALLIES", { x:M, y:2.35, w:9, h:0.5, fontFace:F.head, fontSize:16, bold:true, color:C.gold, charSpacing:4 });
  s.addText("Welcome to Dubai\nReal Estate", { x:M, y:2.8, w:11.5, h:1.7, fontFace:F.head, fontSize:46, bold:true, color:C.white, lineSpacingMultiple:0.98 });
  s.addText("Day 1 — The opportunity in front of you.", { x:M, y:4.7, w:11.5, h:0.5, fontFace:F.body, fontSize:20, color:C.goldLight });
  s.addText("A 4-day journey · from your first day to your first deal.", { x:M, y:5.25, w:11.5, h:0.4, fontFace:F.body, fontSize:13, color:"AEB8CC" });
  s.addText("Presenter: ______________     ·     Bridges & Allies — Off-Plan Team", { x:M, y:6.6, w:11.5, h:0.4, fontFace:F.body, fontSize:12, color:"8794AD" });
  notes(s,"Open warm and high-energy. Today is NOT about rules or paperwork — it's about the opportunity: why Dubai, how big the market is, and the kind of numbers you can create for your clients (and yourself). The technical detail starts tomorrow. Goal of Day 1: they leave excited and proud to be here.");

  // ---- S2 WELCOME & VISION ----
  s = pptx.addSlide(); bg(s,C.white);
  title(s,"You're in the right place, at the right time");
  const vis=[["grad","No experience needed","We train you from zero. Every expert started exactly where you are today."],
    ["users","We rise together","One team, one standard. Your success is the team's success — we win together."],
    ["rocket","Timing is everything","Dubai is one of the world's most active markets. Learn now, and grow with it."]];
  vis.forEach((v,i)=>{ const w=CW/3-0.25; const x=M+i*(CW/3); const yy=2.05;
    card(s,x,yy,w,3.7);
    circleIcon(s,x+0.35,yy+0.4,0.95,I[v[0]].w);
    s.addText(v[1],{x:x+0.32,y:yy+1.55,w:w-0.6,h:0.7,fontFace:F.head,fontSize:17,bold:true,color:C.navy});
    s.addText(v[2],{x:x+0.32,y:yy+2.25,w:w-0.6,h:1.2,fontFace:F.body,fontSize:13.5,color:C.ink,valign:"top",lineSpacingMultiple:1.1});
  });
  s.addText("“We build a great team — and we rise together.”",{x:M,y:6.2,w:CW,h:0.5,align:"center",fontFace:F.head,italic:true,fontSize:16,color:C.gold});
  notes(s,"Reassure the room — especially career-changers and fresh grads. No background required. Lean into the team culture and the mentorship promise. Keep it personal and warm.");

  // ---- S3 THE 4-DAY JOURNEY ----
  s = pptx.addSlide(); bg(s,C.white);
  title(s,"Your 4-day journey","Today we get inspired. Then we get practical.");
  const days=[["1","The opportunity","Why Dubai, the numbers, and what they mean for your clients.","gold"],
    ["2","How it all works","The market, the players, and the simple paperwork behind a deal."],
    ["3","The money","Payment plans, returns, residency, and how clients fund a purchase."],
    ["4","Selling & closing","Finding clients, guiding them, and confidently closing."]];
  days.forEach((d,i)=>{ const w=(CW-0.45)/4; const x=M+i*(w+0.15); const yy=2.1;
    card(s,x,yy,w,3.5, i===0?"FFF7E6":C.cloud);
    circleNum(s,x+w/2-0.45,yy+0.4,0.9,d[0]);
    s.addText("DAY "+d[0],{x,y:yy+1.4,w,h:0.3,align:"center",fontFace:F.body,fontSize:11,bold:true,color:C.gold,charSpacing:2});
    s.addText(d[1],{x:x+0.15,y:yy+1.68,w:w-0.3,h:0.65,align:"center",fontFace:F.head,fontSize:15,bold:true,color:C.navy});
    s.addText(d[2],{x:x+0.2,y:yy+2.35,w:w-0.4,h:1.0,align:"center",fontFace:F.body,fontSize:11,color:C.ink,valign:"top",lineSpacingMultiple:1.06});
  });
  s.addText("Today (Day 1) is the inspiring part — no jargon, no exams. Just the opportunity.",{x:M,y:6.05,w:CW,h:0.4,align:"center",fontFace:F.body,fontSize:13,italic:true,color:C.slate});
  notes(s,"Signpost the week. Stress that today is light and motivational; the rules, contracts and finance come on Days 2–3, and selling on Day 4. This lowers anxiety for nervous beginners.");

  // ---- S4 DAY 1 DIVIDER ----
  s = pptx.addSlide(); bg(s,C.navy);
  s.addShape(pptx.ShapeType.ellipse,{x:-1.5,y:4.3,w:4.8,h:4.8,fill:{color:C.navyCard},line:{type:"none"}});
  s.addText("DAY 1",{x:M,y:2.45,w:7,h:1.0,fontFace:F.head,fontSize:60,bold:true,color:C.gold});
  s.addText("The opportunity",{x:M,y:3.65,w:11,h:0.7,fontFace:F.head,fontSize:28,color:C.white});
  s.addText("Why Dubai · the numbers · what they mean for your clients",{x:M,y:4.45,w:11,h:0.5,fontFace:F.body,fontSize:15,color:"AEB8CC"});
  logoTag(s,true);
  notes(s,"Set the frame: today is about belief and opportunity. By the end they should feel 'this is real, and I can do this.'");

  // ---- S5 WHY DUBAI ----
  s = pptx.addSlide(); bg(s,C.white);
  title(s,"Why the world buys in Dubai","Simple reasons your clients already love.");
  const why=[["coins","Tax-free income","No personal income tax and no annual property tax on what they earn."],
    ["shield","Safe & stable","One of the world's safest cities, with a trusted, regulated market."],
    ["globe","A global hub","A few hours from most of the world — business, lifestyle, and travel."],
    ["chart","Strong growth","Years of rising demand, world-class developments, and new communities."]];
  why.forEach((w0,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=2.05+row*1.95;
    card(s,x,yy,w,1.7,col?C.ice:C.cloud);
    circleIcon(s,x+0.3,yy+0.4,0.9,I[w0[0]].w);
    s.addText(w0[1],{x:x+1.4,y:yy+0.32,w:w-1.65,h:0.5,fontFace:F.head,fontSize:17,bold:true,color:C.navy});
    s.addText(w0[2],{x:x+1.4,y:yy+0.85,w:w-1.65,h:0.75,fontFace:F.body,fontSize:12.5,color:C.ink,valign:"top",lineSpacingMultiple:1.05});
  });
  notes(s,"Keep this conversational. These are the everyday reasons buyers from around the world choose Dubai — tax-free returns, safety, connectivity, and momentum. You'll repeat these to clients constantly.");

  // ---- S6 THE MARKET IN NUMBERS ----
  s = pptx.addSlide(); bg(s,C.white);
  title(s,"The size of the opportunity","How much property changes hands in Dubai (verify weekly).");
  const stats=[["AED 11.3B","in a single week","coins"],["AED 252B","in just 3 months (Q1 2026)","chart"],["AED 682.5B","in 2025 — a record year","building"]];
  stats.forEach((st,i)=>{ const w=CW/3-0.2; const x=M+i*(CW/3); const yy=2.0;
    card(s,x,yy,w,1.9);
    circleIcon(s,x+0.3,yy+0.52,0.85,I[st[2]].w);
    s.addText(st[0],{x:x+1.3,y:yy+0.4,w:w-1.5,h:0.55,fontFace:F.head,fontSize:22,bold:true,color:C.gold});
    s.addText(st[1],{x:x+1.3,y:yy+1.0,w:w-1.5,h:0.6,fontFace:F.body,fontSize:12,color:C.ink,valign:"top"});
  });
  s.addText("Weekly sales (AED billions)",{x:M,y:4.15,w:CW,h:0.35,fontFace:F.body,fontSize:13,bold:true,color:C.navy});
  s.addChart(pptx.ChartType.bar, [{name:"AED bn", labels:["wk-4","wk-3","wk-2","wk-1","this wk"], values:[10.0,14.7,15.2,21.0,11.3]}],
    { x:M, y:4.5, w:CW, h:2.35, barDir:"col", chartColors:[C.gold], showLegend:false, showTitle:false, showValue:true,
      dataLabelColor:C.ink, dataLabelFontFace:F.body, dataLabelFontSize:10, catAxisLabelColor:C.slate,
      catAxisLabelFontFace:F.body, catAxisLabelFontSize:11, valAxisHidden:true, catGridLine:{style:"none"}, valGridLine:{style:"none"}, barGapWidthPct:55 });
  notes(s,"Don't drown them in stats — just convey scale. Billions change hands every week; there is more than enough business for everyone. These figures move week to week, so re-check the latest before presenting.");

  // ---- S7 WHAT IT MEANS FOR YOUR CLIENT ----
  s = pptx.addSlide(); bg(s,C.white);
  title(s,"The numbers you can create for a client","The promises behind every conversation.");
  const cli=[["chart","Rental income","Well-chosen homes can earn roughly 6–8% a year in rent."],
    ["bolt","Growth while they wait","Off-plan values can rise between launch and completion."],
    ["scroll","Easy payment plans","Pay in comfortable stages during construction — not all at once."],
    ["passport","A path to residency","A AED 2,000,000 property can open a 10-year Golden Visa."]];
  cli.forEach((c,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=2.05+row*1.95;
    card(s,x,yy,w,1.7,"FFF9ED");
    circleIcon(s,x+0.3,yy+0.4,0.9,I[c[0]].w);
    s.addText(c[1],{x:x+1.4,y:yy+0.32,w:w-1.65,h:0.5,fontFace:F.head,fontSize:17,bold:true,color:C.navy});
    s.addText(c[2],{x:x+1.4,y:yy+0.85,w:w-1.65,h:0.75,fontFace:F.body,fontSize:12.5,color:C.ink,valign:"top",lineSpacingMultiple:1.05});
  });
  s.addText("These are the four reasons clients say yes. We'll prove each one on Day 3.",{x:M,y:6.1,w:CW,h:0.4,align:"center",fontFace:F.body,fontSize:12.5,italic:true,color:C.slate});
  notes(s,"This is the heart of Day 1. Every client buys for some mix of: income, growth, easy payments, and residency. Keep figures soft and honest — yields ~6–8%, Golden Visa at AED 2M. We back these with detail on Day 3; today it's about the story.");

  // ---- S8 A SIMPLE EXAMPLE ----
  s = pptx.addSlide(); bg(s,C.white);
  title(s,"A simple example","How one deal can look — illustrative, not a guarantee.");
  card(s,M,2.05,CW*0.62,4.3);
  const rows=[["Off-plan apartment","AED 1,500,000"],["To get started (≈20%)","AED 300,000"],
    ["Possible growth during build*","+ AED 225,000"],["Possible yearly rent at ~7%*","≈ AED 105,000 / yr"]];
  rows.forEach((r,i)=>{ const yy=2.4+i*0.92;
    s.addText(r[0],{x:M+0.35,y:yy,w:CW*0.62-2.7,h:0.7,valign:"middle",fontFace:F.body,fontSize:14,color:C.ink});
    s.addText(r[1],{x:M+CW*0.62-2.5,y:yy,w:2.2,h:0.7,valign:"middle",align:"right",fontFace:F.head,fontSize:15,bold:true,color:i>=2?C.green:C.navy});
    if(i<3) s.addShape(pptx.ShapeType.line,{x:M+0.35,y:yy+0.82,w:CW*0.62-0.7,h:0,line:{color:"E2E8F0",width:1}});
  });
  card(s,M+CW*0.62+0.3,2.05,CW*0.38-0.3,4.3,C.navy);
  circleIcon(s,M+CW*0.62+0.6,2.4,0.9,I.handshake.w);
  s.addText("This is the story you'll tell.",{x:M+CW*0.62+0.55,y:3.5,w:CW*0.38-0.9,h:0.9,fontFace:F.head,fontSize:18,bold:true,color:C.white});
  s.addText("A small start, growth while it's built, and income after handover.",{x:M+CW*0.62+0.55,y:4.45,w:CW*0.38-0.9,h:1.2,fontFace:F.body,fontSize:13,color:"C7D0E0",valign:"top",lineSpacingMultiple:1.1});
  s.addText("*Illustrative figures only — actual results vary and are never guaranteed.",{x:M,y:6.6,w:CW,h:0.35,fontFace:F.body,italic:true,fontSize:11,color:C.slate});
  notes(s,"Walk through it slowly and warmly. The point isn't the exact numbers — it's the SHAPE of the deal: small to start, growth during construction, income after. Always label it illustrative; never promise returns. This builds their confidence to have the conversation.");

  // ---- S9 WHAT'S IN IT FOR YOU ----
  s = pptx.addSlide(); bg(s,C.white);
  title(s,"And what's in it for you","Your effort, your reward.");
  const you=[["coins","Uncapped earning","Agencies earn about 2% — that's AED 30,000 on a 1.5M sale. No ceiling."],
    ["grad","We train you","From your first day to your first deal — step by step, with support."],
    ["rocket","A real career, fast","Build a name, a network, and a future in a market that's only growing."]];
  you.forEach((y0,i)=>{ const w=CW/3-0.25; const x=M+i*(CW/3); const yy=2.1;
    card(s,x,yy,w,3.6);
    circleIcon(s,x+0.35,yy+0.4,0.95,I[y0[0]].w);
    s.addText(y0[1],{x:x+0.32,y:yy+1.5,w:w-0.6,h:0.7,fontFace:F.head,fontSize:17,bold:true,color:C.navy});
    s.addText(y0[2],{x:x+0.32,y:yy+2.2,w:w-0.6,h:1.2,fontFace:F.body,fontSize:13,color:C.ink,valign:"top",lineSpacingMultiple:1.08});
  });
  s.addText("Earnings depend on your results — but the opportunity is real, and it's yours to take.",{x:M,y:6.15,w:CW,h:0.4,align:"center",fontFace:F.body,fontSize:12.5,italic:true,color:C.slate});
  notes(s,"Motivate honestly. Commission is uncapped (~2% agency side; the agent's share depends on the plan). No income guarantees — but with training and effort the ceiling is high. Tie it back to 'we rise together.'");

  // ---- S10 WHY OFF-PLAN (SIMPLE) ----
  s = pptx.addSlide(); bg(s,C.white);
  title(s,"Why off-plan is the easiest place to start","Buying before completion — and why clients love it.");
  const op=[["coins","Small to start","Secure a home with a deposit, not the full price."],
    ["scroll","Pay in stages","Comfortable payment plans through construction."],
    ["chart","Value can grow","Prices can rise between launch and handover."],
    ["bolt","Great incentives","Launch pricing, fee deals, and developer offers."]];
  op.forEach((o,i)=>{ const w=(CW-0.6)/4; const x=M+i*(w+0.2); const yy=2.15;
    card(s,x,yy,w,3.4);
    circleIcon(s,x+w/2-0.45,yy+0.4,0.9,I[o[0]].w);
    s.addText(o[1],{x:x+0.1,y:yy+1.5,w:w-0.2,h:0.7,align:"center",fontFace:F.head,fontSize:15,bold:true,color:C.navy});
    s.addText(o[2],{x:x+0.15,y:yy+2.2,w:w-0.3,h:1.0,align:"center",fontFace:F.body,fontSize:11.5,color:C.ink,valign:"top",lineSpacingMultiple:1.06});
  });
  notes(s,"Off-plan is the friendliest entry point for a new agent and a new buyer: low to start, staged payments, upside during build, and strong launch incentives. We go deep on the mechanics on Day 2 — today, just the appeal.");

  // ---- S11 RECAP ----
  s = pptx.addSlide(); bg(s,C.white);
  title(s,"Day 1 — what to remember");
  const rc=[["You picked the right market.","Dubai is safe, tax-free, global, and growing."],
    ["The opportunity is huge.","Billions change hands every single week."],
    ["You create real value.","Income, growth, easy payments, and residency for clients."],
    ["And it pays you well.","Uncapped earning — with training and a team behind you."]];
  rc.forEach((r,i)=>{ const yy=2.05+i*1.05; card(s,M,yy,CW,0.9,i%2?C.ice:C.cloud);
    circleNum(s,M+0.25,yy+0.18,0.55,i+1);
    s.addText([{text:r[0]+"  ",options:{bold:true,color:C.navy}},{text:r[1],options:{color:C.ink}}],{x:M+1.1,y:yy,w:CW-1.3,h:0.9,valign:"middle",fontFace:F.body,fontSize:14});
  });
  s.addText("Tomorrow: how a deal actually works — the simple way.",{x:M,y:6.5,w:CW,h:0.4,align:"center",fontFace:F.body,italic:true,fontSize:13,color:C.gold});
  notes(s,"Close warm. Four feelings to leave with: right market, big opportunity, you create value, and it rewards you. Preview Day 2 lightly so they're curious, not anxious.");

  // ---- S12 LIGHT QUIZ ----
  s = pptx.addSlide(); bg(s,C.navy);
  s.addText("Quick warm-up",{x:M,y:0.55,w:CW,h:0.8,fontFace:F.head,fontSize:30,bold:true,color:C.gold});
  s.addText("No pressure — just to lock in today's big ideas.",{x:M,y:1.3,w:CW,h:0.4,fontFace:F.body,fontSize:14,color:"AEB8CC"});
  const q=["Name two reasons the world buys property in Dubai.",
    "Roughly what yearly rental return can a well-chosen home earn?",
    "What property value can open a 10-year Golden Visa for a client?"];
  q.forEach((qq,i)=>{ const yy=2.2+i*1.25;
    s.addShape(pptx.ShapeType.roundRect,{x:M,y:yy,w:CW,h:1.0,rectRadius:0.09,fill:{color:C.navyCard},line:{type:"none"},shadow:sh()});
    circleNum(s,M+0.25,yy+0.2,0.6,i+1);
    s.addText(qq,{x:M+1.1,y:yy,w:CW-1.3,h:1.0,valign:"middle",fontFace:F.body,fontSize:15,color:C.white});
  });
  logoTag(s,true);
  notes(s,"Keep it playful. Let people call out answers together. The goal is confidence, not testing.");

  // ---- S13 ANSWER KEY ----
  s = pptx.addSlide(); bg(s,C.white);
  title(s,"Warm-up — answers");
  const ans=[["Any two: tax-free income, safety & stability, a global hub, strong growth.",],
    ["Roughly 6–8% a year (varies by property and area).",],
    ["AED 2,000,000 in property value.",]];
  ans.forEach((a,i)=>{ const yy=2.15+i*1.2; card(s,M,yy,CW,1.0,C.cloud);
    s.addImage({data:I.check.g,x:M+0.25,y:yy+0.28,w:0.44,h:0.44});
    s.addText([{text:"Q"+(i+1)+"   ",options:{bold:true,color:C.gold}},{text:a[0],options:{color:C.ink}}],{x:M+0.95,y:yy,w:CW-1.15,h:1.0,valign:"middle",fontFace:F.body,fontSize:14});
  });
  s.addText("Nice work — that's Day 1. Tomorrow we make it real.",{x:M,y:6.4,w:CW,h:0.4,align:"center",fontFace:F.body,italic:true,fontSize:13,color:C.gold});
  notes(s,"Celebrate. Everyone should get these — that's the point. End on energy and a look ahead to Day 2.");

  await pptx.writeFile({ fileName: "BridgesAllies_OffPlan_Training_Day1.pptx" });
  console.log("WROTE Day 1 (soft) — slides: 13");
})().catch(e=>{ console.error("BUILD ERROR:", e); process.exit(1); });
