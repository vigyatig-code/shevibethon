/*
# Create news table for cached breaking news

1. New Tables
- `news`: Stores news articles fetched from Google News RSS on a schedule.
  - `id` (uuid, primary key, default gen_random_uuid())
  - `title` (text, not null) — article headline
  - `link` (text, not null, unique) — original article URL, used as upsert conflict key
  - `source` (text) — publisher name (e.g. "The Hindu", "Times of India")
  - `category` (text, not null) — news category: Roads, Water, Sanitation, Electricity, Disasters & Emergencies, General Civic News
  - `published_at` (timestamptz) — article publish date from RSS pubDate
  - `created_at` (timestamptz, default now()) — when the row was inserted

2. Indexes
- `news_category_idx` on `category` for fast category filtering
- `news_published_at_idx` on `published_at DESC` for fast "latest first" ordering

3. Security
- Enable RLS on `news`.
- Public SELECT policy (read-only for everyone, including anon) so the frontend can display news without authentication.
- No INSERT/UPDATE/DELETE policies — only the service role (edge function) can write.
*/

CREATE TABLE IF NOT EXISTS public.news (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  link         text NOT NULL UNIQUE,
  source       text,
  category     text NOT NULL,
  published_at timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS news_category_idx ON public.news (category);
CREATE INDEX IF NOT EXISTS news_published_at_idx ON public.news (published_at DESC);

ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read news" ON public.news;
CREATE POLICY "Public can read news"
  ON public.news FOR SELECT
  TO anon, authenticated
  USING (true);
