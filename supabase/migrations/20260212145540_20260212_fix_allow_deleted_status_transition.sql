/*
  # Fix: Allow Trip Deletion from Any Status

  ## Problem
  - Migration 20251121230523 overwrote the deleted status support
  - Users cannot soft-delete trips with status 'cancelled'
  - Error: "Status tidak dapat diubah dari cancelled ke deleted"

  ## Solution
  - Update validate_trip_status_transition function
  - Allow transitions to 'deleted' from any status (like 'cancelled')
  - Maintain all other validation rules

  ## Changes
  1. Drop and recreate validate_trip_status_transition function
  2. Add 'deleted' status alongside 'cancelled' in early exit check
  3. Keep all other business rules intact
*/

-- Drop existing function
DROP FUNCTION IF EXISTS validate_trip_status_transition(uuid, text, text);

-- Recreate function with deleted status support
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
SET search_path = public
AS $$
DECLARE
  has_resources boolean;
  has_meeting_points boolean;
  days_until_departure integer;
  capacity_percentage numeric;
  trip_quota integer;
  confirmed_count integer;
  bus_count integer;
  driver_count integer;
  tour_leader_count integer;
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
    -- Check if minimum resources are assigned via resource_schedules
    -- Count active schedules for each resource type
    SELECT COUNT(*) INTO bus_count
    FROM public.resource_schedules
    WHERE trip_id = trip_id_param
      AND resource_type = 'bus'
      AND status IN ('scheduled', 'confirmed', 'in_progress');

    SELECT COUNT(*) INTO driver_count
    FROM public.resource_schedules
    WHERE trip_id = trip_id_param
      AND resource_type = 'driver'
      AND status IN ('scheduled', 'confirmed', 'in_progress');

    SELECT COUNT(*) INTO tour_leader_count
    FROM public.resource_schedules
    WHERE trip_id = trip_id_param
      AND resource_type = 'tour_leader'
      AND status IN ('scheduled', 'confirmed', 'in_progress');

    -- Check if all required resources are present
    has_resources := (bus_count > 0 AND driver_count > 0 AND tour_leader_count > 0);

    SELECT EXISTS(SELECT 1 FROM public.trip_meeting_points WHERE trip_id = trip_id_param)
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
    FROM public.trips t
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

  -- DRAFT → CANCELLED
  IF old_status = 'draft' AND new_status = 'cancelled' THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- Backward transitions (for fixing issues)
  -- OPEN → DRAFT (can go back to edit)
  IF old_status = 'open' AND new_status = 'draft' THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- CONFIRMED → OPEN (if need to re-open for more registrations)
  IF old_status = 'confirmed' AND new_status = 'open' THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- ACTIVE → OPEN (support for legacy 'active' status)
  IF old_status = 'active' AND new_status = 'open' THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- ACTIVE → CONFIRMED (support for legacy 'active' status)
  IF old_status = 'active' AND new_status = 'confirmed' THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- Invalid transition
  RETURN QUERY SELECT false, format('Status tidak dapat diubah dari %s ke %s', old_status, new_status)::text;
  RETURN;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_trip_status_transition TO authenticated;