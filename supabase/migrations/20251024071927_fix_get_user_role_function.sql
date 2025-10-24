/*
  # Fix get_user_role() function to prioritize user_metadata.role

  1. Changes
    - Update get_user_role() to check user_metadata.role first
    - Remove check for JWT role (which returns 'authenticated')
    - This ensures super_admin and admin roles from user_metadata are properly detected

  2. Security
    - Function remains SECURITY DEFINER to access JWT claims
    - Maintains fallback to 'admin' for safety
*/

-- Update the get_user_role function to prioritize user_metadata
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN COALESCE(
    current_setting('request.jwt.claims', true)::json->'user_metadata'->>'role',
    current_setting('request.jwt.claims', true)::json->'app_metadata'->>'role',
    'admin'
  )::text;
END;
$$;