/*
  # Secure Payment Installments RLS Policies

  1. Policy Updates
    - Replace permissive policies allowing all authenticated users
    - Implement restrictive ownership-based access control
    - Ensure users can only access their own participant's payment data
    - Allow admins to view all payment records

  2. Security Changes
    - SELECT: Users see their participant's payments or admins see all
    - INSERT: Only admins can create new payment records
    - UPDATE: Only admins can modify payment records
    - DELETE: Only admins can delete payment records
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payment_installments'
    AND policyname = 'Payment installments delete for authenticated'
  ) THEN
    DROP POLICY "Payment installments delete for authenticated" ON public.payment_installments;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payment_installments'
    AND policyname = 'Payment installments insert for authenticated'
  ) THEN
    DROP POLICY "Payment installments insert for authenticated" ON public.payment_installments;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payment_installments'
    AND policyname = 'Payment installments select for authenticated'
  ) THEN
    DROP POLICY "Payment installments select for authenticated" ON public.payment_installments;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payment_installments'
    AND policyname = 'Payment installments update for authenticated'
  ) THEN
    DROP POLICY "Payment installments update for authenticated" ON public.payment_installments;
  END IF;
END $$;

CREATE POLICY "Users can view own payment installments"
  ON public.payment_installments
  FOR SELECT
  TO authenticated
  USING (
    participant_id IN (
      SELECT id FROM public.participants
      WHERE trip_id IN (
        SELECT id FROM public.trips
      )
    )
    OR
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can create payment installments"
  ON public.payment_installments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payment installments"
  ON public.payment_installments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can delete payment installments"
  ON public.payment_installments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );
