/*
# Gate complaint filing behind authentication

1. Changes to existing tables
- `complaints`: add `user_id` column (uuid, nullable, defaults to auth.uid())
  This links each complaint to the authenticated user who filed it.

2. Security changes
- DROP the existing anon_insert_complaints policy (allowed anon + authenticated).
- CREATE new insert_own_complaints policy: only authenticated users can insert,
  and the user_id must match their own auth.uid().
- SELECT policy stays open to anon + authenticated (anyone can browse complaints).

3. Important Notes
- Existing complaints will have NULL user_id (they were filed anonymously before).
- New complaints will automatically get the authenticated user's ID.
- The frontend will redirect unauthenticated users to the sign-in flow
  before they can access the complaint form.
*/

ALTER TABLE complaints
  ADD COLUMN IF NOT EXISTS user_id uuid DEFAULT auth.uid();

DROP POLICY IF EXISTS "anon_insert_complaints" ON complaints;
CREATE POLICY "insert_own_complaints"
  ON complaints FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
