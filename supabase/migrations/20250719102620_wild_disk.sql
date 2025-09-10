/*
  # Add status column to transactions table

  1. Changes
    - Add `status` column to `transactions` table with default value 'active'
    - Update existing transactions to have 'active' status
    - Add index for better query performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add status column to transactions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'status'
  ) THEN
    ALTER TABLE transactions ADD COLUMN status text DEFAULT 'active' NOT NULL;
  END IF;
END $$;

-- Update existing transactions to have 'active' status
UPDATE transactions SET status = 'active' WHERE status IS NULL;

-- Add index for better query performance on status
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Add check constraint to ensure valid status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'transactions_status_check'
  ) THEN
    ALTER TABLE transactions ADD CONSTRAINT transactions_status_check 
    CHECK (status IN ('active', 'deleted'));
  END IF;
END $$;