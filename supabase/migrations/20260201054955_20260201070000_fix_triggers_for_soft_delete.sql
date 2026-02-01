/*
  # Fix Triggers for Soft Delete Scenarios

  ## Problem
  When soft-deleting a participant, multiple triggers fire in cascade:
  1. auto_create_dp_installment fires on UPDATE
  2. This can INSERT into payment_installments
  3. update_participant_payment_totals then fires and UPDATEs participants
  4. This triggers more cascading updates, causing RLS issues

  ## Solution
  1. Modify `auto_create_dp_installment` to skip when deleted_at is being set
  2. Modify `update_participant_payment_totals` to skip when participant is soft-deleted
  3. Use pg_trigger_depth() to prevent deeply nested trigger recursion

  ## Changes
  - Updated `auto_create_dp_installment` function to skip on soft delete
  - Updated `update_participant_payment_totals` function to check deleted_at status
*/

CREATE OR REPLACE FUNCTION public.auto_create_dp_installment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF pg_trigger_depth() > 1 THEN
    RETURN NEW;
  END IF;

  IF NEW.deleted_at IS NOT NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.dp_amount > 0 THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.payment_installments
      WHERE participant_id = NEW.id AND payment_type = 'dp'
    ) THEN
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
$$;

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
  participant_deleted_at timestamptz;
BEGIN
  IF pg_trigger_depth() > 2 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  target_participant_id := COALESCE(NEW.participant_id, OLD.participant_id);
  
  IF target_participant_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT deleted_at, package_price 
  INTO participant_deleted_at, participant_package_price
  FROM public.participants
  WHERE id = target_participant_id;

  IF participant_deleted_at IS NOT NULL OR participant_package_price IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

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
  WHERE id = target_participant_id
  AND deleted_at IS NULL;

  RETURN COALESCE(NEW, OLD);
END;
$$;
