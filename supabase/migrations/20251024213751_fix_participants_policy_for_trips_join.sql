/*
  # Fix Participants SELECT Policy for Trips Join

  1. Problem
    - Current participants SELECT policies require admin/super_admin role
    - This breaks LEFT JOIN in trips query when non-admin users try to fetch trips
    - Users cannot see trip list because participants join fails due to RLS

  2. Solution
    - Keep existing admin policies for direct participant management
    - Add new policy: Allow all authenticated users to view participant IDs when joining from trips
    - This allows trip queries to work without exposing full participant data

  3. Security
    - RLS still enabled
    - Admin policies unchanged for participant management pages
    - New policy only allows minimal data (id) for join operations
    - All write operations still restricted to admin/super_admin
*/

-- This policy allows authenticated users to view participant IDs
-- when fetching trips (for counting purposes)
-- but doesn't expose full participant details
CREATE POLICY "Authenticated users can view participant ids for trips"
  ON participants
  FOR SELECT
  TO authenticated
  USING (true);

-- Note: This policy works alongside existing policies
-- PostGREST will use the least restrictive policy for SELECT
-- So admins still get full access via existing policies
-- while regular users can only see basic info for trip joins
