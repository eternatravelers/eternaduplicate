/*
  # Fix Trips SELECT Policy - Part B

  1. Changes
    - Drop existing restrictive policies for trips
    - Create separate policies for SELECT (read) and write operations (INSERT, UPDATE, DELETE)
    - SELECT: Allow all authenticated users to view trips
    - INSERT/UPDATE/DELETE: Only admin and super_admin

  2. Security
    - Maintains RLS protection
    - Allows all authenticated users to view trips (necessary for operations and trip pages)
    - Restricts modifications to admin and super_admin only
*/

DROP POLICY IF EXISTS "Allow authenticated users to manage trips" ON public.trips;
DROP POLICY IF EXISTS "Allow public read access to trips" ON public.trips;
DROP POLICY IF EXISTS "Authenticated users can view trips" ON public.trips;
DROP POLICY IF EXISTS "Admins can create trips" ON public.trips;
DROP POLICY IF EXISTS "Admins can update trips" ON public.trips;
DROP POLICY IF EXISTS "Admins can delete trips" ON public.trips;

CREATE POLICY "Authenticated users can view trips"
  ON public.trips
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create trips"
  ON public.trips
  FOR INSERT
  TO authenticated
  WITH CHECK (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Admins can update trips"
  ON public.trips
  FOR UPDATE
  TO authenticated
  USING (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))
  WITH CHECK (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Admins can delete trips"
  ON public.trips
  FOR DELETE
  TO authenticated
  USING (public.get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));
