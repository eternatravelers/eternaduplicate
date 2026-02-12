/*
  # Fix Payment Installments RLS to Include Super Admin

  1. Issue
    - Payment installments RLS policies only check for 'admin' role
    - Super admin users are blocked from creating/updating/deleting payment installments
    - Error: "new row violates row-level security policy"

  2. Solution
    - Update all RLS policies to accept both 'admin' and 'super_admin' roles
    - SELECT, INSERT, UPDATE, DELETE policies need to include super_admin check

  3. Security Changes
    - SELECT: Allow both admin and super_admin
    - INSERT: Allow both admin and super_admin
    - UPDATE: Allow both admin and super_admin
    - DELETE: Allow both admin and super_admin
*/

-- Drop existing policies
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_installments' AND policyname = 'payment_installments_select_policy') THEN
    DROP POLICY "payment_installments_select_policy" ON public.payment_installments;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_installments' AND policyname = 'payment_installments_insert_policy') THEN
    DROP POLICY "payment_installments_insert_policy" ON public.payment_installments;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_installments' AND policyname = 'payment_installments_update_policy') THEN
    DROP POLICY "payment_installments_update_policy" ON public.payment_installments;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_installments' AND policyname = 'payment_installments_delete_policy') THEN
    DROP POLICY "payment_installments_delete_policy" ON public.payment_installments;
  END IF;
END $$;

-- SELECT policy: Allow admin and super_admin
CREATE POLICY "payment_installments_select_policy"
  ON public.payment_installments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- INSERT policy: Allow admin and super_admin
CREATE POLICY "payment_installments_insert_policy"
  ON public.payment_installments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- UPDATE policy: Allow admin and super_admin
CREATE POLICY "payment_installments_update_policy"
  ON public.payment_installments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );

-- DELETE policy: Allow admin and super_admin
CREATE POLICY "payment_installments_delete_policy"
  ON public.payment_installments
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role IN ('admin', 'super_admin')
    )
  );
