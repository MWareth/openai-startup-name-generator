-- ============================================================================
-- 0041 — In-browser avatar recordings.
-- ----------------------------------------------------------------------------
-- The avatar setup used to be: record on your phone, upload to Google Drive,
-- paste the link into WhatsApp. This lets the person record inside the Studio
-- page with a teleprompter and have the file land here directly.
--
-- The bucket is PRIVATE. Recordings are people's faces and voices given under a
-- likeness consent, so they are never publicly readable — admins reach them
-- through a short-lived signed URL generated server-side.
-- Run in the Supabase SQL editor. Idempotent.
-- ============================================================================

insert into storage.buckets (id, name, public)
values ('avatar-recordings', 'avatar-recordings', false)
on conflict (id) do nothing;

-- Where the person's own recording lives, so the Studio can show it back to
-- them and an admin can review it.
alter table public.avatar_profiles add column if not exists recording_path text;
alter table public.avatar_profiles add column if not exists recorded_at timestamptz;

-- Each person may write only into their own folder (<user_id>/…). Reads are
-- server-side via the service role, so no select policy is granted here.
drop policy if exists avatar_rec_insert_own on storage.objects;
create policy avatar_rec_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatar-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Re-recording replaces the previous take.
drop policy if exists avatar_rec_update_own on storage.objects;
create policy avatar_rec_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatar-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists avatar_rec_read_own on storage.objects;
create policy avatar_rec_read_own on storage.objects
  for select to authenticated
  using (
    bucket_id = 'avatar-recordings'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
