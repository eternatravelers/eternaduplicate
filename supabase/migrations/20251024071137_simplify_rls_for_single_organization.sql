/*
  # Simplify RLS policies for single organization

  This migration simplifies Row Level Security policies since the application
  is designed for a single organization (not multi-tenant).

  1. Changes
    - Create get_user_role() helper function for RLS policies
    - Simplify participant policies to remove tenant checks
    - Keep role-based access control (Super Admin vs Admin)

  2. Security
    - Admin and Super Admin can manage all data
    - Super Admin has additional access to deleted records and financial data
    - All authenticated users can view active (non-deleted) data
*/

-- Create helper function to get user role from JWT
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    current_setting('request.jwt.claims', true)::json->'user_metadata'->>'role',
    current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role',
    'admin'
  )::text;
END;
$$;

-- Recreate participant policies with simplified logic (no tenant checks)
DROP POLICY IF EXISTS "Allow admin/super_admin select on participants" ON participants;
DROP POLICY IF EXISTS "Allow authenticated select on participants" ON participants;
DROP POLICY IF EXISTS "Allow authenticated users to manage participants" ON participants;

-- Super Admin can see all participants including deleted ones
CREATE POLICY "Super admin can view all participants"
  ON participants
  FOR SELECT
  TO authenticated
  USING (get_user_role() = 'super_admin');

-- Admin can see non-deleted participants
CREATE POLICY "Admin can view active participants"
  ON participants
  FOR SELECT
  TO authenticated
  USING (get_user_role() = 'admin' AND deleted_at IS NULL);

-- Admin and Super Admin can insert participants
CREATE POLICY "Admin and super admin can create participants"
  ON participants
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = ANY (ARRAY['admin', 'super_admin']));

-- Admin and Super Admin can update participants
CREATE POLICY "Admin and super admin can update participants"
  ON participants
  FOR UPDATE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin', 'super_admin']))
  WITH CHECK (get_user_role() = ANY (ARRAY['admin', 'super_admin']));

-- Admin and Super Admin can delete participants
CREATE POLICY "Admin and super admin can delete participants"
  ON participants
  FOR DELETE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin', 'super_admin']));
