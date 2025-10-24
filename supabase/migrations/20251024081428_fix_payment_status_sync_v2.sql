/*
  # Fix Payment Status Synchronization
  
  1. Problem Analysis
    - Some participants have dp_amount but no corresponding payment_installments record
    - This causes total_paid to be 0 and payment_status to be 'belum_bayar' incorrectly
    - The migration script that creates initial installments only runs once and doesn't catch new participants
  
  2. Solution
    - Create payment_installments records for participants who have dp_amount but no installment records
    - Re-calculate total_paid, remaining_payment, and payment_status for all participants
    - Improve the trigger function to handle edge cases better
  
  3. Changes
    - Insert missing payment_installments for participants with dp_amount
    - Create manual sync function
    - Run sync for all participants
*/

-- Step 1: Create a manual version of the trigger function that can be called directly
CREATE OR REPLACE FUNCTION update_participant_payment_totals_manual(p_participant_id uuid)
RETURNS void AS $$
DECLARE
  total_paid_amount numeric;
  participant_package_price numeric;
  remaining_amount numeric;
  new_payment_status text;
BEGIN
  -- Get the participant's package price
  SELECT package_price INTO participant_package_price
  FROM participants
  WHERE id = p_participant_id;

  -- Calculate total paid amount for this participant (only verified payments)
  SELECT COALESCE(SUM(amount), 0) INTO total_paid_amount
  FROM payment_installments
  WHERE participant_id = p_participant_id
    AND status = 'verified';

  -- Calculate remaining payment
  remaining_amount := COALESCE(participant_package_price, 0) - total_paid_amount;

  -- Determine payment status
  IF total_paid_amount >= COALESCE(participant_package_price, 0) AND COALESCE(participant_package_price, 0) > 0 THEN
    new_payment_status := 'lunas';
  ELSIF total_paid_amount > 0 THEN
    -- Check if there's more than just DP payment
    IF EXISTS (
      SELECT 1 FROM payment_installments
      WHERE participant_id = p_participant_id
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
  WHERE id = p_participant_id;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Create missing payment_installments for participants with dp_amount but no DP installment
INSERT INTO payment_installments (participant_id, payment_date, amount, payment_type, proof_of_transfer_url, notes, status)
SELECT
  p.id,
  COALESCE(p.dp_transfer_date, p.created_at::date),
  p.dp_amount,
  'dp',
  p.proof_of_transfer_url,
  'DP payment created during sync - migrated from dp_amount field',
  'verified'
FROM participants p
WHERE p.dp_amount > 0
AND NOT EXISTS (
  SELECT 1 FROM payment_installments pi
  WHERE pi.participant_id = p.id AND pi.payment_type = 'dp'
);

-- Step 3: Run the manual sync for all participants
DO $$
DECLARE
  participant_record RECORD;
BEGIN
  FOR participant_record IN SELECT id FROM participants
  LOOP
    PERFORM update_participant_payment_totals_manual(participant_record.id);
  END LOOP;
  
  RAISE NOTICE 'Payment status synchronization completed for all participants';
END $$;
