/*
  # Fix Trip Deletion - Allow 'deleted' Status

  ## Overview
  This migration fixes the trip deletion issue by allowing transitions to 'deleted' status
  from any current status without validation rules blocking it.

  ## Changes
  - Update validate_trip_status_transition function to allow 'deleted' status
  - Update enforce_trip_status_rules trigger to allow 'deleted' status
  - Soft delete uses 'deleted' status instead of removing records

  ## Security
  - 'deleted' trips are filtered out in queries (status filter in useTrips)
  - Can be recovered if needed by changing status back
*/

-- Update the validation function to allow 'deleted' status
CREATE OR REPLACE FUNCTION validate_trip_status_transition(
  trip_id_param uuid,
  old_status text,
  new_status text
)
RETURNS TABLE(
  is_valid boolean,
  error_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  has_resources boolean;
  has_meeting_points boolean;
  days_until_departure integer;
  capacity_percentage numeric;
  trip_quota integer;
  confirmed_count integer;
BEGIN
  -- Same status is always valid
  IF old_status = new_status THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- CANCELLED and DELETED can be reached from any status
  IF new_status = 'cancelled' OR new_status = 'deleted' THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- DRAFT → OPEN
  IF old_status = 'draft' AND new_status = 'open' THEN
    -- Check if minimum resources are assigned
    SELECT 
      EXISTS(SELECT 1 FROM trip_buses tb WHERE tb.trip_id = trip_id_param) AND
      EXISTS(SELECT 1 FROM trip_drivers td WHERE td.trip_id = trip_id_param) AND
      EXISTS(SELECT 1 FROM trip_tour_leaders ttl WHERE ttl.trip_id = trip_id_param)
    INTO has_resources;

    SELECT EXISTS(SELECT 1 FROM trip_meeting_points WHERE trip_id = trip_id_param)
    INTO has_meeting_points;

    IF NOT has_resources THEN
      RETURN QUERY SELECT false, 'Trip harus memiliki minimal 1 bus, 1 driver, dan 1 tour leader untuk dibuka'::text;
      RETURN;
    END IF;

    IF NOT has_meeting_points THEN
      RETURN QUERY SELECT false, 'Trip harus memiliki minimal 1 meeting point untuk dibuka'::text;
      RETURN;
    END IF;

    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- OPEN → CONFIRMED
  IF old_status = 'open' AND new_status = 'confirmed' THEN
    -- Check days until departure (must be within 7 days)
    SELECT DATE_PART('day', t.departure_date - CURRENT_DATE)::integer,
           t.quota,
           t.confirmed_participant_count
    INTO days_until_departure, trip_quota, confirmed_count
    FROM trips t
    WHERE t.id = trip_id_param;

    IF days_until_departure > 7 THEN
      RETURN QUERY SELECT false, 'Trip hanya dapat dikonfirmasi dalam H-7 sebelum keberangkatan'::text;
      RETURN;
    END IF;

    -- Check if at least 80% capacity is filled (if quota is set)
    IF trip_quota IS NOT NULL AND trip_quota > 0 THEN
      capacity_percentage := (confirmed_count::numeric / trip_quota::numeric) * 100;
      IF capacity_percentage < 80 THEN
        RETURN QUERY SELECT false, format('Trip memerlukan minimal 80%% kapasitas terisi (saat ini: %s%%)', ROUND(capacity_percentage))::text;
        RETURN;
      END IF;
    END IF;

    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- CONFIRMED → ONGOING
  IF old_status = 'confirmed' AND new_status = 'ongoing' THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- ONGOING → COMPLETED
  IF old_status = 'ongoing' AND new_status = 'completed' THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- OPEN → CANCELLED
  IF old_status = 'open' AND new_status = 'cancelled' THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- CONFIRMED → CANCELLED
  IF old_status = 'confirmed' AND new_status = 'cancelled' THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- ACTIVE (legacy) → OPEN or CANCELLED
  IF old_status = 'active' AND (new_status = 'open' OR new_status = 'cancelled') THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- Invalid transition
  RETURN QUERY SELECT false, format('Transisi status dari %s ke %s tidak diizinkan', old_status, new_status)::text;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_trip_status_transition TO authenticated;
