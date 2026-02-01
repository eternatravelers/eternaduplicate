/*
  # Fix DELETE trigger permissions for participants

  1. Issue
    - DELETE on participants fails with 403 because the trigger function needs
      to execute within the proper security context
    - The update_trip_participant_counts trigger needs appropriate permissions
      to access both participants and trips tables
    - The search_path is set to empty which causes lookup failures

  2. Solution
    - Update the trigger function to use public schema explicitly
    - Ensure the function can execute DELETE operations properly
    - Add proper search_path configuration

  3. Changes
    - Recreate update_trip_participant_counts with fixed search_path
    - Ensure it can read from participants and write to trips
*/

-- Drop and recreate the function with proper search_path
DROP TRIGGER IF EXISTS update_participant_counts_trigger ON public.participants;

DROP FUNCTION IF EXISTS public.update_trip_participant_counts();

CREATE FUNCTION public.update_trip_participant_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  affected_trip_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    affected_trip_id := OLD.trip_id;
  ELSE
    affected_trip_id := NEW.trip_id;
  END IF;

  UPDATE public.trips
  SET 
    confirmed_participant_count = (
      SELECT COUNT(*)
      FROM public.participants
      WHERE trip_id = affected_trip_id
      AND status IN ('confirmed', 'paid', 'lunas')
    ),
    pending_participant_count = (
      SELECT COUNT(*)
      FROM public.participants
      WHERE trip_id = affected_trip_id
      AND status IN ('pending', 'dp_paid')
    ),
    available_quota = CASE 
      WHEN quota IS NOT NULL THEN 
        quota - (
          SELECT COUNT(*)
          FROM public.participants
          WHERE trip_id = affected_trip_id
        )
      ELSE NULL
    END,
    can_accept_registrations = (
      status = 'open' AND (
        quota IS NULL OR quota > (
          SELECT COUNT(*)
          FROM public.participants
          WHERE trip_id = affected_trip_id
        )
      )
    ),
    readiness_score = public.calculate_trip_readiness_score(affected_trip_id)
  WHERE id = affected_trip_id;

  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER update_participant_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.participants
FOR EACH ROW
EXECUTE FUNCTION public.update_trip_participant_counts();
