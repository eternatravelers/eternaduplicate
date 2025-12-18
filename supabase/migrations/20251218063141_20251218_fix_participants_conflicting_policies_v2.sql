/*
  # Fix conflicting RLS policies on participants table - v2

  1. Problem
    - Multiple conflicting INSERT policies prevent regular authenticated users from registering
    - Policy "Admin and super admin can create participants" restricts to admin/super_admin
    - When this exists with "Allow authenticated users to insert participants", registration fails

  2. Solution
    - Drop the restrictive INSERT policy that requires admin role
    - Keep permissive policies for registration workflow

  3. Result
    - Registration forms can now work for regular authenticated users
    - Admin-only operations remain protected
*/

DROP POLICY IF EXISTS "Admin and super admin can create participants" ON participants;
DROP POLICY IF EXISTS "Admin can view active participants" ON participants;
DROP POLICY IF EXISTS "Admin and super admin can update participants" ON participants;
DROP POLICY IF EXISTS "Admin and super admin can delete participants" ON participants;
DROP POLICY IF EXISTS "Super admin can view all participants" ON participants;
DROP POLICY IF EXISTS "Allow admin view all participants" ON participants;
DROP POLICY IF EXISTS "Allow admin users to update participants" ON participants;
DROP POLICY IF EXISTS "Allow admin users to delete participants" ON participants;
