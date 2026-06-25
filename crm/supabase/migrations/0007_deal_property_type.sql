-- ============================================================================
-- Estate CRM — record the unit type sold on each closed deal.
-- Run this in the Supabase SQL editor AFTER 0006.
-- ============================================================================

alter table public.deals add column if not exists property_type text;
