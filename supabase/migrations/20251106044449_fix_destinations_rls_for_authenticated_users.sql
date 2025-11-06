/*
  # Fix destinations RLS policy for authenticated users
  
  Problem: Destinations table only allowed public read access, which blocked authenticated users
  from accessing destinations data when joining with transactions through Supabase queries.
  
  Solution: Add policy to allow authenticated users to read destinations
*/

CREATE POLICY "Allow authenticated users to read destinations"
  ON destinations
  FOR SELECT
  TO authenticated
  USING (true);
