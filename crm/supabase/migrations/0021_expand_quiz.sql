-- ============================================================================
-- 0021 — Expand the junior training test to a 60-question bank.
-- ----------------------------------------------------------------------------
-- Each attempt draws 25 questions at random from these 60, shuffled, with a
-- 25-minute timer. Mix of multiple-choice and typed-number answers. Commission
-- questions are gross = rate x deal value only (no company-split questions).
-- Self-contained & idempotent: run in the Supabase SQL editor AFTER 0018.
-- Supersedes the 25-question seed in 0019 (safe to run even if 0019 never was).
-- ============================================================================

-- How many questions each attempt draws from the bank.
alter table public.quizzes add column if not exists question_count int not null default 25;

-- Create the quiz if it doesn't exist yet (covers DBs that never ran 0019).
insert into public.quizzes (title, description, time_limit_minutes, pass_mark, question_count)
select 'Junior Test — Dubai Off-Plan', '25 questions drawn at random from a 60-question bank, in shuffled order. 25-minute timer, one attempt. Covers Dubai off-plan plus commission & ROI calculations.', 25, 0.7, 25
where not exists (select 1 from public.quizzes where title in ('Junior Test — Dubai Off-Plan', 'Junior Week-2 Test — Dubai Off-Plan'));

-- Bring any existing quiz row up to the new settings (and rename the old one).
update public.quizzes set
  title = 'Junior Test — Dubai Off-Plan',
  description = '25 questions drawn at random from a 60-question bank, in shuffled order. 25-minute timer, one attempt. Covers Dubai off-plan plus commission & ROI calculations.',
  time_limit_minutes = 25,
  question_count = 25
where title in ('Junior Test — Dubai Off-Plan', 'Junior Week-2 Test — Dubai Off-Plan');

