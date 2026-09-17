/*
# Allow anonymous complaint filing (remove auth gate)

1. Security changes
- DROP the `insert_own_complaints` policy that restricted inserts to authenticated users only.
- CREATE a new `anon_insert_complaints` policy allowing both anon and authenticated roles to insert complaints.
  This restores the original behavior where anyone can report an issue without signing in.
- SELECT policy stays open to anon + authenticated (unchanged — anyone can browse complaints).

2. Important Notes
- The `user_id` column remains on the table (added in a previous migration) but is now optional/nullable.
  Anonymous complaints will have NULL user_id, which is fine.
- No data is lost — only the insert policy changes.
*/

DROP POLICY IF EXISTS "insert_own_complaints" ON complaints;

CREATE POLICY "anon_insert_complaints"
  ON complaints FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
