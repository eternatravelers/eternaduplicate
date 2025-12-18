/*
  # Restore admin update and delete policies for participants

  1. Added Policies
    - UPDATE: Allows admin/super_admin to modify participant records
    - DELETE: Allows admin/super_admin to delete participant records

  2. Security
    - Registration form users cannot modify/delete once inserted
    - Only admins can manage participant records after creation
    - Soft delete via deleted_at column is also available
*/

CREATE POLICY "Allow admin update participants"
  ON participants
  FOR UPDATE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))
  WITH CHECK (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

CREATE POLICY "Allow admin delete participants"
  ON participants
  FOR DELETE
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));
