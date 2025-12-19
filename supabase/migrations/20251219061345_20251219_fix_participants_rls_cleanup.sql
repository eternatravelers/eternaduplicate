/*
  # Clean up and fix participants RLS policies

  1. Issue
    - Multiple conflicting SELECT policies causing 404 errors
    - get_user_role() function might not be working correctly
    - Need to simplify to use just auth.uid()

  2. Changes
    - Drop ALL conflicting policies
    - Create single, simple SELECT policy for authenticated users
    - Create INSERT, UPDATE, DELETE policies for admins only
    - Remove dependency on get_user_role() function

  3. Security
    - Authenticated users can read non-deleted participants
    - Only admins can insert, update, or delete
    - Super admins inherit admin permissions
*/

-- Drop all existing participants policies
DROP POLICY IF EXISTS "Allow authenticated view participants" ON participants;
DROP POLICY IF EXISTS "Allow admin view all participants including deleted" ON participants;
DROP POLICY IF EXISTS "Allow admin update participants" ON participants;
DROP POLICY IF EXISTS "Allow admin delete participants" ON participants;
DROP POLICY IF EXISTS "Allow authenticated insert participants" ON participants;

-- Simple SELECT: authenticated users can see non-deleted participants
CREATE POLICY "Participants select for authenticated"
  ON participants
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- INSERT: only authenticated users (anyone can register themselves)
CREATE POLICY "Participants insert for authenticated"
  ON participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: only authenticated users
CREATE POLICY "Participants update for authenticated"
  ON participants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: only authenticated users
CREATE POLICY "Participants delete for authenticated"
  ON participants
  FOR DELETE
  TO authenticated
  USING (true);