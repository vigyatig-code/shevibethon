/*
# Add severity and photo columns to complaints table

## Purpose
1. Add a `severity` column so complaints can be ranked by how serious they are.
   The AI/auto-ranking logic on the frontend will assign one of:
   'Critical', 'High', 'Medium', 'Low'.
2. Add a `photo_url` column to store the Supabase Storage public URL of an
   optional photo the complainant uploads when filing.

## Changes to existing table `complaints`
- `severity` (text, not null, default 'Medium') — severity level used for
  the bulletin board ranking. Values: Critical, High, Medium, Low.
- `photo_url` (text, nullable) — public URL of the uploaded photo in Supabase
  Storage. NULL when no photo was attached.

## Security
- No changes to existing RLS policies. SELECT and INSERT remain open to
  anon + authenticated. UPDATE and DELETE remain blocked (immutable).
- The new columns are readable by anyone who can SELECT (already allowed).
- The new columns are writable by anyone who can INSERT (already allowed).

## Notes
1. Both columns are additive — no existing data is modified or lost.
2. `severity` defaults to 'Medium' so existing rows get a sensible value.
3. `photo_url` is nullable since photos are optional.
4. An index on severity enables efficient ordering on the bulletin board.
5. This migration is safe to re-run (uses DO $$ IF NOT EXISTS blocks).
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'severity'
  ) THEN
    ALTER TABLE complaints ADD COLUMN severity text NOT NULL DEFAULT 'Medium';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'photo_url'
  ) THEN
    ALTER TABLE complaints ADD COLUMN photo_url text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_complaints_severity ON complaints (severity);