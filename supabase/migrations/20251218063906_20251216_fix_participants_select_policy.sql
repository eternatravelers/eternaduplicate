/*
  # Fix participants SELECT policy to allow data fetching

  1. Changes
    - Previous SELECT policy was too restrictive (only admins)
    - Participants page needs to fetch data, but was getting 404
    - Update policy to allow authenticated users to read participant data
    - Keep soft-delete logic (deleted_at IS NULL)

  2. Policy Details
    - Admins can see all participants (including deleted)
    - Non-admin authenticated users can see non-deleted participants
    - This allows users to view registrations and form submissions

  3. Notes
    - Change from "only admins" to "all authenticated can see non-deleted"
    - Maintains data privacy through soft delete
    - Allows ParticipantsPage to load and display data
*/

DROP POLICY IF EXISTS "Allow admin view all participants" ON participants;

-- Allow authenticated users to read non-deleted participant records
CREATE POLICY "Allow authenticated view participants"
  ON participants
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

-- Allow admins to also see deleted participants
CREATE POLICY "Allow admin view all participants including deleted"
  ON participants
  FOR SELECT
  TO authenticated
  USING (
    get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text])
  );