/*
# Create user_profiles table for phone auth users

1. New Tables
- `user_profiles`
  - `id` (uuid, primary key, references auth.users)
  - `phone` (text, unique, not null) — the phone number used for OTP sign-in
  - `date_of_birth` (date, nullable) — user's date of birth
  - `gender` (text, nullable) — 'male', 'female', 'non-binary', 'other', or 'rather_not_say'
  - `full_name` (text, nullable) — display name collected during profile completion
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. Security
- Enable RLS on user_profiles.
- Users can only read and update their own profile row (auth.uid() = id).
- INSERT is handled server-side via a SECURITY DEFINER trigger on auth.users,
  so we do NOT grant INSERT to authenticated. Instead, a trigger function
  creates the profile row when a new auth user is created.

3. Trigger
- `handle_new_user` function: after a new user is inserted into auth.users,
  automatically creates a matching row in user_profiles with their phone number.
- This trigger fires on INSERT to auth.users.

4. Important Notes
- The phone column stores the full international phone number (e.g. +919876543210).
- Gender uses a CHECK constraint to only allow valid values.
- The updated_at column is auto-maintained by a trigger.
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'non-binary', 'other', 'rather_not_say')),
  full_name text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON user_profiles;
CREATE POLICY "select_own_profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON user_profiles;
CREATE POLICY "update_own_profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to auto-create a profile row when a new auth user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, NEW.raw_phone_meta_data->>'phone', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger: fires after a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_profiles_updated_at ON user_profiles;
CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();
