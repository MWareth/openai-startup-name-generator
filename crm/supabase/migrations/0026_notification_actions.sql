-- ============================================================================
-- 0026 — Action-required notifications.
-- ----------------------------------------------------------------------------
-- The bell should drop to 0 once you've SEEN your notifications, EXCEPT for the
-- ones that still need you to do something (a lead assigned but not yet
-- contacted, an SLA breach, an admin "update your leads / upload docs" reminder,
-- a test to take). Those stay lit until the underlying work is done.
--
--   • requires_action = this notification represents outstanding work.
--   • resolved_at     = when that work was actually done (set by the app when
--                       the agent logs activity on the lead / completes the test).
--
-- Bell count = (informational & unread) OR (action-required & unresolved).
-- Run in the Supabase SQL editor AFTER 0013. Idempotent.
-- ============================================================================

alter table public.notifications
  add column if not exists requires_action boolean not null default false;

alter table public.notifications
  add column if not exists resolved_at timestamptz;

-- Backfill: mark existing rows of the action-required types so the bell is
-- consistent for notifications created before this migration.
update public.notifications
   set requires_action = true
 where requires_action = false
   and type in ('lead_assigned', 'lead_sla', 'update_leads', 'deal_docs', 'test_assigned');

-- Fast lookup of a user's still-open action items.
create index if not exists notifications_action_idx
  on public.notifications(user_id, resolved_at)
  where requires_action;
