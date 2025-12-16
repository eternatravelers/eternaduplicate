/*
  # Fix participants RLS policies to support registration

  1. Changes
    - Replace overly restrictive policies with proper INSERT/UPDATE/DELETE support
    - Allow authenticated users to insert new participant records
    - Allow INSERT even if participant has no role yet (for new registrations)
    - Keep SELECT policies restrictive for data privacy

  2. Policy Details
    - SELECT: Only admins can view all; others see nothing (restrictive)
    - INSERT: All authenticated users can insert (for registration form)
    - UPDATE: Only admins can update (prevent user tampering)
    - DELETE: Only admins can delete (soft delete via deleted_at column)

  3. Security Notes
    - Participants table is write-once for regular users (can only insert)
    - Updates/deletes require admin role
    - This supports the registration flow where users submit data via forms
*/

DROP POLICY IF EXISTS "Allow admin/super_admin select on participants" ON participants;
DROP POLICY IF EXISTS "Allow authenticated select on participants" ON participants;
DROP POLICY IF EXISTS "Allow authenticated users to manage participants" ON participants;

-- SELECT policy - restrictive, only for admins to see all data
CREATE POLICY "Allow admin view all participants"
  ON participants
  FOR SELECT
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- INSERT policy - allow authenticated users to create new participant records
CREATE POLICY "Allow authenticated insert participants"
  ON participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE policy - only admins can update participant records
CREATE POLICY "Allow admin update participants"
  ON participants
  FOR UPDATE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))
  WITH CHECK (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- DELETE policy - only admins can delete, but soft delete is preferred
CREATE POLICY "Allow admin delete participants"
  ON participants
  FOR DELETE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));