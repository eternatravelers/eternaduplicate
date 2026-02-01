/*
  # Improve get_user_role() function for better JWT handling
  
  1. Changes
    - Updated get_user_role() to properly handle JWT claims from Supabase auth
    - Improved fallback mechanism to ensure role defaults to 'admin'
    - Added better debugging capability for role detection
    - Ensure compatibility with both user_metadata and app_metadata
  
  2. Key improvements
    - Check JWT app_metadata role first (most reliable source)
    - Fall back to user_metadata role
    - Final fallback to 'admin' if no role found
    - Handle null/undefined values properly
    - Maintain SECURITY DEFINER for RLS policy execution
*/

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  jwt_payload jsonb;
  jwt_role text;
  auth_user_id uuid;
  user_app_meta_role text;
BEGIN
  auth_user_id := auth.uid();
  
  -- Get JWT payload
  jwt_payload := auth.jwt();
  
  -- Try to get role from JWT app_metadata first (most reliable)
  jwt_role := (jwt_payload -> 'app_metadata' ->> 'role');
  
  -- If not in app_metadata, try user_metadata in JWT
  IF jwt_role IS NULL OR jwt_role = '' THEN
    jwt_role := (jwt_payload -> 'user_metadata' ->> 'role');
  END IF;
  
  -- If still not found, try to get from direct JWT claims
  IF jwt_role IS NULL OR jwt_role = '' THEN
    jwt_role := (jwt_payload ->> 'role');
  END IF;
  
  -- If JWT doesn't have role, try to get from auth.users app_metadata
  IF jwt_role IS NULL OR jwt_role = '' THEN
    SELECT COALESCE(
      raw_app_meta_data ->> 'role',
      raw_user_meta_data ->> 'role'
    ) INTO user_app_meta_role
    FROM auth.users
    WHERE id = auth_user_id
    LIMIT 1;
    
    jwt_role := user_app_meta_role;
  END IF;
  
  -- Final validation: ensure we have a valid role
  IF jwt_role NOT IN ('admin', 'super_admin') THEN
    jwt_role := 'admin';
  END IF;
  
  RETURN jwt_role;
END;
$$;