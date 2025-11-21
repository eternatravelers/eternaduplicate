/*
  # Fix update_trip_participant_counts Function Schema Qualification

  1. Problem
    - Function uses unqualified table names (trips, participants)
    - With search_path = '', function fails to find tables
    - This breaks payment insertions due to trigger chain

  2. Solution
    - Add public. schema qualification to all table references
    - Keep SECURITY DEFINER and search_path = '' for security

  3. Impact
    - Fixes payment insertion failures
    - Ensures trigger chain works correctly
*/

CREATE OR REPLACE FUNCTION public.update_trip_participant_counts()
RETURNS TRIGGER AS $$
DECLARE
  affected_trip_id uuid;
BEGIN
  -- Determine which trip_id was affected
  IF TG_OP = 'DELETE' THEN
    affected_trip_id := OLD.trip_id;
  ELSE
    affected_trip_id := NEW.trip_id;
  END IF;

  -- Update the trip's participant counts with schema-qualified table names
  UPDATE public.trips
  SET 
    confirmed_participant_count = (
      SELECT COUNT(*)
      FROM public.participants
      WHERE trip_id = affected_trip_id
        AND status IN ('confirmed', 'paid', 'lunas')
        AND (parent_participant_id IS NULL)
    ),
    pending_participant_count = (
      SELECT COUNT(*)
      FROM public.participants
      WHERE trip_id = affected_trip_id
        AND status IN ('pending', 'dp_paid')
        AND (parent_participant_id IS NULL)
    ),
    available_quota = CASE 
      WHEN quota IS NOT NULL THEN 
        quota - (
          SELECT COUNT(*)
          FROM public.participants
          WHERE trip_id = affected_trip_id
            AND status IN ('confirmed', 'paid', 'lunas')
            AND (parent_participant_id IS NULL)
        )
      ELSE NULL
    END,
    can_accept_registrations = (
      status = 'open' AND (
        quota IS NULL OR quota > (
          SELECT COUNT(*)
          FROM public.participants
          WHERE trip_id = affected_trip_id
            AND status IN ('confirmed', 'paid', 'lunas')
            AND (parent_participant_id IS NULL)
        )
      )
    ),
    readiness_score = public.calculate_trip_readiness_score(affected_trip_id)
  WHERE id = affected_trip_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO '';
