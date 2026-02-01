/*
  # Fix Trip Participant Count Calculation

  ## Problem
  The trigger was counting participant RECORDS using COUNT(*) instead of 
  counting total number of PEOPLE using SUM(participant_count).

  ## Solution
  Update the trigger function to:
  - Use SUM(participant_count) instead of COUNT(*)
  - Properly filter by deleted_at IS NULL
  - Filter out child participants (parent_participant_id IS NULL)
*/

CREATE OR REPLACE FUNCTION public.update_trip_participant_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_trip_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_trip_id := OLD.trip_id;
  ELSE
    affected_trip_id := NEW.trip_id;
  END IF;

  IF affected_trip_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  UPDATE public.trips
  SET 
    confirmed_participant_count = COALESCE((
      SELECT SUM(participant_count)
      FROM public.participants
      WHERE trip_id = affected_trip_id
        AND status IN ('confirmed', 'paid', 'lunas')
        AND deleted_at IS NULL
        AND parent_participant_id IS NULL
    ), 0),
    pending_participant_count = COALESCE((
      SELECT SUM(participant_count)
      FROM public.participants
      WHERE trip_id = affected_trip_id
        AND status IN ('pending', 'dp_paid')
        AND deleted_at IS NULL
        AND parent_participant_id IS NULL
    ), 0),
    available_quota = CASE 
      WHEN quota IS NOT NULL THEN 
        quota - COALESCE((
          SELECT SUM(participant_count)
          FROM public.participants
          WHERE trip_id = affected_trip_id
            AND deleted_at IS NULL
            AND parent_participant_id IS NULL
        ), 0)
      ELSE NULL
    END,
    can_accept_registrations = (
      status = 'open' AND (
        quota IS NULL OR quota > COALESCE((
          SELECT SUM(participant_count)
          FROM public.participants
          WHERE trip_id = affected_trip_id
            AND deleted_at IS NULL
            AND parent_participant_id IS NULL
        ), 0)
      )
    ),
    readiness_score = public.calculate_trip_readiness_score(affected_trip_id)
  WHERE id = affected_trip_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;
