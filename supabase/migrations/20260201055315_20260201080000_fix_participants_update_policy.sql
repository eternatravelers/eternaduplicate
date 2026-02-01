/*
  # Fix Participants UPDATE Policy

  ## Problem
  Soft-delete UPDATE is failing with "new row violates row-level security policy"
  even though the UPDATE policy has WITH CHECK (true).

  ## Solution
  Drop and recreate the UPDATE policy to ensure it's properly configured.
  Also ensure the policy doesn't interfere with soft-delete operations.
*/

DROP POLICY IF EXISTS "Participants update for authenticated" ON public.participants;

CREATE POLICY "Participants update for authenticated"
  ON public.participants
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
