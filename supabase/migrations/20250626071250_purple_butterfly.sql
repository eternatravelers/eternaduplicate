/*
  # Add pricing type to trips table

  1. Changes
    - Add `pricing_type` column to `trips` table
    - Default value is 'per_person' for backward compatibility

  2. Notes
    - 'per_person': Price is calculated per participant
    - 'per_trip': Price is fixed for the entire trip regardless of participant count
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'pricing_type'
  ) THEN
    ALTER TABLE trips ADD COLUMN pricing_type text DEFAULT 'per_person';
  END IF;
END $$;