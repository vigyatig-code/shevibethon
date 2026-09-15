/*
# Create complaint-photos storage bucket

## Purpose
Create a public storage bucket named `complaint-photos` where complaint
photos uploaded by users are stored. The bucket is public so that photo
URLs can be displayed in the complaint detail and bulletin board without
additional signed-URL logic.

## Changes
- Insert a row into `storage.buckets` for `complaint-photos` (public = true).
- Grant storage CRUD to `anon` and `authenticated` roles via policies.

## Security
- SELECT (read) policy: anyone can view complaint photos (public bucket).
- INSERT (upload) policy: anyone can upload a complaint photo.
- UPDATE/DELETE policies: not created — photos are immutable once uploaded,
  matching the immutability of the complaint itself.

## Notes
1. Uses `storage.buckets` and `storage.objects` — standard Supabase Storage tables.
2. Safe to re-run (DROP POLICY IF EXISTS + CREATE POLICY, INSERT ... ON CONFLICT).
3. File size limits and type restrictions are enforced client-side in the form.
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('complaint-photos', 'complaint-photos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_read_complaint_photos" ON storage.objects;
CREATE POLICY "anon_read_complaint_photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'complaint-photos');

DROP POLICY IF EXISTS "anon_upload_complaint_photos" ON storage.objects;
CREATE POLICY "anon_upload_complaint_photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'complaint-photos');