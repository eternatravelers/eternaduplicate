/*
  # Update user_profiles table for user management

  1. Changes
    - Add email column to user_profiles
    - Update trigger to sync email from auth.users
    - Add indexes for performance
    - Sync existing users with their emails

  2. Security
    - Maintain existing RLS policies
    - Ensure super_admin can manage all user profiles
*/

-- Add email column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'email'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN email text;
  END IF;
END $$;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);

-- Create index on role for filtering
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);

-- Update the sync function to include email
CREATE OR REPLACE FUNCTION sync_user_to_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_profiles (id, user_id, email, full_name, company_name, phone, role, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
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

-- Sync email for existing users
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT u.id, u.email 
    FROM auth.users u
    INNER JOIN user_profiles up ON u.id = up.id
    WHERE up.email IS NULL OR up.email = ''
  LOOP
    UPDATE user_profiles 
    SET email = user_record.email
    WHERE id = user_record.id;
  END LOOP;
END $$;