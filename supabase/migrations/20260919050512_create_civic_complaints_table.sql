/*
# Create civic_complaints table with auto-classification and warranty tracking

## Purpose
A new infrastructure complaint tracking table that supports:
- Ticket numbering (auto-incrementing starting at 1000)
- Geo-located complaints with duplicate detection within 30 metres
- Repair warranty tracking (60 days post-close)
- Automatic classification: new, duplicate, probable_repair_failure
- Automatic re-opening of closed complaints when a repeat failure is reported nearby

## New Tables
- `civic_complaints`
  - `id` (uuid, primary key) — internal unique identifier
  - `ticket_no` (integer, auto-incrementing, unique) — public-facing ticket number
  - `filed_by` (uuid, nullable, references auth.users) — the logged-in user who filed
  - `category` (text, not null, default 'water_leak') — category of complaint
  - `title` (text, not null) — short summary of the issue
  - `description` (text, nullable) — detailed description
  - `latitude` (double precision, not null) — latitude of complaint location
  - `longitude` (double precision, not null) — longitude of complaint location
  - `address` (text, nullable) — human-readable address
  - `asset_id` (text, nullable) — pipe segment / asset identifier
  - `status` (text, not null, default 'open') — open, in_progress, closed, reopened
  - `contractor_id` (uuid, nullable) — contractor assigned to the repair
  - `filed_at` (timestamptz, default now()) — when the complaint was filed
  - `closed_at` (timestamptz, nullable) — when the complaint was closed
  - `warranty_until` (timestamptz, nullable) — warranty expiry (closed_at + 60 days)
  - `classification` (text, not null, default 'new') — new, probable_repair_failure, duplicate
  - `linked_complaint_id` (uuid, nullable, self-referencing FK) — link to original complaint
  - `evidence_urls` (text[], nullable) — array of evidence photo URLs
  - `evidence_hash` (text, nullable) — hash of evidence for integrity verification

## Triggers
1. `trg_assign_ticket_no` — BEFORE INSERT: auto-assigns the next sequential ticket number.
2. `trg_classify_new_complaint` — BEFORE INSERT: checks for nearby complaints of the same
   category within 30 metres. If an open one exists, marks the new complaint as
   'duplicate'. If a closed one is still under warranty, marks it as
   'probable_repair_failure', links it, and reopens the old complaint.
3. `trg_set_closed_warranty` — BEFORE UPDATE: when status changes to 'closed', sets
   closed_at to now() and warranty_until to 60 days later.

## Security
- RLS enabled on civic_complaints.
- SELECT: anyone (anon + authenticated) can read — public dashboard.
- INSERT: only authenticated users can insert.
- UPDATE/DELETE: authenticated users only (for status changes by staff).

## Notes
1. The ticket_no sequence starts at 1000 for a clean public-facing number.
2. Duplicate detection uses the haversine formula with a 30-metre radius.
3. Warranty period is 60 days from closed_at.
4. The existing `complaints` table is untouched — this is a separate table.
*/

-- Create sequence first (table DEFAULT references it)
CREATE SEQUENCE IF NOT EXISTS civic_complaints_ticket_seq START 1000;

CREATE TABLE IF NOT EXISTS civic_complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no integer UNIQUE NOT NULL DEFAULT nextval('civic_complaints_ticket_seq'),
  filed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'water_leak',
  title text NOT NULL,
  description text,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  address text,
  asset_id text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed', 'reopened')),
  contractor_id uuid,
  filed_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  warranty_until timestamptz,
  classification text NOT NULL DEFAULT 'new' CHECK (classification IN ('new', 'probable_repair_failure', 'duplicate')),
  linked_complaint_id uuid REFERENCES civic_complaints(id) ON DELETE SET NULL,
  evidence_urls text[],
  evidence_hash text
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_civic_complaints_status ON civic_complaints (status);
CREATE INDEX IF NOT EXISTS idx_civic_complaints_category ON civic_complaints (category);
CREATE INDEX IF NOT EXISTS idx_civic_complaints_filed_at ON civic_complaints (filed_at DESC);
CREATE INDEX IF NOT EXISTS idx_civic_complaints_filed_by ON civic_complaints (filed_by);
CREATE INDEX IF NOT EXISTS idx_civic_complaints_classification ON civic_complaints (classification);

-- Enable RLS
ALTER TABLE civic_complaints ENABLE ROW LEVEL SECURITY;

-- Policies: anyone can read, only authenticated can insert
DROP POLICY IF EXISTS "public_select_civic_complaints" ON civic_complaints;
CREATE POLICY "public_select_civic_complaints"
  ON civic_complaints FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "auth_insert_civic_complaints" ON civic_complaints;
