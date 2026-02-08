/*
  # Fix User Deactivation for Logged-In Users

  ## Problem
  - Users who have already logged in cannot be deactivated
  - Error: "User not allowed" / "Cannot deactivate this user"
  - Root cause: Some logged-in users don't have records in user_profiles table
  - The can_deactivate_user function returns false if user_profiles record doesn't exist
  - This affects users who logged in before the user_profiles sync was set up

  ## Solution
  1. Sync all auth.users to user_profiles if not already synced
  2. Update can_deactivate_user function to:
     - Check user_profiles table first (preferred)
     - Fall back to auth.users if user not found in user_profiles
     - Allow deactivation if user exists in auth.users
  3. Ensure all users have is_active = true by default

  ## Security
  - Maintains existing RLS policies
  - Function still validates super_admin rules
  - Deactivation requires super_admin role
*/

-- First, sync all existing auth.users to user_profiles
INSERT INTO user_profiles (
  id,
  user_id,
  email,
  full_name,
  company_name,
  phone,
  role,
  is_active,
  created_at,
  updated_at
)
SELECT
  au.id,
  au.id,
  au.email,
  COALESCE(
    au.raw_user_meta_data->>'full_name',
    au.raw_user_meta_data->>'name',
    au.email
  ),
  au.raw_user_meta_data->>'company_name',
  au.raw_user_meta_data->>'phone',
  COALESCE(
    au.raw_app_meta_data->>'role',
    au.raw_user_meta_data->>'role',
    'admin'
  ),
  true,
  au.created_at,
  au.updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM user_profiles up WHERE up.id = au.id
);

-- Update any records with NULL is_active to true
UPDATE user_profiles
SET is_active = true
WHERE is_active IS NULL;

-- Update the can_deactivate_user function to handle missing user_profiles
CREATE OR REPLACE FUNCTION can_deactivate_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_role text;
  user_exists boolean;
  active_super_admin_count int;
BEGIN
  -- First, check if user exists in user_profiles with is_active = true
  SELECT role INTO target_role
  FROM user_profiles
  WHERE id = target_user_id AND is_active = true;

  -- If not found in user_profiles, check if user exists in auth.users
  -- This handles users who logged in before user_profiles sync was set up
  IF target_role IS NULL THEN
    SELECT COALESCE(
      raw_app_meta_data->>'role',
      raw_user_meta_data->>'role',
      'admin'
    ) INTO target_role
    FROM auth.users
    WHERE id = target_user_id;

    -- If user not found in either table, cannot deactivate
    IF target_role IS NULL THEN
      RETURN false;
    END IF;
  END IF;

  -- If target is super_admin, check if there are other active super admins
  IF target_role = 'super_admin' THEN
    -- Count active super admins in user_profiles
    SELECT COUNT(*) INTO active_super_admin_count
    FROM user_profiles
    WHERE role = 'super_admin'
      AND is_active = true
      AND id != target_user_id;

    -- If no active super admins in user_profiles, also check auth.users for super_admin role
    IF active_super_admin_count = 0 THEN
      SELECT COUNT(*) INTO active_super_admin_count
      FROM auth.users
      WHERE (raw_app_meta_data->>'role' = 'super_admin' OR raw_user_meta_data->>'role' = 'super_admin')
        AND id != target_user_id;
    END IF;

    -- Must have at least one other active super admin
    IF active_super_admin_count < 1 THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$;

-- Also update the can_delete_user function for consistency
CREATE OR REPLACE FUNCTION can_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_role text;
  total_super_admin_count int;
BEGIN
  -- First, check user_profiles
  SELECT role INTO target_role
  FROM user_profiles
  WHERE id = target_user_id;

  -- If not found in user_profiles, check auth.users
  IF target_role IS NULL THEN
    SELECT COALESCE(
      raw_app_meta_data->>'role',
      raw_user_meta_data->>'role',
      'admin'
    ) INTO target_role
    FROM auth.users
    WHERE id = target_user_id;

    -- If user not found in either table, cannot delete
    IF target_role IS NULL THEN
      RETURN false;
    END IF;
  END IF;

  -- If target is super_admin, check total super admin count
  IF target_role = 'super_admin' THEN
    -- Count in user_profiles
    SELECT COUNT(*) INTO total_super_admin_count
    FROM user_profiles
    WHERE role = 'super_admin'
      AND id != target_user_id;

    -- If no super admins in user_profiles, check auth.users
    IF total_super_admin_count = 0 THEN
      SELECT COUNT(*) INTO total_super_admin_count
      FROM auth.users
      WHERE (raw_app_meta_data->>'role' = 'super_admin' OR raw_user_meta_data->>'role' = 'super_admin')
        AND id != target_user_id;
    END IF;

    -- Must have at least one other super admin
    IF total_super_admin_count < 1 THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$;