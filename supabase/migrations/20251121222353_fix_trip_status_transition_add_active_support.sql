/*
  # Fix Trip Status Transition - Add Active Status Support

  ## Problem
  Users cannot change trip status from 'draft' to 'active' because the validation function
  only allows 'draft' → 'open' transition. This causes confusion as UI shows 'active' as legacy option.

  ## Solution
  Update the validate_trip_status_transition function to:
  1. Treat 'active' as equivalent to 'open' for backward compatibility
  2. Allow 'draft' → 'active' transition (same requirements as 'draft' → 'open')
  3. Auto-convert 'active' status display to 'open' in future queries

  ## Changes
  - Update validate_trip_status_transition to support draft → active
  - Both 'open' and 'active' treated the same way
*/

-- Update the validation function to support 'active' status
CREATE OR REPLACE FUNCTION public.validate_trip_status_transition(
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
  normalized_old_status text;
  normalized_new_status text;
BEGIN
  -- Normalize 'active' to 'open' for backward compatibility
  normalized_old_status := CASE WHEN old_status = 'active' THEN 'open' ELSE old_status END;
  normalized_new_status := CASE WHEN new_status = 'active' THEN 'open' ELSE new_status END;

  -- Same status is always valid
  IF normalized_old_status = normalized_new_status THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- CANCELLED can be reached from any status
  IF normalized_new_status = 'cancelled' THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- DRAFT → OPEN (or ACTIVE)
  IF normalized_old_status = 'draft' AND normalized_new_status = 'open' THEN
    -- Check if minimum resources are assigned
    SELECT 
      EXISTS(SELECT 1 FROM public.trip_buses tb WHERE tb.trip_id = trip_id_param) AND
      EXISTS(SELECT 1 FROM public.trip_drivers td WHERE td.trip_id = trip_id_param) AND
      EXISTS(SELECT 1 FROM public.trip_tour_leaders ttl WHERE ttl.trip_id = trip_id_param)
    INTO has_resources;

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
  IF normalized_old_status = 'open' AND normalized_new_status = 'confirmed' THEN
    -- Get trip details
    SELECT 
      EXTRACT(DAY FROM (t.departure_date - CURRENT_DATE)),
      t.quota,
      t.confirmed_participant_count
    INTO days_until_departure, trip_quota, confirmed_count
    FROM public.trips t
    WHERE t.id = trip_id_param;

    -- Check H-7 requirement
    IF days_until_departure > 7 THEN
      RETURN QUERY SELECT false, FORMAT('Trip hanya bisa dikonfirmasi H-7 atau kurang. Saat ini H-%s', days_until_departure)::text;
      RETURN;
    END IF;

    -- Check capacity requirement (80%)
    IF trip_quota IS NOT NULL AND trip_quota > 0 THEN
      capacity_percentage := (confirmed_count::numeric / trip_quota::numeric) * 100;
      IF capacity_percentage < 80 THEN
        RETURN QUERY SELECT false, FORMAT('Trip harus minimal 80%% penuh untuk dikonfirmasi. Saat ini: %s%%', ROUND(capacity_percentage, 1))::text;
        RETURN;
      END IF;
    ELSE
      RETURN QUERY SELECT false, 'Trip harus memiliki quota untuk dikonfirmasi'::text;
      RETURN;
    END IF;

    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- CONFIRMED → ONGOING
  IF normalized_old_status = 'confirmed' AND normalized_new_status = 'ongoing' THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- ONGOING → COMPLETED
  IF normalized_old_status = 'ongoing' AND normalized_new_status = 'completed' THEN
    RETURN QUERY SELECT true, NULL::text;
    RETURN;
  END IF;

  -- OPEN → CANCELLED (already handled above)
  -- CONFIRMED → CANCELLED (already handled above)

  -- Invalid transition
  RETURN QUERY SELECT false, FORMAT('Transisi dari status %s ke %s tidak diizinkan', normalized_old_status, normalized_new_status)::text;
END;
$$;