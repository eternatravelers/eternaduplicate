/*
  # Add proof of transfer support to participants table

  1. Changes
    - Add `proof_of_transfer_url` column to `participants` table
    - Column stores the URL of uploaded proof of transfer image

  2. Notes
    - This will be used to store Supabase Storage URLs for proof of transfer images
    - Files will be stored in a 'proofs-of-transfer' bucket in Supabase Storage
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'proof_of_transfer_url'
  ) THEN
    ALTER TABLE participants ADD COLUMN proof_of_transfer_url text;
  END IF;
END $$;