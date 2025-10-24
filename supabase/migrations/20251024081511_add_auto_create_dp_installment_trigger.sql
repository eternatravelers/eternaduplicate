/*
  # Auto-create Payment Installment for New Participants with DP
  
  1. New Feature
    - Automatically create payment_installments record when a new participant is registered with dp_amount
    - This prevents the issue where participants have dp_amount but no payment_installments record
  
  2. Changes
    - Add trigger function to auto-create DP installment on participant insert/update
    - Trigger will only create if dp_amount > 0 and no DP installment exists yet
  
  3. Benefits
    - No need for manual sync in the future
    - Payment status will be correct from the start
    - Consistent data between old dp_amount field and new payment_installments system
*/

-- Function to auto-create DP payment installment when participant is created/updated with dp_amount
CREATE OR REPLACE FUNCTION auto_create_dp_installment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if dp_amount is greater than 0
  IF NEW.dp_amount > 0 THEN
    -- Check if DP installment already exists for this participant
    IF NOT EXISTS (
      SELECT 1 FROM payment_installments
      WHERE participant_id = NEW.id AND payment_type = 'dp'
    ) THEN
      -- Create the DP installment record
      INSERT INTO payment_installments (
        participant_id,
        payment_date,
        amount,
        payment_type,
        proof_of_transfer_url,
        notes,
        status
      ) VALUES (
        NEW.id,
        COALESCE(NEW.dp_transfer_date, NEW.created_at::date, CURRENT_DATE),
        NEW.dp_amount,
        'dp',
        NEW.proof_of_transfer_url,
        'DP payment auto-created from participant registration',
        'verified'
      );
      
      -- Note: The update_participant_payment_totals trigger will automatically
      -- update the payment_status, total_paid, and remaining_payment
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to run AFTER INSERT on participants
CREATE TRIGGER trigger_auto_create_dp_installment_after_insert
  AFTER INSERT ON participants
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_dp_installment();

-- Create trigger to run AFTER UPDATE on participants (in case dp_amount is added later)
CREATE TRIGGER trigger_auto_create_dp_installment_after_update
  AFTER UPDATE OF dp_amount ON participants
  FOR EACH ROW
  WHEN (NEW.dp_amount > 0 AND (OLD.dp_amount IS NULL OR OLD.dp_amount = 0 OR OLD.dp_amount != NEW.dp_amount))
  EXECUTE FUNCTION auto_create_dp_installment();
