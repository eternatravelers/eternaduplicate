/*
  # Add meeting point details to participants

  1. Changes
    - Add `meeting_point_details` column to `participants` table
    - This allows each participant to have a custom meeting point
    - If null, the participant uses the default meeting point from the trip

  2. Notes
    - Column is nullable to maintain backward compatibility
    - Default behavior: use trip's meeting_point if meeting_point_details is null
    - Custom behavior: use meeting_point_details if specified
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'meeting_point_details'
  ) THEN
    ALTER TABLE participants ADD COLUMN meeting_point_details text;
  END IF;
END $$;