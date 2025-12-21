/*
  # Clean up conflicting RLS policies on trips table

  1. Problem
    - Multiple conflicting policies exist on trips table
    - Some allow all authenticated users, some restrict to admin only
    - This creates unpredictable access patterns

  2. Solution
    - Remove all conflicting policies
    - Create clean, single policies for each operation
    - SELECT: All authenticated users can view
    - INSERT/UPDATE/DELETE: Only admin and super_admin
*/

DROP POLICY IF EXISTS "Authenticated users can read trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can view trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can create trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can modify trips" ON trips;
DROP POLICY IF EXISTS "Authenticated users can remove trips" ON trips;
DROP POLICY IF EXISTS "Allow authenticated users to manage trips" ON trips;
DROP POLICY IF EXISTS "Allow public read access to trips" ON trips;

CREATE POLICY "Users can view all trips"
  ON trips
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can insert trips"
  ON trips
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Only admins can update trips"
  ON trips
  FOR UPDATE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))
  WITH CHECK (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Only admins can delete trips"
  ON trips
  FOR DELETE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));