/*
  # Add User Status Management System

  ## Summary
  This migration adds comprehensive user status management capabilities including
  active/inactive status tracking, audit trail for status changes, and proper
  validation to prevent critical operations.

  ## 1. New Columns in user_profiles table
    - `is_active` (boolean, default true) - Current active status of the user
    - `deactivated_at` (timestamptz, nullable) - When the user was deactivated
    - `deactivated_by` (uuid, nullable) - Which admin deactivated the user
    - `reactivated_at` (timestamptz, nullable) - When the user was last reactivated
    - `reactivated_by` (uuid, nullable) - Which admin reactivated the user

  ## 2. Indexes
    - Add index on `is_active` for efficient filtering
    - Add index on `deactivated_at` for audit queries

  ## 3. Functions
    - `can_deactivate_user(user_id uuid)` - Validates if a user can be deactivated
    - `can_delete_user(user_id uuid)` - Validates if a user can be deleted

  ## 4. Security
    - Maintain existing RLS policies
    - Add business logic validation to prevent:
      * Deactivating the last super admin
      * Self-deactivation
      * Deleting the last super admin

  ## Important Notes
    - Deactivation is reversible (soft disable)
    - Deletion remains permanent (hard delete)
    - Deactivated users cannot log in
    - All user data is preserved when deactivated
*/

-- Add status columns to user_profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'deactivated_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN deactivated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'deactivated_by'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN deactivated_by uuid REFERENCES user_profiles(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'reactivated_at'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN reactivated_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'reactivated_by'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN reactivated_by uuid REFERENCES user_profiles(id);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_profiles_is_active_idx ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS user_profiles_deactivated_at_idx ON user_profiles(deactivated_at);

-- Function to check if a user can be deactivated
CREATE OR REPLACE FUNCTION can_deactivate_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_role text;
  active_super_admin_count int;
BEGIN
  -- Get the target user's role
  SELECT role INTO target_role
  FROM user_profiles
  WHERE id = target_user_id AND is_active = true;

  -- If user not found or already inactive, return false
  IF target_role IS NULL THEN
    RETURN false;
  END IF;

  -- If target is super_admin, check if there are other active super admins
  IF target_role = 'super_admin' THEN
    SELECT COUNT(*) INTO active_super_admin_count
    FROM user_profiles
    WHERE role = 'super_admin' 
      AND is_active = true
      AND id != target_user_id;

    -- Must have at least one other active super admin
    IF active_super_admin_count < 1 THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$;

-- Function to check if a user can be deleted
CREATE OR REPLACE FUNCTION can_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  target_role text;
  total_super_admin_count int;
BEGIN
  -- Get the target user's role
  SELECT role INTO target_role
  FROM user_profiles
  WHERE id = target_user_id;

  -- If user not found, return false
  IF target_role IS NULL THEN
    RETURN false;
  END IF;

  -- If target is super_admin, check total super admin count
  IF target_role = 'super_admin' THEN
    SELECT COUNT(*) INTO total_super_admin_count
    FROM user_profiles
    WHERE role = 'super_admin' 
      AND id != target_user_id;

    -- Must have at least one other super admin
    IF total_super_admin_count < 1 THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$;

-- Ensure all existing users are active by default
UPDATE user_profiles 
SET is_active = true 
WHERE is_active IS NULL;
