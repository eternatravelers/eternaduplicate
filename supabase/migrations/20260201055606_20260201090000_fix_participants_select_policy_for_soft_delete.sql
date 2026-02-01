/*
  # Fix Participants SELECT Policy for Soft Delete

  ## Problem
  The SELECT policy `USING (deleted_at IS NULL)` prevents PostgREST from
  returning updated rows after a soft-delete UPDATE operation, causing
  "new row violates row-level security policy" error.

  ## Solution
  Change the SELECT policy to allow selecting all rows (including soft-deleted ones).
  The application will filter by deleted_at in queries as needed.
*/

DROP POLICY IF EXISTS "Participants select for authenticated" ON public.participants;

CREATE POLICY "Participants select for authenticated"
  ON public.participants
  FOR SELECT
  TO authenticated
  USING (true);
