// Bridges & Allies — Off-Plan Agent Training · DAY 2 (~3 hours)
// How it all works: players, tools (Reelly + WhatsApp groups), the deal process,
// escrow, Oqood & Title Deed, the RERA forms, AML.
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
  let svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Ic,{size:px}));
  svg = svg.replace(/currentColor/g,"#"+hex);
  const buf = await sharp(Buffer.from(svg)).resize(px,px,{fit:"contain",background:{r:0,g:0,b:0,alpha:0}}).png().toBuffer();
  return "data:image/png;base64,"+buf.toString("base64");
}
const ICONSET = { balance:"FaBalanceScale", gavel:"FaGavel", grad:"FaGraduationCap", id:"FaIdCard",
  mobile:"FaMobileAlt", whatsapp:"FaWhatsapp", search:"FaSearch", database:"FaDatabase", chart:"FaChartLine",
  building:"FaBuilding", home:"FaHome", key:"FaKey", scroll:"FaScroll", contract:"FaFileContract",
  signature:"FaFileSignature", lock:"FaLock", bank:"FaUniversity", exchange:"FaExchangeAlt",
  certificate:"FaCertificate", clipboard:"FaClipboardList", check:"FaCheckCircle", shield:"FaShieldAlt",
  users:"FaUsers", bell:"FaBell", handshake:"FaHandshake", coins:"FaCoins", link:"FaLink",
  stamp:"FaStamp", phone:"FaPhoneAlt", coffee:"FaCoffee" };

