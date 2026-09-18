/*
# Wallet-based sign-in tables

1. New Tables
- `wallet_nonces`: stores per-address nonce challenges for SIWE verification.
  - `address` (text, primary key) — Ethereum wallet address, lowercased.
  - `nonce` (text, not null) — UUID nonce to be signed by the wallet.
  - `created_at` (timestamptz, default now()) — used for 5-minute TTL enforcement.
- `profiles`: links wallet addresses to Supabase auth users.
  - `id` (uuid, primary key) — synthetic profile ID.
  - `user_id` (uuid, unique, references auth.users on delete cascade) — the auth user.
  - `wallet_address` (text, unique, not null) — the Ethereum address.
  - `verified_at` (timestamptz) — when the wallet was verified.
  - `created_at` (timestamptz, default now()).

2. Security
- RLS enabled on both tables.
- `wallet_nonces`: no policies — access is exclusively via the service-role key in edge functions (nonce generation + verification). The anon key cannot read or write nonces directly.
- `profiles`: authenticated users can read and update their own profile row (auth.uid() = user_id).
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