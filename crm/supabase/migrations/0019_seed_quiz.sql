-- ============================================================================
-- 0019 — Seed the Junior Week-2 training quiz (25 questions). Run AFTER 0018.
-- Idempotent: only seeds if this quiz title doesn't already exist.
-- ============================================================================
insert into public.quizzes (title, description, time_limit_minutes, pass_mark)
select 'Junior Week-2 Test — Dubai Off-Plan', '25 questions, 15 minutes. Covers the New Agent Program (Dubai off-plan) plus commission & ROI calculations.', 15, 0.7
where not exists (select 1 from public.quizzes where title = 'Junior Week-2 Test — Dubai Off-Plan');

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 1, 'mcq', 'In which year''s decree could foreigners first own freehold property in Dubai?', '[{"key": "A", "text": "1996"}, {"key": "B", "text": "2002"}, {"key": "C", "text": "2008"}, {"key": "D", "text": "2014"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 1);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 2, 'mcq', 'What is the key difference between freehold and leasehold?', '[{"key": "A", "text": "Freehold is cheaper"}, {"key": "B", "text": "Freehold is full, permanent ownership including the land; leasehold is a long, time-limited right to use"}, {"key": "C", "text": "They are the same"}, {"key": "D", "text": "Leasehold lasts forever"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 2);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 3, 'mcq', 'An investor sells a Dubai property for AED 1.2M profit. How much capital gains tax do they pay?', '[{"key": "A", "text": "AED 240,000"}, {"key": "B", "text": "AED 120,000"}, {"key": "C", "text": "AED 0"}, {"key": "D", "text": "AED 48,000"}]'::jsonb, 'C', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 3);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 4, 'mcq', 'Compared with the UK, France or India, Dubai''s standout advantage for property investors is…', '[{"key": "A", "text": "Cheaper flights"}, {"key": "B", "text": "Zero capital gains and rental income tax"}, {"key": "C", "text": "Bigger apartments"}, {"key": "D", "text": "Colder weather"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 4);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 5, 'mcq', 'Dubai has two regulators. Which statement is correct?', '[{"key": "A", "text": "DLD builds the towers; RERA sells them"}, {"key": "B", "text": "DLD records ownership & issues title deeds; RERA licenses agents and enforces the rules"}, {"key": "C", "text": "They both only collect taxes"}, {"key": "D", "text": "RERA owns all the land"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 5);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 6, 'mcq', 'Why did Dubai introduce the escrow law in 2007?', '[{"key": "A", "text": "To raise taxes"}, {"key": "B", "text": "To protect buyers after some developers took money and never finished projects"}, {"key": "C", "text": "To slow down sales"}, {"key": "D", "text": "To help banks"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 6);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 7, 'mcq', 'If an off-plan project is cancelled, where do buyers'' refunds come from?', '[{"key": "A", "text": "The developer''s marketing budget"}, {"key": "B", "text": "The protected escrow account"}, {"key": "C", "text": "The buyer''s own savings"}, {"key": "D", "text": "Nowhere"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 7);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 8, 'mcq', 'How does the Oqood register protect a buyer?', '[{"key": "A", "text": "It pays their deposit"}, {"key": "B", "text": "It registers the sale so the same unit can''t be sold twice"}, {"key": "C", "text": "It builds the property"}, {"key": "D", "text": "It removes the 4% fee"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 8);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 9, 'mcq', 'Before a developer can sell a single off-plan unit, they must first…', '[{"key": "A", "text": "Finish the building"}, {"key": "B", "text": "Own the land and get RERA approval and a project escrow account"}, {"key": "C", "text": "Sell it to a bank"}, {"key": "D", "text": "Wait ten years"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 9);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 10, 'mcq', 'Why is a 2026 slowdown unlikely to look like the 2008 crash?', '[{"key": "A", "text": "Because prices never change"}, {"key": "B", "text": "Because escrow, Golden-Visa residents and a cash-heavy market make it far more stable"}, {"key": "C", "text": "Because Dubai banned selling"}, {"key": "D", "text": "Because off-plan was abolished"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 10);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 11, 'mcq', 'Roughly what share of Dubai home sales today are off-plan?', '[{"key": "A", "text": "About 10%"}, {"key": "B", "text": "About 30%"}, {"key": "C", "text": "About 50%"}, {"key": "D", "text": "About 70%"}]'::jsonb, 'D', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 11);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 12, 'mcq', 'DLD records ownership. What does RERA mainly do?', '[{"key": "A", "text": "Builds the towers"}, {"key": "B", "text": "Regulates brokers, developers, escrow and rentals \u2014 and enforces the rules"}, {"key": "C", "text": "Sells the units"}, {"key": "D", "text": "Sets property prices"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 12);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 13, 'mcq', 'For a rent increase, how much notice must a landlord give, and what governs the amount?', '[{"key": "A", "text": "7 days, landlord decides"}, {"key": "B", "text": "90 days, the RERA Rental Index"}, {"key": "C", "text": "No notice, any amount"}, {"key": "D", "text": "30 days, the bank"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 13);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 14, 'mcq', 'Within how long must an off-plan sale be registered on Oqood after the SPA is signed?', '[{"key": "A", "text": "24 hours"}, {"key": "B", "text": "About 90 days"}, {"key": "C", "text": "5 years"}, {"key": "D", "text": "Never"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 14);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 15, 'mcq', 'What must appear on every property advertisement you post?', '[{"key": "A", "text": "Your home address"}, {"key": "B", "text": "A valid Trakheesi permit number"}, {"key": "C", "text": "The buyer''s passport"}, {"key": "D", "text": "Nothing"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 15);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 16, 'mcq', 'A buyer wants a whole master-planned community from a proven name. Which developer tier fits best?', '[{"key": "A", "text": "Tier A (e.g. Emaar, Sobha)"}, {"key": "B", "text": "Tier B (e.g. Imtiaz)"}, {"key": "C", "text": "Tier C (e.g. Samana)"}, {"key": "D", "text": "None"}]'::jsonb, 'A', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 16);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 17, 'mcq', 'What''s the most important factor when judging any developer''s project?', '[{"key": "A", "text": "The brochure"}, {"key": "B", "text": "Their track record of on-time, quality handovers"}, {"key": "C", "text": "The lobby colour"}, {"key": "D", "text": "The launch party"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 17);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 18, 'mcq', 'Why does a Dubai building carry an annual service charge?', '[{"key": "A", "text": "It''s a hidden tax"}, {"key": "B", "text": "It pays to run and maintain the shared areas \u2014 security, cleaning, pools, lifts"}, {"key": "C", "text": "It pays the agent"}, {"key": "D", "text": "It''s optional"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 18);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 19, 'mcq', 'When is escrow money released to the developer?', '[{"key": "A", "text": "All at once when the SPA is signed"}, {"key": "B", "text": "Only as each construction milestone is certified as complete"}, {"key": "C", "text": "Whenever the developer asks"}, {"key": "D", "text": "Never"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 19);

insert into public.quiz_questions (quiz_id, position, kind, prompt, options, correct_key, is_hard)
select q.id, 20, 'mcq', 'What does the one-time 4% DLD fee actually pay for?', '[{"key": "A", "text": "The agent''s commission"}, {"key": "B", "text": "Registering ownership and issuing the official title"}, {"key": "C", "text": "The service charge"}, {"key": "D", "text": "The mortgage"}]'::jsonb, 'B', false
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 20);

insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select q.id, 21, 'numeric', 'A deal closes at AED 2,000,000 with a 4% gross commission. What is the GROSS commission, in AED? (enter the number only)', 80000, 0, true
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 21);

insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select q.id, 22, 'numeric', 'The gross commission on a deal is AED 80,000. A JUNIOR agent''s split is 50/50. What is the agent''s share, in AED?', 40000, 0, true
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 22);

insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select q.id, 23, 'numeric', 'The gross commission is AED 100,000. A SENIOR agent''s split is 55/45 (agent/company). What is the agent''s share, in AED?', 55000, 0, true
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 23);

insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select q.id, 24, 'numeric', 'A property costs AED 1,500,000 and rents for AED 120,000 per year. What is the gross rental yield, as a percentage? (enter the number only, e.g. 8)', 8, 0.1, true
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 24);

insert into public.quiz_questions (quiz_id, position, kind, prompt, correct_value, tolerance, is_hard)
select q.id, 25, 'numeric', 'An investor buys at AED 1,800,000 and sells at AED 3,000,000. What is the return (ROI) on the purchase price, as a percentage? (round to 2 decimals)', 66.67, 0.5, true
from public.quizzes q where q.title = 'Junior Week-2 Test — Dubai Off-Plan'
  and not exists (select 1 from public.quiz_questions x where x.quiz_id = q.id and x.position = 25);
