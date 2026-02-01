/*
  # Fix Payment Installments RLS Policies for Super Admin Access

  ## Problem
  - When deleting participants with payment records, CASCADE DELETE fails
  - RLS policies on payment_installments only check for 'admin' role
  - Super admin users have 'super_admin' role which doesn't match the policy
  - This causes 403 Forbidden errors when super_admin tries to delete participants

  ## Solution
  - Update all payment_installments RLS policies to include both 'admin' and 'super_admin' roles
  - Use `role IN ('admin', 'super_admin')` condition for consistency

  ## Changes
  1. Drop existing SELECT, UPDATE, DELETE policies
  2. Create new policies with updated role check
*/

-- Drop existing policies
DROP POLICY IF EXISTS "payment_installments_select_policy" ON public.payment_installments;
DROP POLICY IF EXISTS "payment_installments_update_policy" ON public.payment_installments;
DROP POLICY IF EXISTS "payment_installments_delete_policy" ON public.payment_installments;

-- Create new SELECT policy for admin and super_admin
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

-- Create new UPDATE policy for admin and super_admin
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

-- Create new DELETE policy for admin and super_admin
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
