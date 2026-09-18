/*
# Add upvote count and duplicate detection to complaints

## Purpose
When a user files a complaint near an existing complaint with the same category,
the system should detect the duplicate and offer to upvote the existing
complaint instead of creating a new one. This prevents the same issue from
being recorded multiple times for the same area.

## Changes to existing table `complaints`
- `upvote_count` (integer, not null, default 0) — number of people who
  confirmed this same issue exists in their area. Incremented when a
  duplicate report is detected and the user chooses to upvote.

## New functions
1. `find_duplicate_complaint(p_category text, p_latitude double precision,
   p_longitude double precision, p_radius_meters integer)`
   - SECURITY DEFINER function that searches for existing complaints within
   a configurable radius (default 200 meters) that share the same category.
   - Returns the closest matching complaint with its id, tracking_number,
   subject, category, upvote_count, and distance in meters.
   - Returns NULL if no match found.
   - Uses the haversine formula for distance calculation.
   - Only matches complaints that have coordinates (latitude/longitude not null).
   - Excludes complaints with status 'Rejected'.

2. `upvote_complaint(p_complaint_id uuid)`
   - SECURITY DEFINER function that increments the upvote_count on a
   complaint by 1.
   - Returns the new upvote_count.
   - Needed because the complaints table is immutable (no UPDATE policy
   for anon/authenticated) — only a SECURITY DEFINER function can modify it.

## Security
- Both functions are SECURITY DEFINER so they can bypass the RLS UPDATE
  restriction on complaints. They run with the table owner's privileges.
- `find_duplicate_complaint` is read-only (SELECT only).
- `upvote_complaint` performs a single UPDATE that increments upvote_count
  by 1 — it cannot modify any other column.
- EXECUTE is granted to anon and authenticated so the no-auth frontend
  can call both functions via the Supabase JS client RPC.
- The functions are safe: they only read data and increment a counter.
  They cannot create, delete, or alter complaint records.

## Notes
1. The upvote_count column defaults to 0 so existing complaints are
   unaffected.
2. Duplicate detection only triggers when the user has shared their
   location (latitude + longitude). Complaints without coordinates
   are not matched.
3. The default search radius is 200 meters — close enough to catch the
   same physical issue but not so wide that unrelated nearby complaints
   are flagged as duplicates.
4. The radius is a parameter so the frontend can adjust it if needed.
*/

-- Add upvote_count column
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'complaints' AND column_name = 'upvote_count'
  ) THEN
    ALTER TABLE complaints ADD COLUMN upvote_count integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Function: find nearby duplicate complaint by category + location
CREATE OR REPLACE FUNCTION find_duplicate_complaint(
  p_category text,
  p_latitude double precision,
  p_longitude double precision,
  p_radius_meters integer DEFAULT 200
)
RETURNS TABLE (
  id uuid,
  tracking_number text,
  subject text,
  category text,
  upvote_count integer,
  distance_meters double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  earth_radius_m double precision := 6371000.0;
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.tracking_number,
    c.subject,
    c.category,
    c.upvote_count,
    (
      earth_radius_m *
      2 *
      atan2(
        sqrt(
          power(sin(radians(c.latitude - p_latitude) / 2), 2) +
          cos(radians(p_latitude)) * cos(radians(c.latitude)) *
          power(sin(radians(c.longitude - p_longitude) / 2), 2)
        ),
        sqrt(1 - (
          power(sin(radians(c.latitude - p_latitude) / 2), 2) +
          cos(radians(p_latitude)) * cos(radians(c.latitude)) *
          power(sin(radians(c.longitude - p_longitude) / 2), 2)
        ))
      )
    )::double precision AS distance_meters
  FROM complaints c
  WHERE c.latitude IS NOT NULL
    AND c.longitude IS NOT NULL
    AND c.category = p_category
    AND c.status != 'Rejected'
    AND (
      earth_radius_m *
      2 *
      atan2(
        sqrt(
          power(sin(radians(c.latitude - p_latitude) / 2), 2) +
          cos(radians(p_latitude)) * cos(radians(c.latitude)) *
          power(sin(radians(c.longitude - p_longitude) / 2), 2)
        ),
        sqrt(1 - (
          power(sin(radians(c.latitude - p_latitude) / 2), 2) +
          cos(radians(p_latitude)) * cos(radians(c.latitude)) *
          power(sin(radians(c.longitude - p_longitude) / 2), 2)
        ))
      )
    ) <= p_radius_meters
  ORDER BY distance_meters ASC
  LIMIT 1;
END;
$$;

-- Function: increment upvote count on a complaint
CREATE OR REPLACE FUNCTION upvote_complaint(p_complaint_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_count integer;
BEGIN
  UPDATE complaints
  SET upvote_count = upvote_count + 1
  WHERE id = p_complaint_id
  RETURNING upvote_count INTO new_count;

  IF new_count IS NULL THEN
    RAISE EXCEPTION 'Complaint not found';
  END IF;

  RETURN new_count;
END;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION find_duplicate_complaint(text, double precision, double precision, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION upvote_complaint(uuid) TO anon, authenticated;
