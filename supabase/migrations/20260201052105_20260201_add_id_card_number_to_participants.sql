/*
  # Add ID Card Number to Participants

  1. New Column
    - `id_card_number` (text, nullable)
      - Stores national ID card number (KTP) for individual and group participants
      - Optional field for backward compatibility with existing records

  2. Changes Made
    - Added id_card_number column to participants table
    - No RLS changes needed as participants table already has proper security

  3. Notes
    - Field is nullable to maintain compatibility with existing participant records
    - Can be indexed later if searches by ID number are frequent
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'id_card_number'
  ) THEN
    ALTER TABLE participants ADD COLUMN id_card_number text;
  END IF;
END $$;