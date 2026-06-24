-- ============================================================================
-- Estate CRM — duplicate lead detection
-- Run this in the Supabase SQL editor AFTER 0003.
-- ============================================================================

-- Returns an existing lead (if any) whose email matches (case-insensitive) or
-- whose phone matches on the last 9 digits (so +9715... and 05... still match).
-- SECURITY DEFINER so it can see leads owned by other agents — it only reveals
-- that a duplicate exists and who it's assigned to, not the full record.
create or replace function public.find_duplicate_lead(p_phone text, p_email text)
returns table (
  lead_id         uuid,
  lead_name       text,
  match_on        text,
  assigned_to     text,
  created_by_name text
)
language sql
security definer
stable
set search_path = public
as $$
  with norm as (
    select
      nullif(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g'), '') as phone_digits,
      nullif(lower(trim(coalesce(p_email, ''))), '')                        as email_norm
  )
  select
    l.id,
    l.name,
    case
      when n.email_norm is not null and lower(trim(l.email)) = n.email_norm then 'email'
      else 'phone number'
    end as match_on,
    a.full_name as assigned_to,
    c.full_name as created_by_name
  from public.leads l
  cross join norm n
  left join public.profiles a on a.id = l.assigned_agent_id
  left join public.profiles c on c.id = l.created_by
  where
    (n.email_norm is not null and lower(trim(l.email)) = n.email_norm)
    or (
      n.phone_digits is not null
      and length(n.phone_digits) >= 7
      and right(regexp_replace(coalesce(l.phone, ''), '[^0-9]', '', 'g'), 9) = right(n.phone_digits, 9)
    )
  order by l.created_at asc
  limit 1;
$$;

grant execute on function public.find_duplicate_lead(text, text) to authenticated;
