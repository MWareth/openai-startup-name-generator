-- ============================================================================
-- 0031 — Storage bucket for Content Studio brochure uploads.
-- ----------------------------------------------------------------------------
-- Files upload straight from the browser to Supabase Storage (bypassing
-- Vercel's ~4.5MB request limit), the server reads them with the service role,
-- and deletes them after the script is generated. Run in the Supabase SQL
-- editor. Idempotent.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('brochures', 'brochures', false)
on conflict (id) do nothing;

-- Any signed-in user may upload into the bucket; reads/deletes happen
-- server-side with the service role (bypasses RLS).
drop policy if exists "brochures_upload" on storage.objects;
create policy "brochures_upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'brochures');
