// Bridges & Allies — Off-Plan Agent Training · DAY 1 (soft, ~3 hours)
// Opportunity + off-plan basics + commissions & earnings
const pptxgen = require("pptxgenjs");
const React = require("react");
const ReactDOMServer = require("react-dom/server");
const sharp = require("sharp");
const Fa = require("react-icons/fa");

const C = { navy:"0F1F3D", navyCard:"1A2F54", gold:"C9A24B", goldLight:"E4C77E",
  ink:"1E293B", slate:"64748B", cloud:"F4F6FA", ice:"EAF0F8", white:"FFFFFF", green:"2E7D5B" };
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
  coins:"FaCoins", key:"FaKey", passport:"FaPassport", map:"FaMapMarkedAlt", bolt:"FaBolt", scroll:"FaScroll",
  check:"FaCheckCircle", globe:"FaGlobe", shield:"FaShieldAlt", home:"FaHome", handshake:"FaHandshake",
  rocket:"FaRocket", userTie:"FaUserTie", user:"FaUser", percent:"FaPercentage", money:"FaMoneyBillWave",
  target:"FaBullseye", clock:"FaClock", star:"FaStar", bulb:"FaLightbulb", phone:"FaPhoneAlt",
  crown:"FaCrown", coffee:"FaCoffee", wallet:"FaWallet" };

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
    s.addText(t,{x:M,y:0.5,w:CW-1.4,h:0.7,fontFace:F.head,fontSize:27,bold:true,color:C.navy,valign:"middle"});
    if(sub) s.addText(sub,{x:M+0.02,y:1.22,w:CW-1.4,h:0.4,fontFace:F.body,fontSize:13.5,italic:true,color:C.slate});
    logoTag(s,false);
  }
  const card=(s,x,y,w,h,fill)=> s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.1,fill:{color:fill||C.cloud},line:{type:"none"},shadow:sh()});
  function circleIcon(s,x,y,d,ic){ s.addShape(pptx.ShapeType.ellipse,{x,y,w:d,h:d,fill:{color:C.gold},line:{type:"none"},shadow:sh()}); if(ic) s.addImage({data:ic,x:x+d*0.27,y:y+d*0.27,w:d*0.46,h:d*0.46}); }
  function circleNum(s,x,y,d,t){ s.addShape(pptx.ShapeType.ellipse,{x,y,w:d,h:d,fill:{color:C.gold},line:{type:"none"},shadow:sh()}); s.addText(String(t),{x,y,w:d,h:d,align:"center",valign:"middle",fontFace:F.head,fontSize:d>0.75?22:15,bold:true,color:C.navy}); }
  const notes=(s,t)=>s.addNotes(t);
  // proof-card grid (icon + title + desc + gold example)
  function proofGrid(s, items){
    items.forEach((it,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.95+row*2.2;
      card(s,x,yy,w,2.0, col?C.ice:C.cloud);
      circleIcon(s,x+0.3,yy+0.34,0.82,I[it[0]].w);
      s.addText(it[1],{x:x+1.32,y:yy+0.24,w:w-1.55,h:0.42,fontFace:F.head,fontSize:16,bold:true,color:C.navy});
      s.addText(it[2],{x:x+1.32,y:yy+0.66,w:w-1.55,h:0.4,fontFace:F.body,fontSize:11.5,color:C.ink,valign:"top"});
      s.addText([{text:"→  ",options:{color:C.gold,bold:true}},{text:it[3],options:{color:C.slate,italic:true}}],{x:x+1.32,y:yy+1.12,w:w-1.55,h:0.74,fontFace:F.body,fontSize:10.5,valign:"top",lineSpacingMultiple:1.04});
    });
  }

  // ===== S1 TITLE =====
  let s=pptx.addSlide(); bg(s,C.navy);
  s.addShape(pptx.ShapeType.ellipse,{x:10.2,y:-1.7,w:5.2,h:5.2,fill:{color:C.navyCard},line:{type:"none"}});
  s.addShape(pptx.ShapeType.ellipse,{x:11.1,y:4.7,w:3.4,h:3.4,fill:{color:"13284D"},line:{type:"none"}});
  s.addImage({path:"assets/logo_white.png",x:M,y:0.7,w:1.5,h:1.5});
  s.addText("BRIDGES & ALLIES",{x:M,y:2.35,w:9,h:0.5,fontFace:F.head,fontSize:16,bold:true,color:C.gold,charSpacing:4});
  s.addText("Welcome to Dubai\nReal Estate",{x:M,y:2.8,w:11.5,h:1.7,fontFace:F.head,fontSize:46,bold:true,color:C.white,lineSpacingMultiple:0.98});
  s.addText("Day 1 — the opportunity, and how you get paid.",{x:M,y:4.7,w:11.5,h:0.5,fontFace:F.body,fontSize:20,color:C.goldLight});
  s.addText("A 4-day journey · from your first day to your first deal.",{x:M,y:5.25,w:11.5,h:0.4,fontFace:F.body,fontSize:13,color:"AEB8CC"});
  s.addText("Presenter: ______________     ·     Bridges & Allies — Off-Plan Team",{x:M,y:6.6,w:11.5,h:0.4,fontFace:F.body,fontSize:12,color:"8794AD"});
  notes(s,"~3-hour Day 1. Today is the inspiring part — the opportunity, who you serve, the basics of off-plan, and crucially HOW YOU EARN. The heavy rules/contracts/abbreviations come Day 2. Goal: they leave excited and clear on the money.");

  // ===== S2 WELCOME =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"You're in the right place, at the right time");
  const vis=[["grad","No experience needed","We train you from zero. Every expert started where you are today."],
    ["users","We rise together","One team, one standard. Your success is the team's success."],
    ["rocket","Timing is everything","Dubai is one of the world's most active markets. Grow with it."]];
  vis.forEach((v,i)=>{ const w=CW/3-0.25; const x=M+i*(CW/3); const yy=2.05;
    card(s,x,yy,w,3.7); circleIcon(s,x+0.35,yy+0.4,0.95,I[v[0]].w);
    s.addText(v[1],{x:x+0.32,y:yy+1.55,w:w-0.6,h:0.7,fontFace:F.head,fontSize:17,bold:true,color:C.navy});
    s.addText(v[2],{x:x+0.32,y:yy+2.25,w:w-0.6,h:1.2,fontFace:F.body,fontSize:13.5,color:C.ink,valign:"top",lineSpacingMultiple:1.1});
  });
  s.addText("“We build a great team — and we rise together.”",{x:M,y:6.2,w:CW,h:0.5,align:"center",fontFace:F.head,italic:true,fontSize:16,color:C.gold});
  notes(s,"Warm welcome. Reassure career-changers and fresh grads. Lean into team culture and the mentorship promise.");

  // ===== S3 4-DAY JOURNEY =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Your 4-day journey","Today we get inspired — and learn how the money works.");
  const days=[["1","The opportunity & earnings","Why Dubai, the numbers, off-plan basics, and how you get paid."],
    ["2","How it all works","The market, the players, escrow, and the paperwork behind a deal."],
    ["3","The money in detail","Payment plans, mortgages, returns, fees and residency."],
    ["4","Selling & closing","Finding clients, guiding them, and confidently closing."]];
  days.forEach((d,i)=>{ const w=(CW-0.45)/4; const x=M+i*(w+0.15); const yy=2.1;
    card(s,x,yy,w,3.5,i===0?"FFF7E6":C.cloud); circleNum(s,x+w/2-0.45,yy+0.4,0.9,d[0]);
    s.addText("DAY "+d[0],{x,y:yy+1.4,w,h:0.3,align:"center",fontFace:F.body,fontSize:11,bold:true,color:C.gold,charSpacing:2});
    s.addText(d[1],{x:x+0.12,y:yy+1.68,w:w-0.24,h:0.7,align:"center",fontFace:F.head,fontSize:14,bold:true,color:C.navy});
    s.addText(d[2],{x:x+0.18,y:yy+2.45,w:w-0.36,h:0.95,align:"center",fontFace:F.body,fontSize:10.5,color:C.ink,valign:"top",lineSpacingMultiple:1.05});
  });
  s.addText("Each day runs about 3 hours, with a short break. Today is light — no exams.",{x:M,y:6.05,w:CW,h:0.4,align:"center",fontFace:F.body,fontSize:13,italic:true,color:C.slate});
  notes(s,"Signpost the week. Each day ~3 hours. Today is motivational + earnings; rules and contracts come Day 2, finance Day 3, selling Day 4.");

  // ===== S4 DAY 1 DIVIDER =====
  s=pptx.addSlide(); bg(s,C.navy);
  s.addShape(pptx.ShapeType.ellipse,{x:-1.5,y:4.3,w:4.8,h:4.8,fill:{color:C.navyCard},line:{type:"none"}});
  s.addText("DAY 1",{x:M,y:2.4,w:7,h:1.0,fontFace:F.head,fontSize:58,bold:true,color:C.gold});
  s.addText("The opportunity — and your earnings",{x:M,y:3.6,w:11.5,h:0.7,fontFace:F.head,fontSize:25,color:C.white});
  s.addText("Why Dubai · the numbers · off-plan basics · how commissions work",{x:M,y:4.4,w:11.5,h:0.5,fontFace:F.body,fontSize:14,color:"AEB8CC"});
  logoTag(s,true);
  notes(s,"Frame the day: belief + clarity on the money.");

  // ===== S5 AGENDA =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Today at a glance","About 3 hours, with a break in the middle.");
  const ag=[["chart","The opportunity & the market"],["users","Who your clients are"],["coins","The numbers for your clients"],
    ["coffee","Short break"],["building","Off-plan basics & the journey"],["percent","How commissions work"],
    ["target","Your earning potential & goals"],["check","Wrap-up & warm-up quiz"]];
  ag.forEach((a,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.95+row*1.18;
    card(s,x,yy,w,0.95,a[0]==="coffee"?"FFF7E6":C.ice);
    circleIcon(s,x+0.22,yy+0.17,0.6,I[a[0]].w);
    s.addText(a[1],{x:x+1.0,y:yy,w:w-1.2,h:0.95,valign:"middle",fontFace:F.body,fontSize:14.5,bold:true,color:C.navy});
  });
  notes(s,"Quick signpost. Keep energy up; promise the earnings section before the end so they stay engaged.");

  // ===== S6 WHY DUBAI =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Why the world buys in Dubai","Simple reasons — with proof you can repeat to clients.");
  proofGrid(s,[["coins","Tax-free income","No income tax, no annual property tax.","Keep 100% of your rent and resale profit."],
    ["shield","Safe & stable","One of the world's safest, best-regulated cities.","Global events cause short dips, then recovery — the patient win."],
    ["globe","A global hub","A few hours from most of the world.","200+ nationalities; ~8 hours from two-thirds of the planet."],
    ["chart","Strong growth","Decades of rising demand and landmark projects.","New districts keep rising — Marina, Downtown, Dubai Hills."]]);
  notes(s,"Conversational. Expand 'safe & stable': even with regional conflict, markets just CORRECT like stocks — dips are normal and temporary; disciplined 'bulls' buy the dip and win on recovery, while escrow/DLD protect buyers.");

  // ===== S7 SIZE OF OPPORTUNITY =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"The size of the opportunity","One of the busiest property markets on earth.");
  proofGrid(s,[["coins","Billions every week","Dirhams in property change hands week after week.","1,000+ homes find new owners every single week."],
    ["globe","A world of buyers","Buyers come from all over the planet.","Your next client could be from London, Mumbai or Moscow."],
    ["building","Always building","New communities and towers launch constantly.","Fresh launches from Emaar, DAMAC, Sobha & Nakheel."],
    ["chart","A growing city","More people arrive every year — future tenants & buyers.","Past 4 million residents · ~200,000 added a year · 5.8M target by 2040."]]);
  notes(s,"Population is the anchor: Dubai passed 4M in 2025, added ~200,000 in one year (fastest ever), targets 5.8M by 2040 — every new resident is a future tenant/buyer. Keep figures round and trend-based.");

  // ===== S8 WHO YOUR CLIENTS ARE =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Who your clients are","Different people, different reasons — you'll serve them all.");
  proofGrid(s,[["chart","The Investor","Wants returns — rent and resale growth.","“Show me the yield and the upside.”"],
    ["home","The End-User","Wants a home to live in.","“Help me find the right place for my family.”"],
    ["key","The First-Timer","Wants an affordable, easy entry.","“What can I start with on a payment plan?”"],
    ["passport","The Visa Seeker","Wants residency through property.","“Which homes get me the Golden Visa?”"]]);
  notes(s,"Help them picture real clients. Most buyers are a mix of these. Knowing the motive lets you recommend the right property — we practise this on Day 4.");

  // ===== S9 NUMBERS FOR CLIENT =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"The numbers you can create for a client","The promises behind every conversation.");
  proofGrid(s,[["chart","Rental income","Well-chosen homes can earn ~6–8% a year in rent.","On AED 1.5M, that's roughly AED 90k–120k a year."],
    ["bolt","Growth while they wait","Off-plan values can rise between launch and completion.","Buy early, gain as the project is built."],
    ["scroll","Easy payment plans","Pay in comfortable stages during construction.","A small deposit starts it — not the full price."],
    ["passport","A path to residency","A AED 2,000,000 home can open a 10-year Golden Visa.","Property + residency in one move."]]);
  notes(s,"Heart of the client story: income, growth, easy payments, residency. Keep honest — yields ~6–8%, Golden Visa at AED 2M. Detail proven on Day 3.");

  // ===== S10 SIMPLE EXAMPLE =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"A simple example","How one deal can look — illustrative, not a guarantee.");
  card(s,M,2.05,CW*0.62,4.3);
  const rows=[["Off-plan apartment","AED 1,500,000"],["To get started (≈20%)","AED 300,000"],["Possible growth during build*","+ AED 225,000"],["Possible yearly rent at ~7%*","≈ AED 105,000 / yr"]];
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
  notes(s,"Walk it slowly. The point is the SHAPE: small to start, growth during build, income after. Always label illustrative; never promise returns.");

  // ===== S11 WHY OFF-PLAN =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Why off-plan is the easiest place to start","Buying before completion — and why clients love it.");
  const op=[["coins","Small to start","Secure a home with a deposit, not the full price."],["scroll","Pay in stages","Comfortable payment plans through construction."],
    ["chart","Value can grow","Prices can rise between launch and handover."],["bolt","Great incentives","Launch pricing, fee deals, and developer offers."]];
  op.forEach((o,i)=>{ const w=(CW-0.6)/4; const x=M+i*(w+0.2); const yy=2.15;
    card(s,x,yy,w,3.4); circleIcon(s,x+w/2-0.45,yy+0.4,0.9,I[o[0]].w);
    s.addText(o[1],{x:x+0.1,y:yy+1.5,w:w-0.2,h:0.7,align:"center",fontFace:F.head,fontSize:15,bold:true,color:C.navy});
    s.addText(o[2],{x:x+0.15,y:yy+2.2,w:w-0.3,h:1.0,align:"center",fontFace:F.body,fontSize:11.5,color:C.ink,valign:"top",lineSpacingMultiple:1.06});
  });
  notes(s,"Off-plan is the friendliest entry for a new agent and buyer. Mechanics come Day 2 — today, the appeal. (And it pays you more — coming up.)");

  // ===== S12 OFF-PLAN VS READY =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Off-plan vs ready — the simple difference");
  const cmp=[["building","Off-plan","FFF7E6",["Bought before it's built.","Pay in easy stages.","Launch prices & incentives.","The developer pays your commission.","You wait for handover."]],
    ["home","Ready / secondary","EEF3FB",["Already built — move in or rent now.","Paid upfront or with a mortgage.","Resale market pricing.","Buyer pays ~2% commission.","Income starts immediately."]]];
  cmp.forEach((c,i)=>{ const w=(CW-0.4)/2; const x=M+i*(w+0.4); const yy=1.85;
    card(s,x,yy,w,4.5,c[2]); circleIcon(s,x+0.3,yy+0.35,0.9,I[c[0]].w);
    s.addText(c[1],{x:x+1.35,y:yy+0.5,w:w-1.6,h:0.6,fontFace:F.head,fontSize:21,bold:true,color:C.navy});
    s.addText(c[3].map(t=>({text:t,options:{bullet:{indent:14},breakLine:true}})),{x:x+0.4,y:yy+1.55,w:w-0.8,h:2.7,fontFace:F.body,fontSize:13.5,color:C.ink,valign:"top",lineSpacingMultiple:1.2});
  });
  notes(s,"Keep it simple and visual. The headline for our team: off-plan = easy stages, incentives, and the developer (not the client) pays your commission.");

  // ===== S13 OFF-PLAN JOURNEY =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"The off-plan journey — at a glance","Six simple steps from launch to keys.");
  const steps=[["Launch &\nchoose"],["Reserve\n(deposit)"],["Pay in\nstages"],["Construction"],["Handover"],["Keys &\ntitle"]];
  const stepW=CW/6;
  s.addShape(pptx.ShapeType.line,{x:M+stepW/2,y:3.05,w:CW-stepW,h:0,line:{color:"E4C77E",width:2}});
  steps.forEach((st,i)=>{ const cx=M+i*stepW+stepW/2;
    circleNum(s,cx-0.45,2.6,0.9,i+1);
    s.addText(st[0],{x:cx-stepW/2+0.1,y:3.7,w:stepW-0.2,h:0.9,align:"center",fontFace:F.head,fontSize:13,bold:true,color:C.navy,lineSpacingMultiple:0.95});
  });
  card(s,M,5.0,CW,1.5,C.cloud);
  s.addText([{text:"Your client picks a home at launch, pays a small reservation deposit, then pays in comfortable stages while it's built. ",options:{}},
    {text:"At handover they collect the keys and the title deed.",options:{bold:true,color:C.navy}}],{x:M+0.4,y:5.15,w:CW-0.8,h:1.2,valign:"middle",fontFace:F.body,fontSize:14,color:C.ink,lineSpacingMultiple:1.1});
  notes(s,"High-level only — the legal detail (escrow, Oqood, forms) is Day 2. Today they just need the shape of the journey so the rest makes sense.");

  // ===== S14 WHERE CLIENTS CAN BUY =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Where your clients can buy","Foreigners get full ownership in Dubai's 'freehold' areas.");
  card(s,M,1.9,CW,1.25,C.ice);
  circleIcon(s,M+0.3,2.12,0.8,I.key.w);
  s.addText([{text:"Freehold = full ownership",options:{bold:true,color:C.navy}},{text:"  of the home and the land, for any nationality. Most of what you'll sell sits in these popular freehold communities:",options:{color:C.ink}}],{x:M+1.35,y:2.05,w:CW-1.7,h:0.95,valign:"middle",fontFace:F.body,fontSize:13.5,lineSpacingMultiple:1.05});
  const areas=["Dubai Marina","Downtown Dubai","Palm Jumeirah","JVC","Dubai Hills Estate","Business Bay","Dubai Creek Harbour","Emaar South"];
  areas.forEach((a,i)=>{ const col=i%4,row=Math.floor(i/4); const w=(CW-0.9)/4; const x=M+col*(w+0.3); const yy=3.5+row*1.2;
    card(s,x,yy,w,0.95,col%2?C.cloud:"FFF9ED");
    s.addText(a,{x,y:yy,w,h:0.95,align:"center",valign:"middle",fontFace:F.head,fontSize:14,bold:true,color:C.navy});
  });
  s.addText("(The full list of freehold zones — and how ownership is registered — comes on Day 2.)",{x:M,y:6.5,w:CW,h:0.35,align:"center",fontFace:F.body,italic:true,fontSize:11.5,color:C.slate});
  notes(s,"Keep light. Freehold = full ownership for foreigners in designated zones. Name the hot communities; the legal mechanics (title, leasehold, the official zone list) are Day 2.");

  // ===== S15 COMMISSION BASICS =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"How you get paid","Commission — the basics.");
  card(s,M,2.0,CW*0.42,4.2,C.navy);
  s.addText("2%",{x:M,y:2.55,w:CW*0.42,h:1.4,align:"center",fontFace:F.head,fontSize:90,bold:true,color:C.gold});
  s.addText("the typical agency commission on a resale",{x:M+0.4,y:4.05,w:CW*0.42-0.8,h:0.8,align:"center",fontFace:F.body,fontSize:15,color:C.white,valign:"top"});
  s.addText("Example: 2% of AED 1,500,000  =  AED 30,000",{x:M+0.4,y:5.2,w:CW*0.42-0.8,h:0.8,align:"center",fontFace:F.head,fontSize:15,bold:true,color:C.goldLight,valign:"top"});
  const cb=[["wallet","Who pays it","On a resale, the buyer pays the commission (+5% VAT)."],
    ["clock","When you're paid","When the deal completes and ownership transfers."],
    ["handshake","What you take home","You earn your share of it — the split is next."]];
  cb.forEach((c,i)=>{ const x=M+CW*0.42+0.4; const w=CW*0.58-0.4; const yy=2.0+i*1.45;
    card(s,x,yy,w,1.25,i%2?C.ice:C.cloud); circleIcon(s,x+0.25,yy+0.27,0.72,I[c[0]].w);
    s.addText(c[1],{x:x+1.2,y:yy+0.18,w:w-1.4,h:0.45,fontFace:F.head,fontSize:15,bold:true,color:C.navy});
    s.addText(c[2],{x:x+1.2,y:yy+0.6,w:w-1.4,h:0.55,fontFace:F.body,fontSize:12,color:C.ink,valign:"top",lineSpacingMultiple:1.04});
  });
  notes(s,"Standard resale commission is 2% of the price, paid by the buyer, plus 5% VAT, settled at transfer. You earn your split of it. Off-plan is different (and better) — next slide.");

  // ===== S16 OFF-PLAN PAYS MORE =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Off-plan pays you more","On off-plan, the developer pays — your client pays nothing.");
  card(s,M,1.95,CW,1.5,"FFF7E6");
  circleIcon(s,M+0.35,2.2,1.0,I.money.w);
  s.addText([{text:"The developer pays the commission",options:{bold:true,color:C.navy}},{text:" — usually ",options:{color:C.ink}},{text:"3–6%",options:{bold:true,color:C.gold}},{text:" of the price (sometimes more). Your client often pays ",options:{color:C.ink}},{text:"AED 0",options:{bold:true,color:C.green}},{text:".",options:{color:C.ink}}],{x:M+1.75,y:2.1,w:CW-2.1,h:1.2,valign:"middle",fontFace:F.body,fontSize:15,lineSpacingMultiple:1.1});
  const ad=[["heart","Easier to sell","No fee for the buyer to swallow."],["coins","Bigger payday","A higher % on every deal you close."],["bolt","Plus incentives","Bonuses and rewards on hot launches."]];
  // fallback icon
  ad[0][0]="check";
  ad.forEach((a,i)=>{ const w=(CW-0.8)/3; const x=M+i*(w+0.4); const yy=3.75;
    card(s,x,yy,w,1.6); circleIcon(s,x+w/2-0.4,yy+0.3,0.8,I[a[0]].w);
    s.addText(a[1],{x,y:yy+1.05,w,h:0.35,align:"center",fontFace:F.head,fontSize:14.5,bold:true,color:C.navy});
    s.addText(a[2],{x:x+0.1,y:yy+1.42,w:w-0.2,h:0.4,align:"center",fontFace:F.body,fontSize:0.0001+11,color:C.ink});
  });
  card(s,M,5.55,CW,0.95,C.navy);
  s.addText([{text:"Example:  5% of AED 1,500,000  =  ",options:{color:C.white}},{text:"AED 75,000",options:{bold:true,color:C.gold}},{text:"  commission — paid by the developer.",options:{color:C.white}}],{x:M+0.4,y:5.55,w:CW-0.8,h:0.95,valign:"middle",fontFace:F.head,fontSize:16,align:"center"});
  s.addText("*Commission rates vary by developer and project.",{x:M,y:6.6,w:CW,h:0.3,align:"center",fontFace:F.body,italic:true,fontSize:10.5,color:C.slate});
  notes(s,"This is the off-plan team's edge: the developer pays 3–6% (sometimes up to 8%), the buyer pays nothing, so it's easier to sell AND a bigger commission. Rates vary by developer/project — never quote a fixed number to a client.");

  // ===== S17 THE SPLIT =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"How the commission is shared");
  const sp=[["handshake","You & the brokerage","Commonly a 50/50 split — rising toward 70/30 in your favour as you grow.","Your split improves with performance."],
    ["users","Two agents, one deal","When another agent brings the buyer, the commission is usually split 50/50.","Team work still pays — half of more is plenty."]];
  sp.forEach((p,i)=>{ const w=(CW-0.4)/2; const x=M+i*(w+0.4); const yy=2.0;
    card(s,x,yy,w,4.0,i%2?C.ice:C.cloud); circleIcon(s,x+w/2-0.5,yy+0.45,1.0,I[p[0]].w);
    s.addText(p[1],{x,y:yy+1.7,w,h:0.5,align:"center",fontFace:F.head,fontSize:18,bold:true,color:C.navy});
    s.addText(p[2],{x:x+0.4,y:yy+2.3,w:w-0.8,h:1.0,align:"center",fontFace:F.body,fontSize:13,color:C.ink,valign:"top",lineSpacingMultiple:1.08});
    s.addText("→ "+p[3],{x:x+0.4,y:yy+3.35,w:w-0.8,h:0.5,align:"center",fontFace:F.body,italic:true,fontSize:11.5,color:C.gold});
  });
  notes(s,"Splits typically start ~50/50 and improve to 60/40 or 70/30 for strong performers — set in your agreement. Co-broke (two agents) is usually 50/50. Frame growth as something they earn.");

  // ===== S18 EARNING POTENTIAL =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Your earning potential","Illustrative — your effort, your reward.");
  const cols=[["Off-plan deals / year",3.7],["Average to you / deal",4.0],["Your year"]];
  let cx=M; const cw=[3.9,4.0,CW-3.9-4.0];
  // header
  ["Off-plan deals / year","Average to you / deal","Your year"].forEach((h,i)=>{ s.addShape(pptx.ShapeType.rect,{x:cx,y:2.2,w:cw[i],h:0.7,fill:{color:C.navy},line:{type:"none"}}); s.addText(h,{x:cx+0.15,y:2.2,w:cw[i]-0.3,h:0.7,valign:"middle",fontFace:F.head,fontSize:14,bold:true,color:C.white}); cx+=cw[i]; });
  const dat=[["6","≈ AED 35,000","AED 210,000"],["12","≈ AED 35,000","AED 420,000"],["24","≈ AED 35,000","AED 840,000"]];
  dat.forEach((r,ri)=>{ cx=M; const yy=2.9+ri*1.0;
    r.forEach((cell,ci)=>{ s.addShape(pptx.ShapeType.rect,{x:cx,y:yy,w:cw[ci],h:1.0,fill:{color:ri%2?C.ice:C.cloud},line:{type:"none"}});
      s.addText(cell,{x:cx+0.15,y:yy,w:cw[ci]-0.3,h:1.0,valign:"middle",fontFace:ci===2?F.head:F.body,fontSize:ci===2?17:14.5,bold:ci!==0?true:true,color:ci===2?C.green:C.navy}); cx+=cw[ci]; });
  });
  s.addText("That's roughly one to two deals a month. *Illustrative only — not a promise of earnings.",{x:M,y:6.1,w:CW,h:0.4,fontFace:F.body,italic:true,fontSize:12,color:C.slate});
  notes(s,"Make it real but honest. ~AED 35k to you per off-plan deal is a mid example (e.g. 5% of 1.5M = 75k, half to you). Close 1–2 a month and the year adds up fast. Always label illustrative — no guarantees.");

  // ===== S19 SET YOUR TARGET =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Set your target","Pick your number — then work backwards.");
  const tg=[["target","Choose your number","Decide the income you want this year. Write it down."],
    ["percent","Divide by your average","Split it by your commission per deal to get deals needed."],
    ["clock","Break it down","Turn deals into a weekly rhythm of viewings and follow-ups."]];
  tg.forEach((t,i)=>{ const w=CW/3-0.25; const x=M+i*(CW/3); const yy=2.1;
    card(s,x,yy,w,3.0); circleNum(s,x+0.32,yy+0.35,0.85,i+1);
    s.addText(t[1],{x:x+0.3,y:yy+1.4,w:w-0.6,h:0.6,fontFace:F.head,fontSize:16,bold:true,color:C.navy});
    s.addText(t[2],{x:x+0.3,y:yy+2.0,w:w-0.6,h:0.9,fontFace:F.body,fontSize:12.5,color:C.ink,valign:"top",lineSpacingMultiple:1.06});
  });
  card(s,M,5.35,CW,1.05,"FFF7E6");
  s.addText([{text:"Example:  ",options:{bold:true,color:C.navy}},{text:"Want AED 500,000?  ≈ 14 deals a year  →  about one a month  →  consistent daily activity.",options:{color:C.ink}}],{x:M+0.4,y:5.35,w:CW-0.8,h:1.05,valign:"middle",fontFace:F.body,fontSize:14.5});
  notes(s,"Goal-setting makes it concrete. Income → deals → weekly activity. Have each person privately pick a number now. We turn activity into a daily routine on Day 4.");

  // ===== S20 GREAT AGENT =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"What makes a great agent","None of it requires experience — only attitude.");
  proofGrid(s,[["bolt","Hungry & consistent","Show up daily and do the work.","Consistency beats talent, every time."],
    ["bulb","Always learning","Know your projects, areas and numbers.","Knowledge makes clients trust you."],
    ["shield","Honest & client-first","Advise truthfully — never oversell.","Trust today becomes referrals tomorrow."],
    ["phone","Fast to respond","Speed-to-lead wins deals.","The first to reply often wins the client."]]);
  notes(s,"This is the mindset that separates earners from the rest — and it's all within their control. Tie back to 'we rise together': the team lifts the standard.");

  // ===== S21 RECAP =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Day 1 — what to remember");
  const rc=[["You picked the right market.","Safe, tax-free, global, and growing past 4 million people."],
    ["The opportunity is huge.","Billions trade every week — room for everyone."],
    ["You create real value.","Income, growth, easy payments and residency for clients."],
    ["Off-plan pays you best.","The developer pays 3–6% — the client pays nothing."],
    ["Your income is yours to build.","Set a target, stay consistent, and rise with the team."]];
  rc.forEach((r,i)=>{ const yy=1.95+i*0.92; card(s,M,yy,CW,0.78,i%2?C.ice:C.cloud);
    circleNum(s,M+0.22,yy+0.13,0.52,i+1);
    s.addText([{text:r[0]+"  ",options:{bold:true,color:C.navy}},{text:r[1],options:{color:C.ink}}],{x:M+1.05,y:yy,w:CW-1.25,h:0.78,valign:"middle",fontFace:F.body,fontSize:13.5});
  });
  s.addText("Tomorrow: how a deal actually works — step by step.",{x:M,y:6.55,w:CW,h:0.35,align:"center",fontFace:F.body,italic:true,fontSize:13,color:C.gold});
  notes(s,"Five anchors, now including the earnings message. End warm and forward-looking.");

  // ===== S22 QUIZ =====
  s=pptx.addSlide(); bg(s,C.navy);
  s.addText("Quick warm-up",{x:M,y:0.55,w:CW,h:0.8,fontFace:F.head,fontSize:30,bold:true,color:C.gold});
  s.addText("No pressure — just to lock in today's big ideas.",{x:M,y:1.3,w:CW,h:0.4,fontFace:F.body,fontSize:14,color:"AEB8CC"});
  const q=["Name two reasons the world buys property in Dubai.",
    "Roughly what yearly rental return can a well-chosen home earn?",
    "On an off-plan deal, who usually pays the commission — the client or the developer?",
    "What property value can open a 10-year Golden Visa for a client?"];
  q.forEach((qq,i)=>{ const yy=2.1+i*1.12;
    s.addShape(pptx.ShapeType.roundRect,{x:M,y:yy,w:CW,h:0.92,rectRadius:0.09,fill:{color:C.navyCard},line:{type:"none"},shadow:sh()});
    circleNum(s,M+0.22,yy+0.16,0.6,i+1);
    s.addText(qq,{x:M+1.1,y:yy,w:CW-1.3,h:0.92,valign:"middle",fontFace:F.body,fontSize:14.5,color:C.white});
  });
  logoTag(s,true);
  notes(s,"Playful, group answers. Confidence not testing.");

  // ===== S23 ANSWER KEY =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Warm-up — answers");
  const ans=["Any two: tax-free income, safety & stability, a global hub, strong growth.",
    "Roughly 6–8% a year (varies by property and area).",
    "The developer pays — the client usually pays nothing.",
    "AED 2,000,000 in property value."];
  ans.forEach((a,i)=>{ const yy=2.0+i*1.05; card(s,M,yy,CW,0.9,i%2?C.ice:C.cloud);
    s.addImage({data:I.check.g,x:M+0.25,y:yy+0.23,w:0.44,h:0.44});
    s.addText([{text:"Q"+(i+1)+"   ",options:{bold:true,color:C.gold}},{text:a,options:{color:C.ink}}],{x:M+0.95,y:yy,w:CW-1.15,h:0.9,valign:"middle",fontFace:F.body,fontSize:14});
  });
  s.addText("Nice work — that's Day 1. Tomorrow we make it real.",{x:M,y:6.5,w:CW,h:0.4,align:"center",fontFace:F.body,italic:true,fontSize:13,color:C.gold});
  notes(s,"Celebrate — everyone should get these. End on energy and a look ahead to Day 2.");

  await pptx.writeFile({ fileName: "BridgesAllies_OffPlan_Training_Day1.pptx" });
  console.log("WROTE Day 1 (~3h) — slides: 23");
})().catch(e=>{ console.error("BUILD ERROR:", e); process.exit(1); });
