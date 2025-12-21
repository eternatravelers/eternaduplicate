/*
  # Ensure payment_installments table exists
  
  1. Purpose
    - The payment_installments table should exist but query shows 404
    - Apply this migration to ensure table is properly created with RLS
    - This is a safety migration to guarantee table exists
    
  2. Changes
    - Create payment_installments table if not exists
    - Add proper RLS policies
    - Create necessary indexes
*/

-- Create payment_installments table
CREATE TABLE IF NOT EXISTS payment_installments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_method text DEFAULT 'transfer',
  proof_of_transfer_url text,
  notes text,
  payment_type text NOT NULL CHECK (payment_type IN ('dp', 'installment')),
  status text DEFAULT 'verified' CHECK (status IN ('verified', 'pending', 'rejected')),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add columns to participants if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE participants ADD COLUMN payment_status text DEFAULT 'belum_bayar';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'total_paid'
  ) THEN
    ALTER TABLE participants ADD COLUMN total_paid numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'remaining_payment'
  ) THEN
    ALTER TABLE participants ADD COLUMN remaining_payment numeric DEFAULT 0;
  END IF;
END $$;

-- Enable RLS
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to view payment installments" ON payment_installments;
DROP POLICY IF EXISTS "Allow authenticated users to insert payment installments" ON payment_installments;
DROP POLICY IF EXISTS "Allow authenticated users to update payment installments" ON payment_installments;
DROP POLICY IF EXISTS "Allow authenticated users to delete payment installments" ON payment_installments;

-- Create RLS policies for authenticated users
CREATE POLICY "Payment installments select for authenticated"
  ON payment_installments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Payment installments insert for authenticated"
  ON payment_installments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Payment installments update for authenticated"
  ON payment_installments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Payment installments delete for authenticated"
  ON payment_installments
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payment_installments_participant_id ON payment_installments(participant_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_payment_date ON payment_installments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_installments_payment_type ON payment_installments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payment_installments_status ON payment_installments(status);