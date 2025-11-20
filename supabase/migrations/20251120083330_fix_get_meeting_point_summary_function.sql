/*
  # Fix get_meeting_point_summary Function
  
  ## Problem
  Function was checking for bus_id column in meeting_point_assignments table which doesn't exist.
  Transportation assignment is done via meeting_point_buses junction table.
  
  ## Solution
  Update the function to check meeting_point_buses table for transportation assignment.
*/

-- Drop the existing function
DROP FUNCTION IF EXISTS get_meeting_point_summary(uuid);

-- Recreate with correct logic
CREATE OR REPLACE FUNCTION get_meeting_point_summary(p_trip_id uuid)
RETURNS TABLE (
  meeting_point_name text,
  participant_count bigint,
  registration_count bigint,
  has_pickup_schedule boolean,
  has_transportation_assigned boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH trip_meeting_points_list AS (
    -- Get all meeting points configured for this trip
    SELECT mp.name as meeting_point_name
    FROM trip_meeting_points tmp
    JOIN meeting_points mp ON mp.id = tmp.meeting_point_id
    WHERE tmp.trip_id = p_trip_id
      AND mp.is_active = true
  ),
  participant_data AS (
    -- Get participant counts per meeting point
    SELECT 
      COALESCE(p.meeting_point_details, t.meeting_point) as meeting_point_name,
      SUM(COALESCE(p.participant_count, 1))::bigint as participant_count,
      COUNT(p.id)::bigint as registration_count
    FROM participants p
    JOIN trips t ON t.id = p.trip_id
    WHERE p.trip_id = p_trip_id
      AND p.deleted_at IS NULL
      AND p.parent_participant_id IS NULL
    GROUP BY COALESCE(p.meeting_point_details, t.meeting_point)
  )
  SELECT 
    tmp.meeting_point_name,
    COALESCE(pd.participant_count, 0) as participant_count,
    COALESCE(pd.registration_count, 0) as registration_count,
    EXISTS(
      SELECT 1 FROM pickup_schedules ps 
      WHERE ps.trip_id = p_trip_id 
        AND ps.meeting_point_name = tmp.meeting_point_name
    ) as has_pickup_schedule,
    EXISTS(
      SELECT 1 FROM meeting_point_assignments mpa 
      JOIN meeting_point_buses mpb ON mpb.meeting_point_assignment_id = mpa.id
      WHERE mpa.trip_id = p_trip_id 
        AND mpa.meeting_point_name = tmp.meeting_point_name
    ) as has_transportation_assigned
  FROM trip_meeting_points_list tmp
  LEFT JOIN participant_data pd ON pd.meeting_point_name = tmp.meeting_point_name
  ORDER BY 
    CASE WHEN pd.participant_count IS NULL THEN 1 ELSE 0 END,
    pd.participant_count DESC NULLS LAST,
    tmp.meeting_point_name;
END;
$$;
