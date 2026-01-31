/*
  # Fix Trigger Security Context for Payment Installments
  
  1. Issue
    - Triggers are subject to RLS policies when they try to INSERT
    - The auto_create_dp_installment function fails because RLS policies require admin role
    - But the authenticated user creating the participant may not be an admin
  
  2. Solution
    - Recreate the trigger function with SECURITY DEFINER
    - This allows the function to bypass RLS and execute with elevated privileges
    - System operations (like auto-creating payment records) can complete successfully
  
  3. Security Impact
    - Function runs as owner (postgres), not authenticated user
    - Only used internally by triggers, not exposed to users
    - Payment records still protected by RLS for read/write
*/

-- Drop existing triggers
DROP TRIGGER IF EXISTS trigger_auto_create_dp_installment_after_insert ON public.participants;
DROP TRIGGER IF EXISTS trigger_auto_create_dp_installment_after_update ON public.participants;

-- Drop existing function
DROP FUNCTION IF EXISTS public.auto_create_dp_installment();

-- Recreate function with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION public.auto_create_dp_installment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if dp_amount is greater than 0
  IF NEW.dp_amount > 0 THEN
    -- Check if DP installment already exists for this participant
    IF NOT EXISTS (
      SELECT 1 FROM public.payment_installments
      WHERE participant_id = NEW.id AND payment_type = 'dp'
    ) THEN
      -- Create the DP installment record
      INSERT INTO public.payment_installments (
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
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate trigger for INSERT
CREATE TRIGGER trigger_auto_create_dp_installment_after_insert
  AFTER INSERT ON public.participants
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_dp_installment();

-- Recreate trigger for UPDATE
CREATE TRIGGER trigger_auto_create_dp_installment_after_update
  AFTER UPDATE OF dp_amount ON public.participants
  FOR EACH ROW
  WHEN (NEW.dp_amount > 0 AND (OLD.dp_amount IS NULL OR OLD.dp_amount = 0 OR OLD.dp_amount != NEW.dp_amount))
  EXECUTE FUNCTION public.auto_create_dp_installment();
