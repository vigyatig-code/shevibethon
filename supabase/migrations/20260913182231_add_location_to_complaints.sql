/*
# Add location columns to complaints table

## Purpose
Enable location-based complaint discovery so users can see civic problems
near their current location. When a user files a complaint, they can
optionally share their approximate location (latitude, longitude, and a
human-readable area name). The Nearby Issues feature on the front page
requests geolocation permission and queries complaints within a radius.

## Changes to existing table `complaints`
- `latitude` (double precision, nullable) — approximate latitude of the
  complaint location. NULL when no location was shared.
- `longitude` (double precision, nullable) — approximate longitude of the
  complaint location. NULL when no location was shared.
- `location_name` (text, nullable) — human-readable area or neighborhood
  name provided by the user (e.g. "Indiranagar, Bengaluru"). NULL when
  no location was shared.

## Security
- No changes to existing RLS policies. SELECT and INSERT remain open to
  anon + authenticated. UPDATE and DELETE remain blocked (immutable).
- The new columns are readable by anyone who can SELECT (already allowed).
- The new columns are writable by anyone who can INSERT (already allowed).

## Notes
1. All columns are additive and nullable — no existing data is modified or lost.
2. Location is optional at filing time, so existing and future complaints
   without coordinates are not affected.
3. An index on the location columns is intentionally omitted to keep the
   migration lightweight; the complaints table is not expected to grow
   large enough to require spatial indexing.
*/

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE complaints ADD COLUMN latitude double precision;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE complaints ADD COLUMN longitude double precision;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'location_name'
  ) THEN
    ALTER TABLE complaints ADD COLUMN location_name text;
  END IF;
END $$;