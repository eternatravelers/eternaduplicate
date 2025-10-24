/*
  # Fix User Profiles Sync and Setup Trigger

  ## Problem
  - Table user_profiles exists with 2 records
  - Table auth.users has 6 users
  - Missing trigger to auto-sync new users to user_profiles
  - 4 users are not synced to user_profiles table

  ## Solution
  1. Drop existing sync function if exists
  2. Create new sync_user_to_profile function with proper logic
  3. Create trigger on auth.users (INSERT and UPDATE)
  4. Sync all existing users from auth.users to user_profiles
  5. Ensure proper role mapping from user_metadata and app_metadata

  ## Security
  - Function uses SECURITY DEFINER to allow inserting into user_profiles
  - Maintains existing RLS policies on user_profiles
*/

-- Drop existing function if exists
DROP FUNCTION IF EXISTS sync_user_to_profile() CASCADE;

-- Create sync function
CREATE OR REPLACE FUNCTION sync_user_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_profiles (
    id, 
    user_id, 
    email, 
    full_name, 
    company_name, 
    phone, 
    role, 
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name',
      NEW.email
    ),
    NEW.raw_user_meta_data->>'company_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(
      NEW.raw_user_meta_data->>'role',
      NEW.raw_app_meta_data->>'role',
      'admin'
    ),
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
    company_name = COALESCE(EXCLUDED.company_name, user_profiles.company_name),
    phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
    role = EXCLUDED.role,
    updated_at = EXCLUDED.updated_at;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_to_profile();

-- Sync all existing users from auth.users to user_profiles
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT 
      id,
      email,
      raw_user_meta_data,
      raw_app_meta_data,
      created_at,
      updated_at
    FROM auth.users
  LOOP
    INSERT INTO user_profiles (
      id,
      user_id,
      email,
      full_name,
      company_name,
      phone,
      role,
      created_at,
      updated_at
    )
    VALUES (
      user_record.id,
      user_record.id,
      user_record.email,
      COALESCE(
        user_record.raw_user_meta_data->>'full_name',
        user_record.raw_user_meta_data->>'name',
        user_record.email
      ),
      user_record.raw_user_meta_data->>'company_name',
      user_record.raw_user_meta_data->>'phone',
      COALESCE(
        user_record.raw_user_meta_data->>'role',
        user_record.raw_app_meta_data->>'role',
        'admin'
      ),
      user_record.created_at,
      user_record.updated_at
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      email = EXCLUDED.email,
      full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name),
      company_name = COALESCE(EXCLUDED.company_name, user_profiles.company_name),
      phone = COALESCE(EXCLUDED.phone, user_profiles.phone),
      role = EXCLUDED.role,
      updated_at = EXCLUDED.updated_at;
  END LOOP;
END $$;
