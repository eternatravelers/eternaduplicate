/*
  # Fix Buses RLS for Admin-Only Write Operations

  1. Problem
    - Current buses RLS policy allows all authenticated users to create/update/delete buses
    - Only admin and super_admin roles should be able to modify buses
    - Read access can remain for all authenticated users

  2. Solution
    - Drop overly permissive "Authenticated users can read and manage buses" policy
    - Create separate policies for SELECT (all authenticated) and write operations (admin only)
    - Apply same pattern to drivers and tour_leaders tables

  3. Tables Modified
    - buses: separate SELECT and admin-only write policies
    - drivers: separate SELECT and admin-only write policies
    - tour_leaders: separate SELECT and admin-only write policies
*/

-- BUSES: Restrict to admin/super_admin for write operations
DROP POLICY IF EXISTS "Authenticated users can read and manage buses" ON buses;

CREATE POLICY "Authenticated users can read buses"
  ON buses
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert buses"
  ON buses
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Only admins can update buses"
  ON buses
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))
  WITH CHECK (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Only admins can delete buses"
  ON buses
  FOR DELETE
  TO authenticated
  USING (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- DRIVERS: Restrict to admin/super_admin for write operations
DROP POLICY IF EXISTS "Authenticated users can read and manage drivers" ON drivers;

CREATE POLICY "Authenticated users can read drivers"
  ON drivers
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert drivers"
  ON drivers
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Only admins can update drivers"
  ON drivers
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))
  WITH CHECK (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Only admins can delete drivers"
  ON drivers
  FOR DELETE
  TO authenticated
  USING (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- TOUR_LEADERS: Restrict to admin/super_admin for write operations
DROP POLICY IF EXISTS "Authenticated users can read and manage tour_leaders" ON tour_leaders;

CREATE POLICY "Authenticated users can read tour_leaders"
  ON tour_leaders
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert tour_leaders"
  ON tour_leaders
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Only admins can update tour_leaders"
  ON tour_leaders
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))
  WITH CHECK (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Only admins can delete tour_leaders"
  ON tour_leaders
  FOR DELETE
  TO authenticated
  USING (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));
