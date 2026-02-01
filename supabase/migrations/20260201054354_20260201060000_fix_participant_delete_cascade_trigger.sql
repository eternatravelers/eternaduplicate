/*
  # Fix Participant Delete Cascade Trigger Issue

  ## Problem
  When a participant is deleted, the CASCADE DELETE removes related payment_installments records.
  The AFTER DELETE trigger on payment_installments tries to UPDATE the participant that is being deleted,
  causing an error because the participant no longer exists or the transaction is in an invalid state.

  ## Solution
  Modify the `update_participant_payment_totals` function to:
  1. Check if the participant still exists before attempting to update
  2. Skip the update if participant doesn't exist (CASCADE DELETE scenario)

  ## Changes
  - Updated `update_participant_payment_totals` function with existence check
*/

CREATE OR REPLACE FUNCTION public.update_participant_payment_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_participant_id uuid;
  total_paid_amount numeric;
  participant_package_price numeric;
  remaining_amount numeric;
  new_payment_status text;
  participant_exists boolean;
BEGIN
  target_participant_id := COALESCE(NEW.participant_id, OLD.participant_id);
  
  IF target_participant_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.participants WHERE id = target_participant_id
  ) INTO participant_exists;
  
  IF NOT participant_exists THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT package_price INTO participant_package_price
  FROM public.participants
  WHERE id = target_participant_id;

  SELECT COALESCE(SUM(amount), 0) INTO total_paid_amount
  FROM public.payment_installments
  WHERE participant_id = target_participant_id
  AND status = 'verified';

  remaining_amount := COALESCE(participant_package_price, 0) - total_paid_amount;

  IF total_paid_amount >= COALESCE(participant_package_price, 0) AND COALESCE(participant_package_price, 0) > 0 THEN
    new_payment_status := 'lunas';
  ELSIF total_paid_amount > 0 THEN
    IF EXISTS (
      SELECT 1 FROM public.payment_installments
      WHERE participant_id = target_participant_id
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

  UPDATE public.participants
  SET
    total_paid = total_paid_amount,
    remaining_payment = GREATEST(remaining_amount, 0),
    payment_status = new_payment_status,
    updated_at = now()
  WHERE id = target_participant_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;
