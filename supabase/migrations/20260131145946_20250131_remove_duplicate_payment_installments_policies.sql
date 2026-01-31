/*
  # Remove Duplicate RLS Policies on payment_installments

  1. Security Cleanup
    - Drop duplicate RLS policies on payment_installments table
    - Keep only one SELECT, INSERT, UPDATE, DELETE policy per action
    - Policies removed:
      - "Payment installments delete policy"
      - "Payment installments insert policy"
      - "Payment installments read policy"
    - Policies retained:
      - "Payment installments select for authenticated"
      - "Payment installments insert for authenticated"
      - "Payment installments update for authenticated"
      - "Payment installments delete for authenticated"

  2. Ensures
    - No conflicting policies causing query issues
    - Clean, predictable RLS enforcement
*/

DROP POLICY IF EXISTS "Payment installments delete policy" ON public.payment_installments;
DROP POLICY IF EXISTS "Payment installments insert policy" ON public.payment_installments;
DROP POLICY IF EXISTS "Payment installments read policy" ON public.payment_installments;
