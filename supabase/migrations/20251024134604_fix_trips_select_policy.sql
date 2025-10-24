/*
  # Fix Trips SELECT Policy
  
  1. Changes
    - Drop existing restrictive policy for trips management
    - Create separate policies for SELECT (read) and write operations (INSERT, UPDATE, DELETE)
    - SELECT: Allow all authenticated users to view trips
    - INSERT/UPDATE/DELETE: Only admin and super_admin
  
  2. Security
    - Maintains RLS protection
    - Allows all authenticated users to view trips (necessary for operations and trip pages)
    - Restricts modifications to admin and super_admin only
*/

-- Drop existing policy
DROP POLICY IF EXISTS "Allow authenticated users to manage trips" ON trips;
DROP POLICY IF EXISTS "Allow public read access to trips" ON trips;

-- Create separate SELECT policy for authenticated users
CREATE POLICY "Authenticated users can view trips"
  ON trips
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy for INSERT
CREATE POLICY "Admins can create trips"
  ON trips
  FOR INSERT
  TO authenticated
  WITH CHECK (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- Create policy for UPDATE
CREATE POLICY "Admins can update trips"
  ON trips
  FOR UPDATE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))
  WITH CHECK (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- Create policy for DELETE
CREATE POLICY "Admins can delete trips"
  ON trips
  FOR DELETE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));
