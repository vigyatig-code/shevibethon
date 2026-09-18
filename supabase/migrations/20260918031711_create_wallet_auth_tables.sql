/*
# Create wallet authentication tables

1. New Tables
- `wallet_nonces`: Stores per-address nonce values used for wallet-based sign-in.
  - `address` (text, primary key, lowercased wallet address)
  - `nonce` (text, not null, UUID nonce)
  - `created_at` (timestamptz, defaults to now())
- `profiles`: Maps wallet addresses to Supabase auth users.
  - `id` (uuid, primary key)
  - `user_id` (uuid, unique, references auth.users, cascade on delete)
  - `wallet_address` (text, unique, not null)
  - `verified_at` (timestamptz, nullable)
  - `created_at` (timestamptz, defaults to now())

2. Security
- Enable RLS on both tables.
- `wallet_nonces`: No policies — only the service role (edge functions) can read/write.
- `profiles`: SELECT and UPDATE policies for authenticated users to access their own profile row (auth.uid() = user_id).
*/

CREATE TABLE IF NOT EXISTS public.wallet_nonces (
  address    text primary key,
  nonce      text not null,
  created_at timestamptz not null default now()
);

ALTER TABLE public.wallet_nonces ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.profiles (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid unique references auth.users(id) on delete cascade,
  wallet_address text unique not null,
  verified_at   timestamptz,
  created_at    timestamptz not null default now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
