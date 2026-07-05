-- ============================================================================
-- 0022 — KPIs: categorised criteria + N/A + score out of 100.
-- ----------------------------------------------------------------------------
-- Renames the review model to a KPI scorecard. Criteria are grouped into five
-- categories (A-E). Each criterion is rated 1-5 stars or marked N/A (excluded).
-- The overall score is out of 100 with EQUAL WEIGHT PER CATEGORY (each of the
-- five categories present counts 20). Management-only, like before.
-- Run in the Supabase SQL editor AFTER 0012. Idempotent.
-- ============================================================================

-- New columns: which category a criterion belongs to, and a short hint.
alter table public.review_criteria add column if not exists category text;
alter table public.review_criteria add column if not exists hint text;

-- Retire the legacy (uncategorised) criteria — kept for history, hidden from
-- new scorecards. The new KPI criteria below carry a category.
update public.review_criteria set active = false where category is null;

-- Seed the KPI criteria (idempotent: only inserts a label that is missing).

-- Conduct & Attitude
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Attendance', 'In office, present daily', 'Conduct & Attitude', 10, false, true
where not exists (select 1 from public.review_criteria where label = 'Attendance' and category = 'Conduct & Attitude');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Punctuality', 'On time for huddle, meetings, calls', 'Conduct & Attitude', 20, false, true
where not exists (select 1 from public.review_criteria where label = 'Punctuality' and category = 'Conduct & Attitude');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Discipline & office conduct', 'Professionalism, desk, dress', 'Conduct & Attitude', 30, false, true
where not exists (select 1 from public.review_criteria where label = 'Discipline & office conduct' and category = 'Conduct & Attitude');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Engagement & attitude', 'Energy, participation, ownership', 'Conduct & Attitude', 40, false, true
where not exists (select 1 from public.review_criteria where label = 'Engagement & attitude' and category = 'Conduct & Attitude');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Coachability', 'Takes feedback and actually improves', 'Conduct & Attitude', 50, false, true
where not exists (select 1 from public.review_criteria where label = 'Coachability' and category = 'Conduct & Attitude');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Reliability', 'Does what he says, hits deadlines', 'Conduct & Attitude', 60, false, true
where not exists (select 1 from public.review_criteria where label = 'Reliability' and category = 'Conduct & Attitude');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Team contribution', 'Helps others, shares knowledge / leads', 'Conduct & Attitude', 70, false, true
where not exists (select 1 from public.review_criteria where label = 'Team contribution' and category = 'Conduct & Attitude');

-- Activity & Effort
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Developer database', 'Developers added on the web form', 'Activity & Effort', 80, false, true
where not exists (select 1 from public.review_criteria where label = 'Developer database' and category = 'Activity & Effort');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Sales-centre / developer visits', 'Logged on the tracker', 'Activity & Effort', 90, false, true
where not exists (select 1 from public.review_criteria where label = 'Sales-centre / developer visits' and category = 'Activity & Effort');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Cold calling', 'Dials + qualified buyer conversations', 'Activity & Effort', 100, false, true
where not exists (select 1 from public.review_criteria where label = 'Cold calling' and category = 'Activity & Effort');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'CRM hygiene', 'Leads logged with notes + next step, not messy', 'Activity & Effort', 110, false, true
where not exists (select 1 from public.review_criteria where label = 'CRM hygiene' and category = 'Activity & Effort');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Lead response speed', 'How fast he acts on a new lead', 'Activity & Effort', 120, false, true
where not exists (select 1 from public.review_criteria where label = 'Lead response speed' and category = 'Activity & Effort');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Launch / event attendance', 'Shows up where deals happen', 'Activity & Effort', 130, false, true
where not exists (select 1 from public.review_criteria where label = 'Launch / event attendance' and category = 'Activity & Effort');

-- Content & Personal Brand
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Video & content presence', 'Videos shot + posts published', 'Content & Personal Brand', 140, false, true
where not exists (select 1 from public.review_criteria where label = 'Video & content presence' and category = 'Content & Personal Brand');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Content quality / improvement', 'Hook, flow, editing getting better', 'Content & Personal Brand', 150, false, true
where not exists (select 1 from public.review_criteria where label = 'Content quality / improvement' and category = 'Content & Personal Brand');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'On-camera confidence', 'Comfort and delivery on video', 'Content & Personal Brand', 160, false, true
where not exists (select 1 from public.review_criteria where label = 'On-camera confidence' and category = 'Content & Personal Brand');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Posting consistency', 'Hits the weekly cadence, no gaps', 'Content & Personal Brand', 170, false, true
where not exists (select 1 from public.review_criteria where label = 'Posting consistency' and category = 'Content & Personal Brand');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Engagement growth', 'Views / followers / DMs trending up', 'Content & Personal Brand', 180, false, true
where not exists (select 1 from public.review_criteria where label = 'Engagement growth' and category = 'Content & Personal Brand');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Uses the AI stack', 'Scripts, CapCut, ElevenLabs, roleplay', 'Content & Personal Brand', 190, false, true
where not exists (select 1 from public.review_criteria where label = 'Uses the AI stack' and category = 'Content & Personal Brand');

-- Knowledge & Skill
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Product knowledge', 'Projects, payment plans, ROI, handover', 'Knowledge & Skill', 200, false, true
where not exists (select 1 from public.review_criteria where label = 'Product knowledge' and category = 'Knowledge & Skill');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Market knowledge', 'Areas, developers, supply / price trends', 'Knowledge & Skill', 210, false, true
where not exists (select 1 from public.review_criteria where label = 'Market knowledge' and category = 'Knowledge & Skill');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Pitch & presentation', 'Role-play score with you', 'Knowledge & Skill', 220, false, true
where not exists (select 1 from public.review_criteria where label = 'Pitch & presentation' and category = 'Knowledge & Skill');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Objection handling', 'Holds up under pushback', 'Knowledge & Skill', 230, false, true
where not exists (select 1 from public.review_criteria where label = 'Objection handling' and category = 'Knowledge & Skill');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Quiz / study scores', 'Project study, Property Monitor test', 'Knowledge & Skill', 240, false, true
where not exists (select 1 from public.review_criteria where label = 'Quiz / study scores' and category = 'Knowledge & Skill');

-- Results & Pipeline
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Pipeline & buyer leads', 'Interest conversations, EOIs', 'Results & Pipeline', 250, false, true
where not exists (select 1 from public.review_criteria where label = 'Pipeline & buyer leads' and category = 'Results & Pipeline');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Buyer meetings booked', 'Conversations that turn into meetings', 'Results & Pipeline', 260, false, true
where not exists (select 1 from public.review_criteria where label = 'Buyer meetings booked' and category = 'Results & Pipeline');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'EOIs secured', 'Real booking-stage interest', 'Results & Pipeline', 270, false, true
where not exists (select 1 from public.review_criteria where label = 'EOIs secured' and category = 'Results & Pipeline');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Bookings / units sold', 'Month 2 onward', 'Results & Pipeline', 280, true, true
where not exists (select 1 from public.review_criteria where label = 'Bookings / units sold' and category = 'Results & Pipeline');
insert into public.review_criteria (label, hint, category, sort_order, auto_from_target, active)
select 'Follow-up / nurture discipline', 'Keeps warm buyers alive', 'Results & Pipeline', 290, false, true
where not exists (select 1 from public.review_criteria where label = 'Follow-up / nurture discipline' and category = 'Results & Pipeline');

