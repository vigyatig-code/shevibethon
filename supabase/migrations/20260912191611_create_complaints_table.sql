/*
# Create complaints table (single-tenant, no auth)

## Purpose
Stores complaints filed by users through the complaint filing website.
Each complaint gets a unique tracking number that users can use to check status.

## New Tables
- `complaints`
  - `id` (uuid, primary key) — internal unique identifier
  - `tracking_number` (text, unique, not null) — public-facing tracking ID shown to users
  - `name` (text, not null) — full name of the person filing the complaint
  - `email` (text, not null) — contact email of the complainant
  - `category` (text, not null) — category of the complaint (e.g. Product Issue, Service, Billing, Other)
  - `subject` (text, not null) — short summary/title of the complaint
  - `description` (text, not null) — detailed description of the complaint
  - `status` (text, not null, default 'Pending') — current status: Pending, Under Review, Resolved, Rejected
  - `priority` (text, not null, default 'Normal') — priority level: Low, Normal, High, Urgent
  - `created_at` (timestamptz, default now()) — when the complaint was filed
  - `updated_at` (timestamptz, default now()) — when the complaint was last modified

## Security
- Enable RLS on `complaints`.
- Allow anon + authenticated to SELECT (so users can track complaints by tracking number).
- Allow anon + authenticated to INSERT (so anyone can file a new complaint).
- Allow anon + authenticated to UPDATE (so status changes can be applied — for now, the app is single-tenant with no admin auth).
- DELETE is restricted to prevent data loss.

## Notes
1. The tracking_number is generated as a human-readable code (e.g. CMP-XXXXXXXX) for easy reference.
2. This is a single-tenant app with no sign-in screen — all policies use TO anon, authenticated.
3. An index on tracking_number enables fast lookups when users check their complaint status.
*/

CREATE TABLE IF NOT EXISTS complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tracking_number text UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  category text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'Pending',
  priority text NOT NULL DEFAULT 'Normal',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_complaints_tracking_number ON complaints (tracking_number);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints (status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints (created_at DESC);

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_complaints" ON complaints;
CREATE POLICY "anon_select_complaints"
  ON complaints FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_complaints" ON complaints;
CREATE POLICY "anon_insert_complaints"
  ON complaints FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_complaints" ON complaints;
CREATE POLICY "anon_update_complaints"
  ON complaints FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);