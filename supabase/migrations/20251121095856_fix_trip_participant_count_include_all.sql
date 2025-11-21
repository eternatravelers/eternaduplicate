/*
  # Fix Trip Participant Count to Include All Participants

  1. Problem
    - Current system only counts group leaders (parent_participant_id IS NULL)
    - Should count ALL participants including group members
    - Total displayed should include both confirmed AND pending participants
    - Quota calculation should be based on total registered participants

  2. Solution
    - Update confirmed_participant_count to include group members
    - Update pending_participant_count to include group members
    - Calculate available_quota based on TOTAL participants (confirmed + pending)
    - Keep quota check based on all registered participants

  3. Changes
    - Modified COUNT queries to include ALL participants (removed parent_participant_id filter)
    - Updated available_quota calculation to subtract total participants
*/

CREATE OR REPLACE FUNCTION public.update_trip_participant_counts()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO '';