CREATE POLICY "auth_insert_civic_complaints"
  ON civic_complaints FOR INSERT
  TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "auth_update_civic_complaints" ON civic_complaints;
CREATE POLICY "auth_update_civic_complaints"
  ON civic_complaints FOR UPDATE
  TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "auth_delete_civic_complaints" ON civic_complaints;
CREATE POLICY "auth_delete_civic_complaints"
  ON civic_complaints FOR DELETE
  TO authenticated USING (true);

-- =============================================
-- Trigger 1: Auto-assign ticket_no on insert
-- =============================================
CREATE OR REPLACE FUNCTION assign_ticket_no()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.ticket_no IS NULL OR NEW.ticket_no = 0 THEN
    NEW.ticket_no := nextval('civic_complaints_ticket_seq');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_ticket_no ON civic_complaints;
CREATE TRIGGER trg_assign_ticket_no
  BEFORE INSERT ON civic_complaints
  FOR EACH ROW
  EXECUTE FUNCTION assign_ticket_no();

-- =============================================
-- Trigger 2: Classify new complaint on insert
-- Checks for nearby complaints of same category within 30 metres.
-- If open one exists → mark as 'duplicate'.
-- If closed one under warranty exists → mark as 'probable_repair_failure',
--   link it, and reopen the old complaint.
-- =============================================
CREATE OR REPLACE FUNCTION classify_new_complaint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  nearby_record RECORD;
  earth_radius_m double precision := 6371000.0;
BEGIN
  IF NEW.latitude IS NULL OR NEW.longitude IS NULL THEN
    RETURN NEW;
  END IF;

  -- Find the nearest complaint of the same category within 30 metres
  SELECT * INTO nearby_record
  FROM civic_complaints c
  WHERE c.category = NEW.category
    AND c.latitude IS NOT NULL
    AND c.longitude IS NOT NULL
    AND (
      earth_radius_m *
      2 *
      atan2(
        sqrt(
          power(sin(radians(c.latitude - NEW.latitude) / 2), 2) +
          cos(radians(NEW.latitude)) * cos(radians(c.latitude)) *
          power(sin(radians(c.longitude - NEW.longitude) / 2), 2)
        ),
        sqrt(1 - (
          power(sin(radians(c.latitude - NEW.latitude) / 2), 2) +
          cos(radians(NEW.latitude)) * cos(radians(c.latitude)) *
          power(sin(radians(c.longitude - NEW.longitude) / 2), 2)
        ))
      )
    ) <= 30
  ORDER BY (
    earth_radius_m *
    2 *
    atan2(
      sqrt(
        power(sin(radians(c.latitude - NEW.latitude) / 2), 2) +
        cos(radians(NEW.latitude)) * cos(radians(c.latitude)) *
        power(sin(radians(c.longitude - NEW.longitude) / 2), 2)
      ),
      sqrt(1 - (
        power(sin(radians(c.latitude - NEW.latitude) / 2), 2) +
        cos(radians(NEW.latitude)) * cos(radians(c.latitude)) *
        power(sin(radians(c.longitude - NEW.longitude) / 2), 2)
      ))
    )
  ) ASC
  LIMIT 1;

  IF nearby_record.id IS NOT NULL THEN
    IF nearby_record.status IN ('open', 'in_progress', 'reopened') THEN
      NEW.classification := 'duplicate';
      NEW.linked_complaint_id := nearby_record.id;
    ELSIF nearby_record.status = 'closed'
          AND nearby_record.warranty_until IS NOT NULL
          AND nearby_record.warranty_until > now() THEN
      NEW.classification := 'probable_repair_failure';
      NEW.linked_complaint_id := nearby_record.id;
      -- Reopen the old complaint
      UPDATE civic_complaints
      SET status = 'reopened', closed_at = NULL
      WHERE id = nearby_record.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_classify_new_complaint ON civic_complaints;
CREATE TRIGGER trg_classify_new_complaint
  BEFORE INSERT ON civic_complaints
  FOR EACH ROW
  EXECUTE FUNCTION classify_new_complaint();

-- =============================================
-- Trigger 3: Set closed_at and warranty_until on close
-- =============================================
CREATE OR REPLACE FUNCTION set_closed_warranty()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'closed' AND (OLD.status IS DISTINCT FROM 'closed' OR NEW.closed_at IS NULL) THEN
    NEW.closed_at := now();
    NEW.warranty_until := now() + INTERVAL '60 days';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_closed_warranty ON civic_complaints;
CREATE TRIGGER trg_set_closed_warranty
  BEFORE UPDATE ON civic_complaints
  FOR EACH ROW
  EXECUTE FUNCTION set_closed_warranty();

-- Grant sequence usage
GRANT USAGE ON SEQUENCE civic_complaints_ticket_seq TO anon, authenticated;