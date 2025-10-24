/*
  # Payment Installments System

  1. New Tables
    - `payment_installments`
      - `id` (uuid, primary key)
      - `participant_id` (uuid, foreign key to participants)
      - `payment_date` (date, required) - Date when payment was made
      - `amount` (numeric, required) - Payment amount
      - `payment_method` (text, nullable) - Payment method (transfer, cash, etc)
      - `proof_of_transfer_url` (text, nullable) - URL to payment proof
      - `notes` (text, nullable) - Additional notes
      - `payment_type` (text, required) - Type: 'dp' or 'installment'
      - `status` (text, default 'verified') - Payment status
      - `created_by` (uuid, nullable) - User who created this record
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Changes to `participants` Table
    - Add `payment_status` (text, default 'belum_bayar')
      Options: 'belum_bayar', 'dp_dibayar', 'cicilan_berjalan', 'lunas'
    - Add `total_paid` (numeric, default 0) - Total amount paid so far
    - Add `remaining_payment` (numeric, default 0) - Remaining amount to be paid

  3. Security
    - Enable RLS on `payment_installments` table
    - Add policies for authenticated users to manage payment installments
    - Add indexes for better performance

  4. Triggers
    - Auto-update `total_paid` and `remaining_payment` on participants
    - Auto-update `payment_status` based on payment progress
    - Auto-create transaction record when payment installment is added
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

-- Add new columns to participants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'payment_status'
  ) THEN
    ALTER TABLE participants ADD COLUMN payment_status text DEFAULT 'belum_bayar' CHECK (payment_status IN ('belum_bayar', 'dp_dibayar', 'cicilan_berjalan', 'lunas'));
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

-- Initialize existing participants with payment data
UPDATE participants
SET
  total_paid = COALESCE(dp_amount, 0),
  remaining_payment = COALESCE(package_price, 0) - COALESCE(dp_amount, 0),
  payment_status = CASE
    WHEN COALESCE(dp_amount, 0) >= COALESCE(package_price, 0) THEN 'lunas'
    WHEN COALESCE(dp_amount, 0) > 0 THEN 'dp_dibayar'
    ELSE 'belum_bayar'
  END
WHERE total_paid IS NULL OR total_paid = 0;

-- Create initial payment installment records for existing DP payments
INSERT INTO payment_installments (participant_id, payment_date, amount, payment_type, proof_of_transfer_url, notes)
SELECT
  id,
  COALESCE(dp_transfer_date, created_at::date),
  COALESCE(dp_amount, 0),
  'dp',
  proof_of_transfer_url,
  'Initial DP payment (migrated from existing data)'
FROM participants
WHERE COALESCE(dp_amount, 0) > 0
AND NOT EXISTS (
  SELECT 1 FROM payment_installments pi
  WHERE pi.participant_id = participants.id AND pi.payment_type = 'dp'
);

-- Enable Row Level Security
ALTER TABLE payment_installments ENABLE ROW LEVEL SECURITY;

-- Create policies for payment_installments
CREATE POLICY "Allow authenticated users to view payment installments"
  ON payment_installments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert payment installments"
  ON payment_installments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update payment installments"
  ON payment_installments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete payment installments"
  ON payment_installments
  FOR DELETE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_installments_participant_id ON payment_installments(participant_id);
CREATE INDEX IF NOT EXISTS idx_payment_installments_payment_date ON payment_installments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payment_installments_payment_type ON payment_installments(payment_type);
CREATE INDEX IF NOT EXISTS idx_payment_installments_status ON payment_installments(status);
CREATE INDEX IF NOT EXISTS idx_participants_payment_status ON participants(payment_status);

-- Add trigger to update updated_at column for payment_installments
CREATE TRIGGER update_payment_installments_updated_at
  BEFORE UPDATE ON payment_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update participant payment totals
CREATE OR REPLACE FUNCTION update_participant_payment_totals()
RETURNS TRIGGER AS $$
DECLARE
  total_paid_amount numeric;
  participant_package_price numeric;
  remaining_amount numeric;
  new_payment_status text;
BEGIN
  -- Get the participant's package price
  SELECT package_price INTO participant_package_price
  FROM participants
  WHERE id = COALESCE(NEW.participant_id, OLD.participant_id);

  -- Calculate total paid amount for this participant
  SELECT COALESCE(SUM(amount), 0) INTO total_paid_amount
  FROM payment_installments
  WHERE participant_id = COALESCE(NEW.participant_id, OLD.participant_id)
    AND status = 'verified';

  -- Calculate remaining payment
  remaining_amount := participant_package_price - total_paid_amount;

  -- Determine payment status
  IF total_paid_amount >= participant_package_price THEN
    new_payment_status := 'lunas';
  ELSIF total_paid_amount > 0 THEN
    -- Check if there's more than just DP payment
    IF EXISTS (
      SELECT 1 FROM payment_installments
      WHERE participant_id = COALESCE(NEW.participant_id, OLD.participant_id)
        AND payment_type = 'installment'
        AND status = 'verified'
    ) THEN
      new_payment_status := 'cicilan_berjalan';
    ELSE
      new_payment_status := 'dp_dibayar';
    END IF;
  ELSE
    new_payment_status := 'belum_bayar';
  END IF;

  -- Update participant record
  UPDATE participants
  SET
    total_paid = total_paid_amount,
    remaining_payment = GREATEST(remaining_amount, 0),
    payment_status = new_payment_status,
    updated_at = now()
  WHERE id = COALESCE(NEW.participant_id, OLD.participant_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for payment installments
CREATE TRIGGER trigger_update_payment_totals_after_insert
  AFTER INSERT ON payment_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_payment_totals();

CREATE TRIGGER trigger_update_payment_totals_after_update
  AFTER UPDATE ON payment_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_payment_totals();

CREATE TRIGGER trigger_update_payment_totals_after_delete
  AFTER DELETE ON payment_installments
  FOR EACH ROW
  EXECUTE FUNCTION update_participant_payment_totals();

-- Function to auto-create transaction when payment installment is added
CREATE OR REPLACE FUNCTION create_transaction_for_payment()
RETURNS TRIGGER AS $$
DECLARE
  participant_record RECORD;
  transaction_category text;
BEGIN
  -- Only create transaction for new verified payments
  IF TG_OP = 'INSERT' AND NEW.status = 'verified' THEN
    -- Get participant details
    SELECT p.*, t.id as trip_id, s.id as sales_id
    INTO participant_record
    FROM participants p
    LEFT JOIN trips t ON t.id = p.trip_id
    LEFT JOIN sales s ON s.id = p.sales_id
    WHERE p.id = NEW.participant_id;

    -- Determine transaction category
    IF NEW.payment_type = 'dp' THEN
      transaction_category := 'Pembayaran DP';
    ELSE
      transaction_category := 'Pelunasan';
    END IF;

    -- Create transaction record
    INSERT INTO transactions (
      transaction_date,
      transaction_type,
      category,
      amount,
      description,
      trip_id,
      proof_url
    ) VALUES (
      NEW.payment_date,
      'Pemasukan',
      transaction_category,
      NEW.amount,
      format('Pembayaran dari %s - %s',
        participant_record.full_name,
        COALESCE(NEW.notes, 'Pembayaran cicilan')),
      participant_record.trip_id,
      NEW.proof_of_transfer_url
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-create transaction
CREATE TRIGGER trigger_create_transaction_for_payment
  AFTER INSERT ON payment_installments
  FOR EACH ROW
  EXECUTE FUNCTION create_transaction_for_payment();