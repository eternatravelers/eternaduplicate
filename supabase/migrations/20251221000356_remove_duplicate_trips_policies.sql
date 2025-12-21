/*
  # Remove duplicate trips RLS policies
  
  1. Removes
    - Admins can delete trips
    - Admins can create trips
    - Admins can update trips
    
  2. Keeps
    - Users can view all trips (SELECT)
    - Only admins can insert trips (INSERT)
    - Only admins can update trips (UPDATE)
    - Only admins can delete trips (DELETE)
*/

DROP POLICY IF EXISTS "Admins can delete trips" ON trips;
DROP POLICY IF EXISTS "Admins can create trips" ON trips;
DROP POLICY IF EXISTS "Admins can update trips" ON trips;