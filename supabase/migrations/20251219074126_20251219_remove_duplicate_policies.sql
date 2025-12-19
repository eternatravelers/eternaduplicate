/*
  # Remove duplicate and conflicting RLS policies

  1. Issue
    - Duplicate policies causing confusion: "Allow authenticated users to view participants" vs "Participants select for authenticated"
    - Duplicate insert policies
    - Conflicting update/delete policies

  2. Changes
    - Drop old duplicate policies with "Allow authenticated users" naming
    - Keep only the newer "Participants *" policies
    - This ensures consistent and correct RLS behavior
*/

DROP POLICY IF EXISTS "Allow authenticated users to view participants" ON participants;
DROP POLICY IF EXISTS "Allow authenticated users to insert participants" ON participants;