-- Reseed the full 60-question bank (wipe first so re-runs stay idempotent).
delete from public.quiz_questions where quiz_id in (select id from public.quizzes where title = 'Junior Test — Dubai Off-Plan');

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 1, 'mcq', 'In which year''s decree could foreigners first own freehold property in Dubai?', '[{"key":"A","text":"1996"},{"key":"B","text":"2002"},{"key":"C","text":"2008"},{"key":"D","text":"2014"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 2, 'mcq', 'What is the key difference between freehold and leasehold?', '[{"key":"A","text":"Freehold is cheaper"},{"key":"B","text":"Freehold is full, permanent ownership including the land; leasehold is a long, time-limited right to use"},{"key":"C","text":"They are the same"},{"key":"D","text":"Leasehold lasts forever"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 3, 'mcq', 'An investor makes AED 1,200,000 profit selling a Dubai property. How much capital gains tax?', '[{"key":"A","text":"240,000"},{"key":"B","text":"120,000"},{"key":"C","text":"0"},{"key":"D","text":"48,000"}]'::jsonb, 'C', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 4, 'mcq', 'Compared with the UK, France or India, Dubai''s standout advantage for property investors is…', '[{"key":"A","text":"Cheaper flights"},{"key":"B","text":"Zero capital gains and rental income tax"},{"key":"C","text":"Bigger apartments"},{"key":"D","text":"Colder weather"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 5, 'mcq', 'Dubai has two bodies. Which statement is correct?', '[{"key":"A","text":"DLD builds towers; RERA sells them"},{"key":"B","text":"DLD records ownership & issues title deeds; RERA licenses agents and enforces the rules"},{"key":"C","text":"They both only collect taxes"},{"key":"D","text":"RERA owns all the land"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 6, 'mcq', 'Why did Dubai introduce the escrow law in 2007?', '[{"key":"A","text":"To raise taxes"},{"key":"B","text":"To protect buyers after some developers took money and never finished projects"},{"key":"C","text":"To slow down sales"},{"key":"D","text":"To help banks"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 7, 'mcq', 'If an off-plan project is cancelled, where do buyers'' refunds come from?', '[{"key":"A","text":"The developer''s marketing budget"},{"key":"B","text":"The protected escrow account"},{"key":"C","text":"The buyer''s own savings"},{"key":"D","text":"Nowhere"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 8, 'mcq', 'How does the Oqood register protect a buyer?', '[{"key":"A","text":"It pays their deposit"},{"key":"B","text":"It registers the sale so the same unit can''t be sold twice"},{"key":"C","text":"It builds the property"},{"key":"D","text":"It removes the 4% fee"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 9, 'mcq', 'Before selling a single off-plan unit, a developer must first…', '[{"key":"A","text":"Finish the building"},{"key":"B","text":"Own the land, get RERA approval, and open a project escrow account"},{"key":"C","text":"Sell it to a bank"},{"key":"D","text":"Wait ten years"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 10, 'mcq', 'Why is a 2026 slowdown unlikely to look like the 2008 crash?', '[{"key":"A","text":"Prices never change"},{"key":"B","text":"Escrow, Golden-Visa residents and a cash-heavy market make it far more stable"},{"key":"C","text":"Dubai banned selling"},{"key":"D","text":"Off-plan was abolished"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 11, 'mcq', 'Roughly what share of Dubai home sales today are off-plan?', '[{"key":"A","text":"About 10%"},{"key":"B","text":"About 30%"},{"key":"C","text":"About 50%"},{"key":"D","text":"About 70%"}]'::jsonb, 'D', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 12, 'mcq', 'DLD records ownership. What does RERA mainly do?', '[{"key":"A","text":"Builds towers"},{"key":"B","text":"Regulates brokers, developers, escrow and rentals — and enforces the rules"},{"key":"C","text":"Sells units"},{"key":"D","text":"Sets prices"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 13, 'mcq', 'For a rent increase, what notice is needed and what governs the amount?', '[{"key":"A","text":"7 days, landlord decides"},{"key":"B","text":"90 days, the RERA Rental Index"},{"key":"C","text":"No notice, any amount"},{"key":"D","text":"30 days, the bank"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 14, 'mcq', 'An off-plan sale must be registered on Oqood within… of signing the SPA.', '[{"key":"A","text":"24 hours"},{"key":"B","text":"about 90 days"},{"key":"C","text":"5 years"},{"key":"D","text":"never"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 15, 'mcq', 'What must appear on every property advert you post?', '[{"key":"A","text":"Your home address"},{"key":"B","text":"A valid Trakheesi permit number"},{"key":"C","text":"The buyer''s passport"},{"key":"D","text":"Nothing"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 16, 'mcq', 'A buyer wants a whole master-planned community from a proven name. Which developer tier?', '[{"key":"A","text":"Tier A (e.g. Emaar, Sobha)"},{"key":"B","text":"Tier B (e.g. Imtiaz)"},{"key":"C","text":"Tier C (e.g. Samana)"},{"key":"D","text":"None"}]'::jsonb, 'A', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 17, 'mcq', 'The most important factor when judging any developer''s project is…', '[{"key":"A","text":"The brochure"},{"key":"B","text":"Their track record of on-time, quality handovers"},{"key":"C","text":"The lobby colour"},{"key":"D","text":"The launch party"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 18, 'mcq', 'Why does a Dubai building carry an annual service charge?', '[{"key":"A","text":"It''s a hidden tax"},{"key":"B","text":"It pays to run and maintain the shared areas — security, cleaning, pools, lifts"},{"key":"C","text":"It pays the agent"},{"key":"D","text":"It''s optional"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 19, 'mcq', 'When is escrow money released to the developer?', '[{"key":"A","text":"All at once at SPA signing"},{"key":"B","text":"Only as each construction milestone is certified complete"},{"key":"C","text":"Whenever the developer asks"},{"key":"D","text":"Never"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 20, 'mcq', 'What does the one-time 4% DLD fee pay for?', '[{"key":"A","text":"The agent''s commission"},{"key":"B","text":"Registering ownership and issuing the official title"},{"key":"C","text":"The service charge"},{"key":"D","text":"The mortgage"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 21, 'mcq', 'In which year was the escrow law introduced?', '[{"key":"A","text":"2002"},{"key":"B","text":"2005"},{"key":"C","text":"2007"},{"key":"D","text":"2012"}]'::jsonb, 'C', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 22, 'mcq', 'What is ''Ejari''?', '[{"key":"A","text":"A developer"},{"key":"B","text":"The system that registers rental (tenancy) contracts"},{"key":"C","text":"A type of villa"},{"key":"D","text":"A mortgage"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 23, 'mcq', 'Your BRN card is…', '[{"key":"A","text":"A bank account"},{"key":"B","text":"Your personal RERA broker licence"},{"key":"C","text":"A building permit"},{"key":"D","text":"A visa"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 24, 'mcq', 'What does the booking deposit at reservation do?', '[{"key":"A","text":"Pays your commission"},{"key":"B","text":"Takes the unit off the market and holds it for the buyer"},{"key":"C","text":"Pays the 4% DLD fee"},{"key":"D","text":"Transfers the title deed"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 25, 'mcq', 'To assign an off-plan unit before handover, a buyer usually needs…', '[{"key":"A","text":"Nothing"},{"key":"B","text":"To have paid a threshold (often 30–40%) and get a developer NOC"},{"key":"C","text":"The neighbour''s approval"},{"key":"D","text":"To wait 10 years"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 26, 'mcq', 'What is ''snagging''?', '[{"key":"A","text":"A sales technique"},{"key":"B","text":"The buyer inspecting the finished unit for defects before final payment"},{"key":"C","text":"A tax"},{"key":"D","text":"A payment plan"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 27, 'mcq', 'Buying property worth how much can unlock a 10-year Golden Visa?', '[{"key":"A","text":"500,000"},{"key":"B","text":"1,000,000"},{"key":"C","text":"2,000,000"},{"key":"D","text":"10,000,000"}]'::jsonb, 'C', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 28, 'mcq', 'Which app lets a buyer verify ownership / Oqood status?', '[{"key":"A","text":"Instagram"},{"key":"B","text":"Dubai REST"},{"key":"C","text":"WhatsApp"},{"key":"D","text":"Careem"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 29, 'mcq', 'Who issues the title deed at final payment / handover?', '[{"key":"A","text":"The developer"},{"key":"B","text":"The bank"},{"key":"C","text":"DLD (Dubai Land Department)"},{"key":"D","text":"The agent"}]'::jsonb, 'C', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 30, 'mcq', 'In a ''post-handover'' payment plan, part of the price is…', '[{"key":"A","text":"Paid before booking"},{"key":"B","text":"Paid after the buyer moves in"},{"key":"C","text":"Never paid"},{"key":"D","text":"Paid to the agent"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 31, 'mcq', 'Why does responding to a new lead within minutes matter?', '[{"key":"A","text":"It looks busy"},{"key":"B","text":"The first agent to respond usually wins the client"},{"key":"C","text":"It''s the law"},{"key":"D","text":"It saves battery"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 32, 'mcq', 'Master developers such as Emaar, Nakheel, DAMAC and Meraas are best described as…', '[{"key":"A","text":"Tier C"},{"key":"B","text":"Tier A"},{"key":"C","text":"Banks"},{"key":"D","text":"Brokers"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 33, 'mcq', 'Escrow accounts are held at… and supervised by RERA.', '[{"key":"A","text":"The developer''s office"},{"key":"B","text":"A DLD-approved bank"},{"key":"C","text":"The buyer''s home"},{"key":"D","text":"The agent''s account"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 34, 'mcq', 'Which of these is NOT one of the ''8 facts'' to size up a project?', '[{"key":"A","text":"Developer & track record"},{"key":"B","text":"Payment plan"},{"key":"C","text":"The salesperson''s star sign"},{"key":"D","text":"Price per sq ft"}]'::jsonb, 'C', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 35, 'mcq', 'Off-plan (vs ready) typically offers…', '[{"key":"A","text":"Immediate rental income"},{"key":"B","text":"Lower entry price and staged payment plans"},{"key":"C","text":"An older building"},{"key":"D","text":"No choice of units"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 36, 'mcq', 'A buyer says off-plan feels risky as it isn''t built. Best response?', '[{"key":"A","text":"''All investing is risky''"},{"key":"B","text":"Explain escrow, Oqood and the developer''s delivery record"},{"key":"C","text":"Promise guaranteed profit"},{"key":"D","text":"Change the subject"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 37, 'mcq', '''Form F'' in a Dubai deal is…', '[{"key":"A","text":"A mortgage form"},{"key":"B","text":"The buyer–seller sale contract (MOU)"},{"key":"C","text":"A visa form"},{"key":"D","text":"A tenancy contract"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 38, 'mcq', 'Dubai''s population recently passed…', '[{"key":"A","text":"1 million"},{"key":"B","text":"2 million"},{"key":"C","text":"4 million"},{"key":"D","text":"20 million"}]'::jsonb, 'C', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 39, 'mcq', 'The Oqood certificate converts into… at handover.', '[{"key":"A","text":"A mortgage"},{"key":"B","text":"A title deed"},{"key":"C","text":"A tenancy contract"},{"key":"D","text":"A service charge"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 40, 'mcq', 'Best way to manage off-plan risk for a buyer?', '[{"key":"A","text":"Over-promise returns"},{"key":"B","text":"Choose trusted developers and lean on escrow & Oqood"},{"key":"C","text":"Hide the risks"},{"key":"D","text":"Only sell the cheapest unit"}]'::jsonb, 'B', false from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 41, 'numeric', 'The commission rate is 6% on a deal of AED 2,000,000. What is the gross commission? (type the amount)', 120000, 0, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 42, 'numeric', 'The commission rate is 4% on a deal of AED 1,500,000. What is the gross commission? (type the amount)', 60000, 0, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 43, 'numeric', 'The commission rate is 2% on a deal of AED 3,500,000. What is the gross commission? (type the amount)', 70000, 0, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 44, 'mcq', 'The commission rate is 5% on a deal of AED 850,000. What is the gross commission?', '[{"key":"A","text":"34,000"},{"key":"B","text":"42,500"},{"key":"C","text":"50,000"},{"key":"D","text":"85,000"}]'::jsonb, 'B', true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 45, 'numeric', 'The commission rate is 3% on a deal of AED 5,000,000. What is the gross commission? (type the amount)', 150000, 0, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 46, 'mcq', 'Commission is 6% on a deal of AED 1,200,000. What is the gross commission?', '[{"key":"A","text":"60,000"},{"key":"B","text":"72,000"},{"key":"C","text":"84,000"},{"key":"D","text":"120,000"}]'::jsonb, 'B', true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 47, 'numeric', 'A property costs AED 1,500,000 and rents for AED 120,000 per year. What is the gross rental yield, in %? (type the number, e.g. 8)', 8, 0.1, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 48, 'numeric', 'A property costs AED 900,000 and rents for AED 63,000 per year. What is the gross rental yield, in %? (type the number)', 7, 0.1, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 49, 'mcq', 'A property costs AED 2,000,000 and rents for AED 130,000 per year. What is the gross rental yield?', '[{"key":"A","text":"5%"},{"key":"B","text":"6.5%"},{"key":"C","text":"8%"},{"key":"D","text":"13%"}]'::jsonb, 'B', true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 50, 'numeric', 'An investor buys at AED 1,800,000 and sells at AED 3,000,000. What is the ROI on the purchase price, in %? (round to 2 decimals)', 66.67, 0.5, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 51, 'numeric', 'An investor buys at AED 1,000,000 and sells at AED 1,250,000. What is the ROI on the purchase price, in %? (type the number)', 25, 0.1, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 52, 'mcq', 'An investor buys at AED 2,000,000 and sells at AED 2,600,000. What is the ROI on the purchase price?', '[{"key":"A","text":"20%"},{"key":"B","text":"25%"},{"key":"C","text":"30%"},{"key":"D","text":"60%"}]'::jsonb, 'C', true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 53, 'numeric', 'The one-time 4% DLD fee on a property of AED 2,000,000 is? (type the amount)', 80000, 0, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 54, 'numeric', 'The 4% DLD fee on a property of AED 1,250,000 is? (type the amount)', 50000, 0, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 55, 'mcq', 'The 4% DLD fee on a property of AED 3,000,000 is?', '[{"key":"A","text":"60,000"},{"key":"B","text":"90,000"},{"key":"C","text":"120,000"},{"key":"D","text":"300,000"}]'::jsonb, 'C', true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 56, 'numeric', 'A 20% down payment on a AED 1,500,000 unit is? (type the amount)', 300000, 0, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 57, 'numeric', 'A 10% booking deposit on a AED 2,000,000 unit is? (type the amount)', 200000, 0, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 58, 'numeric', 'On a 60/40 plan for a AED 1,000,000 unit, how much is paid during construction (the 60%)? (type the amount)', 600000, 0, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select id, 59, 'numeric', 'A unit is AED 1,200,000 for 800 sq ft. What is the price per sq ft, in AED? (type the amount)', 1500, 0, true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';
insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select id, 60, 'mcq', 'To assign before handover a buyer must have paid 40% of a AED 2,000,000 unit. How much is that?', '[{"key":"A","text":"400,000"},{"key":"B","text":"600,000"},{"key":"C","text":"800,000"},{"key":"D","text":"1,000,000"}]'::jsonb, 'C', true from public.quizzes where title = 'Junior Test — Dubai Off-Plan';

