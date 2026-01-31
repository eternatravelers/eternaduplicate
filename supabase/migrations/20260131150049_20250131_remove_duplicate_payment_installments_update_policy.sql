/*
  # Remove Final Duplicate RLS Policy

  1. Security Cleanup
    - Drop the remaining duplicate "Payment installments update policy"
    - Keep only "Payment installments update for authenticated" policy
*/

DROP POLICY IF EXISTS "Payment installments update policy" ON public.payment_installments;
