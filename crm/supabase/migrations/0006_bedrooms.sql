-- ============================================================================
-- Estate CRM — structured bedrooms attribute on leads (for filtering)
-- Run this in the Supabase SQL editor AFTER 0005.
-- ============================================================================

alter table public.leads add column if not exists bedrooms text;