(async () => {
  const I = {};
  for(const [k,v] of Object.entries(ICONSET)){ I[k] = { w: await icon(v,C.white), g: await icon(v,C.gold) }; }

  const pptx = new pptxgen();
  pptx.defineLayout({ name:"W", width:13.333, height:7.5 });
  pptx.layout = "W";
  pptx.author = "Bridges and Allies"; pptx.company = "Bridges and Allies";

  const M=0.7, PW=13.333, CW=PW-M*2;
  const bg=(s,c)=> s.background={color:c};
  const logoTag=(s,dark)=> s.addImage({path: dark?"assets/logo_white.png":"assets/logo_circle.png", x:PW-1.16,y:0.26,w:0.62,h:0.62});
  function title(s,t,sub){ s.addText(t,{x:M,y:0.5,w:CW-1.4,h:0.7,fontFace:F.head,fontSize:27,bold:true,color:C.navy,valign:"middle"});
    if(sub) s.addText(sub,{x:M+0.02,y:1.22,w:CW-1.4,h:0.4,fontFace:F.body,fontSize:13.5,italic:true,color:C.slate}); logoTag(s,false); }
  const card=(s,x,y,w,h,fill)=> s.addShape(pptx.ShapeType.roundRect,{x,y,w,h,rectRadius:0.1,fill:{color:fill||C.cloud},line:{type:"none"},shadow:sh()});
  function circleIcon(s,x,y,d,ic){ s.addShape(pptx.ShapeType.ellipse,{x,y,w:d,h:d,fill:{color:C.gold},line:{type:"none"},shadow:sh()}); if(ic) s.addImage({data:ic,x:x+d*0.27,y:y+d*0.27,w:d*0.46,h:d*0.46}); }
  function circleNum(s,x,y,d,t){ s.addShape(pptx.ShapeType.ellipse,{x,y,w:d,h:d,fill:{color:C.gold},line:{type:"none"},shadow:sh()}); s.addText(String(t),{x,y,w:d,h:d,align:"center",valign:"middle",fontFace:F.head,fontSize:d>0.75?22:15,bold:true,color:C.navy}); }
  const notes=(s,t)=>s.addNotes(t);
  function proofGrid(s,items){ items.forEach((it,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.95+row*2.2;
    card(s,x,yy,w,2.0,col?C.ice:C.cloud); circleIcon(s,x+0.3,yy+0.34,0.82,I[it[0]].w);
    s.addText(it[1],{x:x+1.32,y:yy+0.24,w:w-1.55,h:0.42,fontFace:F.head,fontSize:16,bold:true,color:C.navy});
    s.addText(it[2],{x:x+1.32,y:yy+0.66,w:w-1.55,h:0.4,fontFace:F.body,fontSize:11.5,color:C.ink,valign:"top"});
    s.addText([{text:"→  ",options:{color:C.gold,bold:true}},{text:it[3],options:{color:C.slate,italic:true}}],{x:x+1.32,y:yy+1.12,w:w-1.55,h:0.74,fontFace:F.body,fontSize:10.5,valign:"top",lineSpacingMultiple:1.04});
  }); }
  function glossary(s,rows){ rows.forEach((g,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.85+row*0.93;
    card(s,x,yy,w,0.78,i%2?C.ice:C.cloud);
    s.addText(g[0],{x:x+0.2,y:yy,w:2.2,h:0.78,valign:"middle",fontFace:F.head,fontSize:14,bold:true,color:C.gold});
    s.addText(g[1],{x:x+2.4,y:yy,w:w-2.6,h:0.78,valign:"middle",fontFace:F.body,fontSize:12,color:C.ink}); }); }

  // ===== S1 DIVIDER =====
  let s=pptx.addSlide(); bg(s,C.navy);
  s.addShape(pptx.ShapeType.ellipse,{x:-1.5,y:4.3,w:4.8,h:4.8,fill:{color:C.navyCard},line:{type:"none"}});
  s.addText("DAY 2",{x:M,y:2.4,w:7,h:1.0,fontFace:F.head,fontSize:60,bold:true,color:C.gold});
  s.addText("How it all works",{x:M,y:3.6,w:11.5,h:0.7,fontFace:F.head,fontSize:27,color:C.white});
  s.addText("The players · your tools · the deal process · escrow · Oqood & title deed",{x:M,y:4.4,w:11.5,h:0.5,fontFace:F.body,fontSize:14,color:"AEB8CC"});
  logoTag(s,true);
  notes(s,"Day 2 is the practical engine room. Yesterday was the opportunity; today is exactly how a deal works, the tools you'll live in, and the paperwork. Keep it clear and concrete — lots of new terms, so define as you go.");

  // ===== S2 AGENDA =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Today at a glance","About 3 hours, with a break.");
  const ag=[["balance","Who regulates the market"],["search","Your toolkit — finding projects"],["whatsapp","Developer WhatsApp groups"],
    ["coffee","Short break"],["clipboard","The sales process, step by step"],["lock","Escrow — how money is protected"],
    ["certificate","Oqood, Title Deed & the forms"],["shield","AML + recap & quiz"]];
  ag.forEach((a,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.95+row*1.18;
    card(s,x,yy,w,0.95,a[0]==="coffee"?"FFF7E6":C.ice); circleIcon(s,x+0.22,yy+0.17,0.6,I[a[0]].w);
    s.addText(a[1],{x:x+1.0,y:yy,w:w-1.2,h:0.95,valign:"middle",fontFace:F.body,fontSize:14.5,bold:true,color:C.navy}); });
  notes(s,"Signpost. Tools + WhatsApp first (practical and fun), then the deal mechanics and paperwork after the break.");

  // ===== S3 THE PLAYERS =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Who runs the market","Three names you must know — clients will test you.");
  const pl=[["balance","DLD","The Dubai Land Department — the top authority that registers all property and deals."],
    ["gavel","RERA","The regulator inside DLD — it licenses brokers, sets the rules, and oversees escrow."],
    ["grad","DREI","DLD's training arm — it runs the broker certification course."]];
  pl.forEach((p,i)=>{ const w=CW/3-0.2; const x=M+i*(CW/3); const yy=1.95;
    card(s,x,yy,w,3.0); circleIcon(s,x+w/2-0.48,yy+0.35,0.95,I[p[0]].w);
    s.addText(p[1],{x,y:yy+1.45,w,h:0.5,align:"center",fontFace:F.head,fontSize:22,bold:true,color:C.gold});
    s.addText(p[2],{x:x+0.25,y:yy+2.0,w:w-0.5,h:0.9,align:"center",fontFace:F.body,fontSize:11.5,color:C.ink,valign:"top",lineSpacingMultiple:1.04}); });
  card(s,M,5.25,CW,1.35,C.ice); circleIcon(s,M+0.3,5.48,0.85,I.mobile.w);
  s.addText([{text:"Trakheesi",options:{bold:true,color:C.navy}},{text:" — the permit system: every advert needs a Trakheesi number.    ",options:{color:C.ink}},{text:"Dubai REST",options:{bold:true,color:C.navy}},{text:" — the official DLD app you'll use for forms & services.",options:{color:C.ink}}],{x:M+1.35,y:5.48,w:CW-1.7,h:0.9,valign:"middle",fontFace:F.body,fontSize:12.5,lineSpacingMultiple:1.05});
  notes(s,"DLD = parent authority; RERA = its regulatory arm (licenses you, runs escrow rules); DREI = training. Trakheesi permit on every ad is a hard rule. Dubai REST is the app you'll actually use.");

  // ===== S4 BECOMING A BROKER =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Becoming a licensed broker","Six steps — there is no freelance licence in Dubai.");
  const path=["Hold a UAE residency visa, sponsored by a licensed brokerage (that's us).",
    "Complete the broker course at DREI (~4 days / 32 hours).",
    "Pass the RERA exam (~100 questions; pass mark ~75% — confirm).",
    "Receive your Broker Card + BRN (Broker Registration Number).",
    "Renew the licence every year via DLD.",
    "Put a valid Trakheesi permit on every advert you post."];
  path.forEach((p,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.95+row*1.45;
    card(s,x,yy,w,1.22,C.cloud); circleNum(s,x+0.22,yy+0.27,0.68,i+1);
    s.addText(p,{x:x+1.05,y:yy,w:w-1.25,h:1.22,valign:"middle",fontFace:F.body,fontSize:12.5,color:C.ink,lineSpacingMultiple:1.03}); });
  notes(s,"Key reassurance: the brokerage sponsors you — no freelancing. Course + exam are very doable, and they map onto this training. Pass mark ~75% (confirm at registration). BRN goes on your deals; renew yearly; Trakheesi on every ad.");

  // ===== S5 TOOLKIT =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Your toolkit — finding & researching projects","Where you'll discover inventory, prices and availability.");
  const tools=[["search","Reelly (reelly.ai)","1,100+ off-plan projects — prices, payment plans, availability & commissions in one place."],
    ["chart","DXBinteract","Real transaction data — prices per sqft and area trends."],
    ["building","Property Finder","Dubai's leading portal — research listings and advertise your own."],
    ["home","Bayut / dubizzle","Major portal for listings, demand and leads."],
    ["database","Property Monitor","Market intelligence and the PMI price index."],
    ["mobile","Dubai REST","The official DLD app — verify, generate forms, access services."]];
  tools.forEach((t,i)=>{ const col=i%3,row=Math.floor(i/3); const w=(CW-0.5)/3; const x=M+col*(w+0.25); const yy=1.95+row*2.35;
    card(s,x,yy,w,2.1, (col+row)%2?C.ice:C.cloud); circleIcon(s,x+0.28,yy+0.3,0.8,I[t[0]].w);
    s.addText(t[1],{x:x+1.2,y:yy+0.3,w:w-1.4,h:0.7,fontFace:F.head,fontSize:14.5,bold:true,color:C.navy,valign:"middle"});
    s.addText(t[2],{x:x+0.3,y:yy+1.15,w:w-0.55,h:0.85,fontFace:F.body,fontSize:11,color:C.ink,valign:"top",lineSpacingMultiple:1.05}); });
  notes(s,"Reelly is the day-to-day off-plan hero — search projects, see live prices/availability/payment plans and the commission on offer. DXBinteract & Property Monitor for data/trends. Property Finder & Bayut are the portals where buyers search and you advertise. Dubai REST is the official DLD app. Encourage them to create accounts today.");

  // ===== S6 WHATSAPP GROUPS =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Stay in the loop — developer WhatsApp groups","How agents get answers and hear about launches first.");
  card(s,M,1.95,CW,1.4,"E9F7EF"); circleIcon(s,M+0.35,2.2,0.95,I.whatsapp.w);
  s.addText([{text:"Join each developer's official broker group",options:{bold:true,color:C.navy}},{text:" (WhatsApp / Telegram). It's where the market actually moves — and we'll add you to the right ones.",options:{color:C.ink}}],{x:M+1.75,y:2.05,w:CW-2.1,h:1.2,valign:"middle",fontFace:F.body,fontSize:14,lineSpacingMultiple:1.08});
  const wg=[["bell","Launch alerts first","New projects, price lists & EOI dates the moment they drop."],
    ["clipboard","Live availability","Which units are left — updated in real time on launch day."],
    ["phone","Direct answers","Ask the developer's broker-support team your questions."],
    ["coins","Offers & incentives","Commission boosts and limited-time launch deals."]];
  wg.forEach((g,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=3.6+row*1.4;
    card(s,x,yy,w,1.2,col?C.ice:C.cloud); circleIcon(s,x+0.25,yy+0.25,0.7,I[g[0]].w);
    s.addText([{text:g[1]+"  —  ",options:{bold:true,color:C.navy}},{text:g[2],options:{color:C.ink}}],{x:x+1.15,y:yy,w:w-1.35,h:1.2,valign:"middle",fontFace:F.body,fontSize:12,lineSpacingMultiple:1.05}); });
  s.addText("Etiquette: stay professional, no spam — and act fast. Hot launches can sell out in minutes.",{x:M,y:6.55,w:CW,h:0.35,align:"center",fontFace:F.body,italic:true,fontSize:11.5,color:C.slate});
  notes(s,"This is how off-plan really works day to day. Each developer runs official broker WhatsApp/Telegram groups: launch announcements, live price lists, real-time availability on launch day, EOI/booking instructions, and a support line for your questions. Reelly and our own brokerage groups add to this. Etiquette matters — professional, no spamming — and SPEED wins, because top units go in minutes. We'll add new joiners to the key groups.");

  // ===== S7 GLOSSARY 1 =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"The words you'll hear — part 1","Authorities & process.");
  glossary(s,[["DLD","Dubai Land Department"],["RERA","Real Estate Regulatory Agency"],["DREI","Dubai Real Estate Institute"],
    ["BRN","Broker Registration Number"],["Trakheesi","DLD advertising-permit system"],["Dubai REST","Official DLD app for forms & services"],
    ["Oqood","Interim off-plan property register"],["NOC","No Objection Certificate"],["SPA","Sale & Purchase Agreement"],["Ejari","Tenancy (rental) registration"]]);
  notes(s,"Reference slide — don't read every line. Call out the confusable ones: Oqood = off-plan register; SPA = the sale contract; Ejari is for rentals; Trakheesi = ad permit.");

  // ===== S8 GLOSSARY 2 =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"The words you'll hear — part 2","Money & the deal.");
  glossary(s,[["EOI","Expression of Interest (early booking)"],["LTV","Loan-to-Value (mortgage size)"],["DBR","Debt Burden Ratio"],
    ["ROI","Return on Investment"],["DLD fee","4% transfer fee on a purchase"],["DNFBP","Designated Non-Financial Business/Profession"],
    ["KYC","Know Your Customer"],["AML","Anti-Money Laundering"],["FIU","Financial Intelligence Unit"],["Title Deed","Final proof of ownership"]]);
  notes(s,"These return in the deal flow and the AML slide. EOI is the early booking step on launches; the DLD fee (4%) comes up in every purchase; the AML cluster (DNFBP/KYC/FIU) is covered near the end.");

  // ===== S9 CORE CONCEPTS =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Core concepts — quick primer","The six words behind every off-plan deal.");
  const cc=[["key","Freehold","Full ownership of home + land, in designated zones."],
    ["building","Off-plan","A property bought before/while it's being built."],
    ["home","Ready / secondary","A completed property resold on the market."],
    ["lock","Escrow","A protected bank account holding the buyer's money."],
    ["clipboard","Oqood","The interim off-plan register, kept by DLD."],
    ["certificate","Title Deed","The final proof your client owns the home."]];
  cc.forEach((c,i)=>{ const col=i%3,row=Math.floor(i/3); const w=(CW-0.4)/3; const x=M+col*(w+0.2); const yy=1.95+row*2.2;
    card(s,x,yy,w,2.0,C.cloud); circleIcon(s,x+0.25,yy+0.3,0.8,I[c[0]].w);
    s.addText(c[1],{x:x+1.2,y:yy+0.45,w:w-1.4,h:0.5,fontFace:F.head,fontSize:15,bold:true,color:C.navy});
    s.addText(c[2],{x:x+0.28,y:yy+1.2,w:w-0.56,h:0.7,fontFace:F.body,fontSize:11.5,color:C.ink,valign:"top",lineSpacingMultiple:1.04}); });
  notes(s,"A vocabulary checkpoint. Escrow, Oqood and Title Deed each get a full slide next — just plant the meanings now.");

  // ===== S10 SALES PROCESS FLOW =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"The off-plan sale — step by step","From a client's 'yes' to the keys.");
  const steps=["Client chooses a project & unit","Submit an EOI / booking (deposit)","Sign the reservation form","Sign the SPA (sale contract)",
    "Register the Oqood with DLD","Client pays in milestones","Construction completes","Handover → Title Deed issued"];
  steps.forEach((st,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.95+row*1.12;
    card(s,x,yy,w,0.92,i%2?C.ice:C.cloud); circleNum(s,x+0.2,yy+0.16,0.6,i+1);
    s.addText(st,{x:x+1.05,y:yy,w:w-1.25,h:0.92,valign:"middle",fontFace:F.body,fontSize:13.5,bold:true,color:C.navy}); });
  notes(s,"This is the backbone of the whole job. Walk it once end to end. EOI/booking secures the unit on launch; reservation + SPA make it formal; Oqood registers ownership during build; milestone payments fund construction; at handover the Oqood becomes a Title Deed. We zoom into the key steps next.");

  // ===== S11 EOI / RESERVATION =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Booking a unit — EOI & reservation","How you secure a home on launch day.");
  const bk=[["bell","EOI (Expression of Interest)","A refundable pre-booking — often a fixed amount — to get in the queue before a launch sells out."],
    ["clipboard","Reservation form","Confirms the chosen unit, price and payment plan once the client commits."],
    ["coins","Booking deposit","A first payment (commonly ~5–20%) that holds the unit.","var"],
    ["lock","Into escrow","The money goes into the project's protected account — not the developer's pocket."]];
  bk.forEach((b,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.95+row*2.05;
    card(s,x,yy,w,1.8,col?C.ice:C.cloud); circleIcon(s,x+0.3,yy+0.35,0.85,I[b[0]].w);
    s.addText(b[1],{x:x+1.35,y:yy+0.3,w:w-1.6,h:0.5,fontFace:F.head,fontSize:15.5,bold:true,color:C.navy});
    s.addText(b[2],{x:x+1.35,y:yy+0.8,w:w-1.6,h:0.85,fontFace:F.body,fontSize:11.5,color:C.ink,valign:"top",lineSpacingMultiple:1.05}); });
  notes(s,"On a hot launch, the EOI gets your client in line before units are even released. Then the reservation form + booking deposit lock the specific unit. Stress: the deposit goes into ESCROW (next), which is what protects the buyer. Amounts vary by developer.");

  // ===== S12 SPA =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"The SPA — Sale & Purchase Agreement","The contract that makes the off-plan sale real.");
  card(s,M,1.95,CW,1.45,C.ice); circleIcon(s,M+0.35,2.2,0.95,I.signature.w);
  s.addText([{text:"The SPA",options:{bold:true,color:C.navy}},{text:" is the binding contract between your client and the developer. It sets the unit, price, payment plan, and the handover date.",options:{color:C.ink}}],{x:M+1.75,y:2.05,w:CW-2.1,h:1.2,valign:"middle",fontFace:F.body,fontSize:14,lineSpacingMultiple:1.08});
  const spa=[["clipboard","What it locks in","Unit, total price, the payment schedule, and the expected completion date."],
    ["shield","Why it protects everyone","Clear terms for both sides, backed by DLD registration & escrow."],
    ["link","Leads to the Oqood","After the SPA, the purchase is registered on the Oqood (next)."]];
  spa.forEach((p,i)=>{ const w=(CW-0.8)/3; const x=M+i*(w+0.4); const yy=3.7;
    card(s,x,yy,w,2.6,C.cloud); circleIcon(s,x+w/2-0.42,yy+0.3,0.84,I[p[0]].w);
    s.addText(p[1],{x,y:yy+1.3,w,h:0.5,align:"center",fontFace:F.head,fontSize:14.5,bold:true,color:C.navy});
    s.addText(p[2],{x:x+0.2,y:yy+1.8,w:w-0.4,h:0.7,align:"center",fontFace:F.body,fontSize:11,color:C.ink,valign:"top",lineSpacingMultiple:1.04}); });
  notes(s,"The SPA is the main off-plan contract (developer ↔ buyer). It nails down unit, price, payment plan, handover date. Once signed, the purchase gets registered on the Oqood. (Note: Form F is the separate buyer↔seller contract used on resale — covered in the forms section.)");

  // ===== S13 ESCROW WHAT/WHY =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Escrow — how your client's money is protected","The single most important trust point in off-plan.");
  card(s,M,1.95,CW,1.5,"FFF7E6"); circleIcon(s,M+0.35,2.2,1.0,I.lock.w);
  s.addText([{text:"By law (Law No. 8 of 2007), ",options:{color:C.ink}},{text:"every off-plan payment goes into a protected, project-specific escrow account",options:{bold:true,color:C.navy}},{text:" — never the developer's own account.",options:{color:C.ink}}],{x:M+1.75,y:2.05,w:CW-2.1,h:1.25,valign:"middle",fontFace:F.body,fontSize:14,lineSpacingMultiple:1.1});
  const es=[["bank","Held by a licensed bank","A RERA-approved trustee bank guards the funds."],["building","Ring-fenced per project","Each project has its own separate account."],["shield","Tied to construction","Money is only used to build that project."]];
  es.forEach((e,i)=>{ const w=(CW-0.8)/3; const x=M+i*(w+0.4); const yy=3.75;
    card(s,x,yy,w,2.5,C.cloud); circleIcon(s,x+w/2-0.42,yy+0.3,0.84,I[e[0]].w);
    s.addText(e[1],{x,y:yy+1.25,w,h:0.55,align:"center",fontFace:F.head,fontSize:14,bold:true,color:C.navy});
    s.addText(e[2],{x:x+0.2,y:yy+1.85,w:w-0.4,h:0.55,align:"center",fontFace:F.body,fontSize:11,color:C.ink,valign:"top"}); });
  notes(s,"This is your #1 answer to 'isn't off-plan risky?'. The law forces every dirham into a ring-fenced, project-specific escrow account at an approved bank — the developer cannot just take it. Memorise: Law No. 8 of 2007.");

  // ===== S14 ESCROW HOW =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Escrow in practice","Money is released only as the building rises.");
  const fl=[["coins","Client pays","Each milestone payment goes into the project escrow account."],
    ["building","Builder builds","The developer reaches a construction stage."],
    ["check","Engineer verifies","A certified engineer confirms the progress, with RERA sign-off."],
    ["bank","Funds released","Only then is that portion released to the developer."]];
  fl.forEach((f,i)=>{ const w=(CW-0.6)/4; const x=M+i*(w+0.2); const yy=2.1;
    card(s,x,yy,w,3.3); circleNum(s,x+w/2-0.42,yy+0.35,0.84,i+1); circleIcon(s,x+w/2-0.42,yy+1.35,0.7,I[f[0]].w);
    s.addText(f[1],{x:x+0.05,y:yy+2.2,w:w-0.1,h:0.4,align:"center",fontFace:F.head,fontSize:13.5,bold:true,color:C.navy});
    s.addText(f[2],{x:x+0.12,y:yy+2.6,w:w-0.24,h:0.65,align:"center",fontFace:F.body,fontSize:10.5,color:C.ink,valign:"top",lineSpacingMultiple:1.03}); });
  s.addText("So the developer only gets paid for work actually done — that's what keeps buyers safe.",{x:M,y:5.7,w:CW,h:0.4,align:"center",fontFace:F.body,italic:true,fontSize:12.5,color:C.slate});
  notes(s,"The release cycle: pay → build → engineer verifies → RERA signs off → funds released for that stage. Money never gets ahead of the construction. Heavy penalties for escrow misuse. This is the mechanism behind 'your money is protected.'");

  // ===== S15 OQOOD =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"What is the Oqood?","Your client's proof of ownership while the home is still being built.");
  card(s,M,1.95,CW,1.5,C.ice); circleIcon(s,M+0.35,2.2,1.0,I.clipboard.w);
  s.addText([{text:"Oqood",options:{bold:true,color:C.navy}},{text:" is the official ",options:{color:C.ink}},{text:"interim (temporary) registration",options:{bold:true,color:C.navy}},{text:" of an off-plan property with DLD — created after the SPA. It records that your client owns that unit during construction.",options:{color:C.ink}}],{x:M+1.75,y:2.05,w:CW-2.1,h:1.25,valign:"middle",fontFace:F.body,fontSize:13.5,lineSpacingMultiple:1.08});
  const oq=[["gavel","The rule","Backed by Law No. 13 of 2008."],["mobile","Where it's done","Registered online via DLD (Dubai REST / Oqood)."],
    ["link","Why it matters","Needed for off-plan resale and the Golden Visa."],["certificate","What's next","It converts into a Title Deed at handover."]];
  oq.forEach((o,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=3.6+row*1.45;
    card(s,x,yy,w,1.25,col?C.cloud:"FFF9ED"); circleIcon(s,x+0.25,yy+0.27,0.72,I[o[0]].w);
    s.addText([{text:o[1]+"  —  ",options:{bold:true,color:C.navy}},{text:o[2],options:{color:C.ink}}],{x:x+1.2,y:yy,w:w-1.4,h:1.25,valign:"middle",fontFace:F.body,fontSize:12,lineSpacingMultiple:1.05}); });
  notes(s,"Oqood = the interim off-plan register (Law 13 of 2008), registered with DLD via Dubai REST after the SPA. It's how a buyer 'owns' a property that doesn't physically exist yet — and it's what enables off-plan resale and Golden Visa eligibility. At handover it becomes the Title Deed.");

  // ===== S16 TITLE DEED =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"What is the Title Deed?","The final, official proof that your client owns the home.");
  card(s,M,1.95,CW,1.5,"FFF7E6"); circleIcon(s,M+0.35,2.2,1.0,I.certificate.w);
  s.addText([{text:"The Title Deed",options:{bold:true,color:C.navy}},{text:" is the document issued by DLD that proves ownership — the client's name, the property, and its details. It's the 'final word' on who owns what.",options:{color:C.ink}}],{x:M+1.75,y:2.05,w:CW-2.1,h:1.25,valign:"middle",fontFace:F.body,fontSize:14,lineSpacingMultiple:1.1});
  // Oqood -> Title flow
  s.addText("From Oqood to Title Deed",{x:M,y:3.65,w:CW,h:0.35,fontFace:F.body,fontSize:13,bold:true,color:C.navy});
  const flow=[["clipboard","Oqood","During construction"],["building","Handover","Project completes"],["certificate","Title Deed","Full ownership"]];
  const fw=(CW-1.0)/3;
  flow.forEach((f,i)=>{ const x=M+i*(fw+0.5); const yy=4.1;
    card(s,x,yy,fw,2.0, i===2?C.ice:C.cloud); circleIcon(s,x+fw/2-0.45,yy+0.3,0.9,I[f[0]].w);
    s.addText(f[1],{x,y:yy+1.3,w:fw,h:0.4,align:"center",fontFace:F.head,fontSize:16,bold:true,color:C.navy});
    s.addText(f[2],{x,y:yy+1.7,w:fw,h:0.3,align:"center",fontFace:F.body,fontSize:11,color:C.slate});
    if(i<2) s.addText("→",{x:x+fw+0.05,y:yy+0.7,w:0.4,h:0.5,align:"center",fontFace:F.head,fontSize:26,bold:true,color:C.gold}); });
  notes(s,"Title Deed = the final ownership document from DLD (owner name, property, plot/area). For ready property it transfers at the DLD transfer; for off-plan, the Oqood becomes a Title Deed once the project is handed over. Simple line to remember: Oqood (while building) → Title Deed (when built).");

  // ===== S17 FORMS OVERVIEW =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"The RERA forms","Standard contracts that keep every deal clear and fair.");
  card(s,M,1.95,CW,1.3,C.ice); circleIcon(s,M+0.32,2.15,0.85,I.contract.w);
  s.addText("RERA uses standard lettered forms for every stage of a deal. They're generated through Dubai REST, so everyone signs the same trusted paperwork — no handwritten contracts.",{x:M+1.35,y:2.05,w:CW-1.7,h:1.1,valign:"middle",fontFace:F.body,fontSize:13.5,color:C.ink,lineSpacingMultiple:1.06});
  const fo=[["A","Owner ↔ broker: permission to market"],["B","Buyer ↔ broker: appoint you to search"],["F","Buyer ↔ seller: the binding sale contract"],["I","Agent ↔ agent: the commission split"]];
  fo.forEach((f,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=3.55+row*1.5;
    card(s,x,yy,w,1.3,col?C.cloud:"FFF9ED"); circleNum(s,x+0.22,yy+0.3,0.7,f[0]);
    s.addText(f[1],{x:x+1.1,y:yy,w:w-1.3,h:1.3,valign:"middle",fontFace:F.body,fontSize:13.5,bold:true,color:C.navy}); });
  notes(s,"Four core forms: A (list/market), B (represent a buyer), F (the sale contract), I (split with another agent). Detailed next two slides. All generated via Dubai REST.");

  // ===== S18 FORM A & B =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Form A & Form B","Your agreements before a deal.");
  const ab=[["scroll","Form A","FFF7E6",["Between the owner/seller and the broker.","Permission to market & advertise the property.","Drives the Trakheesi advertising permit.","An owner can appoint up to 3 brokers."]],
    ["handshake","Form B","EEF3FB",["Between the buyer and the broker.","Appoints you to search & negotiate for them.","Sets the budget and what they're looking for.","Makes you officially their agent."]]];
  ab.forEach((c,i)=>{ const w=(CW-0.4)/2; const x=M+i*(w+0.4); const yy=1.9;
    card(s,x,yy,w,4.5,c[2]); circleIcon(s,x+0.3,yy+0.35,0.9,I[c[0]].w);
    s.addText(c[1],{x:x+1.35,y:yy+0.5,w:w-1.6,h:0.6,fontFace:F.head,fontSize:21,bold:true,color:C.navy});
    s.addText(c[3].map(t=>({text:t,options:{bullet:{indent:14},breakLine:true}})),{x:x+0.4,y:yy+1.55,w:w-0.8,h:2.7,fontFace:F.body,fontSize:13,color:C.ink,valign:"top",lineSpacingMultiple:1.2}); });
  notes(s,"Form A = you're allowed to market a seller's property (and it powers the Trakheesi permit); a seller can list with up to 3 brokers. Form B = a buyer formally appoints you to find and negotiate. Get these signed early so your work is protected.");

  // ===== S19 FORM F / I / U =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Form F, Form I & Form U","The sale, the split, and the exit.");
  const fiu=[["signature","Form F — the sale","The binding sale contract between buyer & seller (the MOU). Only a licensed broker can generate it via Dubai REST."],
    ["coins","Form I — the split","Records two cooperating agents and their commission split — commonly 50/50."],
    ["exchange","Form U — the exit","Ends a Form A or B with a 7-day written notice."]];
  fiu.forEach((f,i)=>{ const w=(CW-0.8)/3; const x=M+i*(w+0.4); const yy=2.0;
    card(s,x,yy,w,4.1, i===0?"FFF7E6":C.cloud); circleIcon(s,x+w/2-0.5,yy+0.45,1.0,I[f[0]].w);
    s.addText(f[1],{x:x+0.15,y:yy+1.7,w:w-0.3,h:0.85,align:"center",fontFace:F.head,fontSize:16,bold:true,color:C.navy});
    s.addText(f[2],{x:x+0.25,y:yy+2.55,w:w-0.5,h:1.35,align:"center",fontFace:F.body,fontSize:12,color:C.ink,valign:"top",lineSpacingMultiple:1.08}); });
  notes(s,"Form F is the big one — the binding sale contract (replaces old handwritten MOUs); only a licensed broker generates it via Dubai REST. Form I records co-broke splits (usually 50/50). Form U cancels a Form A/B with 7 days' notice. Highlight Form F.");

  // ===== S20 NOC & HANDOVER =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"NOC & handover documents","The final paperwork that completes a deal.");
  const nh=[["stamp","NOC (No Objection Certificate)","From the developer — confirms no money is owed and they don't object to the transfer. Fee ~AED 500–5,000.","var"],
    ["key","Handover","The client inspects, accepts the unit, and collects the keys."],
    ["certificate","Title Deed issued","DLD issues the Title Deed — ownership is complete."],
    ["bank","Utilities & Ejari","Set up DEWA (power & water); register Ejari if it will be rented."]];
  nh.forEach((n,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=1.95+row*2.05;
    card(s,x,yy,w,1.8,col?C.ice:C.cloud); circleIcon(s,x+0.3,yy+0.35,0.85,I[n[0]].w);
    s.addText(n[1],{x:x+1.35,y:yy+0.3,w:w-1.6,h:0.55,fontFace:F.head,fontSize:14.5,bold:true,color:C.navy});
    s.addText(n[2],{x:x+1.35,y:yy+0.85,w:w-1.6,h:0.85,fontFace:F.body,fontSize:11.5,color:C.ink,valign:"top",lineSpacingMultiple:1.05}); });
  notes(s,"To complete a resale/transfer you need the developer's NOC (confirms no dues; small fee). At handover the buyer inspects and accepts, DLD issues the Title Deed, and you help set up DEWA and Ejari (if rented). Being helpful here earns referrals.");

  // ===== S21 AML =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"AML — what every agent must know","Anti-Money Laundering. Brokers have real legal duties.");
  card(s,M,1.9,CW,1.4,"FFF7E6"); circleIcon(s,M+0.35,2.12,0.95,I.shield.w);
  s.addText("As a broker you're a 'DNFBP' — a business with anti-money-laundering duties under UAE law. In plain terms: know who you're dealing with, and flag anything that looks wrong.",{x:M+1.75,y:2.0,w:CW-2.1,h:1.2,valign:"middle",fontFace:F.body,fontSize:13.5,color:C.ink,lineSpacingMultiple:1.06});
  const aml=[["id","Verify (KYC)","Confirm your client's ID and where the money comes from."],["coins","Watch cash","Flag unusually large or cash-heavy deals."],
    ["mobile","Use goAML","Report through the goAML portal; we have a compliance officer."],["gavel","Report concerns","File a suspicious-transaction report to the FIU."]];
  aml.forEach((a,i)=>{ const col=i%2,row=Math.floor(i/2); const w=(CW-0.4)/2; const x=M+col*(w+0.4); const yy=3.55+row*1.45;
    card(s,x,yy,w,1.25,col?C.ice:C.cloud); circleIcon(s,x+0.25,yy+0.27,0.72,I[a[0]].w);
    s.addText([{text:a[1]+"  —  ",options:{bold:true,color:C.navy}},{text:a[2],options:{color:C.ink}}],{x:x+1.2,y:yy,w:w-1.4,h:1.25,valign:"middle",fontFace:F.body,fontSize:12,lineSpacingMultiple:1.05}); });
  s.addText("If something feels off, escalate to your compliance officer. Penalties for ignoring this are serious.",{x:M,y:6.5,w:CW,h:0.35,align:"center",fontFace:F.body,italic:true,fontSize:11.5,color:C.slate});
  notes(s,"Keep it serious but simple. Brokers are DNFBPs: do KYC, verify source of funds, watch cash/high-value deals, use goAML, and report suspicious activity to the FIU. New agents: never push a deal that feels wrong — escalate to compliance.");

  // ===== S22 RECAP =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Day 2 — what to remember");
  const rc=[["DLD runs it; RERA regulates; DREI trains.","And you work under a sponsoring brokerage."],
    ["Live in your tools.","Reelly for projects; portals for leads; developer WhatsApp groups for launches."],
    ["Know the deal flow.","Book → SPA → Oqood → milestone payments → handover → Title Deed."],
    ["Escrow protects the buyer.","Law No. 8 of 2007 — money is released only against real construction."],
    ["Oqood becomes the Title Deed.","Interim register while building → final ownership at handover."]];
  rc.forEach((r,i)=>{ const yy=1.95+i*0.92; card(s,M,yy,CW,0.78,i%2?C.ice:C.cloud); circleNum(s,M+0.22,yy+0.13,0.52,i+1);
    s.addText([{text:r[0]+"  ",options:{bold:true,color:C.navy}},{text:r[1],options:{color:C.ink}}],{x:M+1.05,y:yy,w:CW-1.25,h:0.78,valign:"middle",fontFace:F.body,fontSize:13.5}); });
  s.addText("Tomorrow: the money in detail — payment plans, mortgages, fees and returns.",{x:M,y:6.55,w:CW,h:0.35,align:"center",fontFace:F.body,italic:true,fontSize:13,color:C.gold});
  notes(s,"Five anchors. Make them recall the deal flow out loud. Preview Day 3 (finance).");

  // ===== S23 QUIZ =====
  s=pptx.addSlide(); bg(s,C.navy);
  s.addText("Day 2 — Quiz",{x:M,y:0.55,w:CW,h:0.8,fontFace:F.head,fontSize:30,bold:true,color:C.gold});
  s.addText("Five questions. Answers on the next slide.",{x:M,y:1.3,w:CW,h:0.4,fontFace:F.body,fontSize:14,color:"AEB8CC"});
  const q=["Which form is the binding sale contract between buyer & seller — and who can generate it?",
    "Under which law does off-plan money go into escrow, and whose account does it avoid?",
    "What is the Oqood, and what does it become at handover?",
    "Name one platform you'd use to find off-plan projects, prices and availability.",
    "What is a Title Deed?"];
  q.forEach((qq,i)=>{ const yy=1.95+i*1.02;
    s.addShape(pptx.ShapeType.roundRect,{x:M,y:yy,w:CW,h:0.86,rectRadius:0.09,fill:{color:C.navyCard},line:{type:"none"},shadow:sh()});
    circleNum(s,M+0.22,yy+0.13,0.6,i+1);
    s.addText(qq,{x:M+1.05,y:yy,w:CW-1.25,h:0.86,valign:"middle",fontFace:F.body,fontSize:13,color:C.white}); });
  logoTag(s,true);
  notes(s,"Pairs discuss for a few minutes, then reveal.");

  // ===== S24 ANSWER KEY =====
  s=pptx.addSlide(); bg(s,C.white);
  title(s,"Day 2 — Quiz answer key");
  const ans=[["Form F","the binding buyer–seller sale contract; only a licensed RERA broker generates it via Dubai REST."],
    ["Law No. 8 of 2007","money goes into the project's escrow account — not the developer's own account."],
    ["The interim off-plan register","it converts into a Title Deed at handover."],
    ["Reelly","(also Property Finder, Bayut, DXBinteract or Property Monitor)."],
    ["The final proof of ownership","issued by DLD."]];
  ans.forEach((a,i)=>{ const yy=1.9+i*0.98; card(s,M,yy,CW,0.84,i%2?C.ice:C.cloud);
    s.addImage({data:I.check.g,x:M+0.22,y:yy+0.22,w:0.4,h:0.4});
    s.addText([{text:(i+1)+".  ",options:{bold:true,color:C.navy}},{text:a[0],options:{bold:true,color:C.green}},{text:"  —  "+a[1],options:{color:C.ink}}],{x:M+0.85,y:yy,w:CW-1.05,h:0.84,valign:"middle",fontFace:F.body,fontSize:12.5,lineSpacingMultiple:1.02}); });
  notes(s,"Expand each answer. Re-teach anything widely missed before Day 3.");

  await pptx.writeFile({ fileName: "BridgesAllies_OffPlan_Training_Day2.pptx" });
  console.log("WROTE Day 2 (~3h) — slides: 24");
})().catch(e=>{ console.error("BUILD ERROR:", e); process.exit(1); });
