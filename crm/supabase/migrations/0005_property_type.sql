-- ============================================================================
-- Estate CRM — structured property type on leads (for filtering)
-- Run this in the Supabase SQL editor AFTER 0004.
-- ============================================================================

alter table public.leads add column if not exists property_type text;
