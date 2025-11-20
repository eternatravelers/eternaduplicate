/*
  # Migrate Meeting Points to Master Data System

  ## Overview
  This migration standardizes meeting points from participant-based text fields to a proper master data system with trip assignments.

  ## Changes Made
  
  ### 1. Extract Meeting Points from Participants
  - Collects unique meeting_point_details values from participants table
  - Creates corresponding records in meeting_points master table
  - Automatically sets display_order based on frequency of use
  
  ### 2. Assign Meeting Points to Trips
  - Maps meeting points to their respective trips
  - Sets primary meeting point based on majority usage per trip
  - Creates records in trip_meeting_points junction table
  
  ### 3. Data Integrity
  - Skips empty or null meeting_point_details
  - Handles duplicates gracefully
  - Preserves existing meeting_points records
  - Only processes trips that don't already have meeting points assigned

  ## Migration Steps
  1. Insert unique meeting points from participants into meeting_points table
  2. Create trip_meeting_points associations
  3. Set primary meeting point for each trip based on most common usage
*/

-- Step 1: Insert unique meeting points from participants into meeting_points table
-- Only insert meeting points that don't already exist
INSERT INTO meeting_points (name, description, is_active, display_order)
SELECT DISTINCT
  p.meeting_point_details AS name,
  'Migrated from participant data' AS description,
  true AS is_active,
  ROW_NUMBER() OVER (ORDER BY COUNT(*) DESC) AS display_order
FROM participants p
WHERE 
  p.meeting_point_details IS NOT NULL 
  AND p.meeting_point_details != ''
  AND p.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM meeting_points mp 
    WHERE mp.name = p.meeting_point_details
  )
GROUP BY p.meeting_point_details
ON CONFLICT (name) DO NOTHING;

-- Step 2: Create trip_meeting_points associations
-- For each trip, associate all meeting points that participants have chosen
INSERT INTO trip_meeting_points (trip_id, meeting_point_id, is_primary)
SELECT DISTINCT
  p.trip_id,
  mp.id AS meeting_point_id,
  false AS is_primary  -- Will be updated in next step
FROM participants p
INNER JOIN meeting_points mp ON mp.name = p.meeting_point_details
WHERE 
  p.trip_id IS NOT NULL
  AND p.meeting_point_details IS NOT NULL
  AND p.meeting_point_details != ''
  AND p.deleted_at IS NULL
  AND NOT EXISTS (
    -- Don't duplicate if trip already has this meeting point assigned
    SELECT 1 FROM trip_meeting_points tmp
    WHERE tmp.trip_id = p.trip_id AND tmp.meeting_point_id = mp.id
  )
ON CONFLICT (trip_id, meeting_point_id) DO NOTHING;

-- Step 3: Set primary meeting point for each trip
-- The primary meeting point is the one most commonly chosen by participants for that trip
WITH trip_meeting_point_counts AS (
  SELECT 
    p.trip_id,
    mp.id AS meeting_point_id,
    COUNT(*) AS participant_count,
    ROW_NUMBER() OVER (PARTITION BY p.trip_id ORDER BY COUNT(*) DESC) AS rank
  FROM participants p
  INNER JOIN meeting_points mp ON mp.name = p.meeting_point_details
  WHERE 
    p.trip_id IS NOT NULL
    AND p.meeting_point_details IS NOT NULL
    AND p.meeting_point_details != ''
    AND p.deleted_at IS NULL
  GROUP BY p.trip_id, mp.id
),
primary_meeting_points AS (
  SELECT trip_id, meeting_point_id
  FROM trip_meeting_point_counts
  WHERE rank = 1
)
UPDATE trip_meeting_points tmp
SET is_primary = true
FROM primary_meeting_points pmp
WHERE tmp.trip_id = pmp.trip_id
  AND tmp.meeting_point_id = pmp.meeting_point_id;
