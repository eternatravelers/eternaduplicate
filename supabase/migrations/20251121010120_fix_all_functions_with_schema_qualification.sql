/*
  # Fix all functions to use proper schema qualification

  ## Updates
  1. check_trip_can_accept_registrations - add public schema
  2. calculate_trip_readiness_score - use resource_schedules + public schema
  3. enforce_trip_status_rules - use public schema
*/

-- Fix check_trip_can_accept_registrations
CREATE OR REPLACE FUNCTION public.check_trip_can_accept_registrations(trip_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  trip_status text;
  trip_quota integer;
  confirmed_count integer;
BEGIN
  SELECT status, quota, confirmed_participant_count
  INTO trip_status, trip_quota, confirmed_count
  FROM public.trips
  WHERE id = trip_id_param;

  -- Can accept if status is 'open' and there's available quota
  RETURN trip_status = 'open' AND (trip_quota IS NULL OR confirmed_count < trip_quota);
END;
$$;

-- Fix calculate_trip_readiness_score to use resource_schedules
CREATE OR REPLACE FUNCTION public.calculate_trip_readiness_score(trip_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  score integer := 0;
  is_trip_template boolean;
  has_bus boolean;
  has_driver boolean;
  has_tour_leader boolean;
  has_cost_plan boolean;
  has_meeting_points boolean;
  checklist_completion integer;
BEGIN
  -- Check if this is a template
  SELECT is_template INTO is_trip_template FROM public.trips WHERE id = trip_id_param;
  
  IF is_trip_template THEN
    RETURN 100;
  END IF;

  -- Check bus from resource_schedules
  SELECT EXISTS(
    SELECT 1 FROM public.resource_schedules 
    WHERE trip_id = trip_id_param AND bus_id IS NOT NULL
  ) OR (SELECT bus_id IS NOT NULL FROM public.trips WHERE id = trip_id_param)
  INTO has_bus;
  IF has_bus THEN score := score + 20; END IF;

  -- Check driver from resource_schedules  
  SELECT EXISTS(
    SELECT 1 FROM public.resource_schedules 
    WHERE trip_id = trip_id_param AND driver_id IS NOT NULL
  ) OR (SELECT driver_id IS NOT NULL FROM public.trips WHERE id = trip_id_param)
  INTO has_driver;
  IF has_driver THEN score := score + 20; END IF;

  -- Check tour leader from resource_schedules
  SELECT EXISTS(
    SELECT 1 FROM public.resource_schedules 
    WHERE trip_id = trip_id_param AND tour_leader_id IS NOT NULL
  ) OR (SELECT tour_leader_id IS NOT NULL FROM public.trips WHERE id = trip_id_param)
  INTO has_tour_leader;
  IF has_tour_leader THEN score := score + 20; END IF;

  -- Check cost plan
  SELECT cost_plan_id IS NOT NULL INTO has_cost_plan
  FROM public.trips WHERE id = trip_id_param;
  IF has_cost_plan THEN score := score + 15; END IF;

  -- Check meeting points
  SELECT EXISTS(
    SELECT 1 FROM public.trip_meeting_points WHERE trip_id = trip_id_param
  ) INTO has_meeting_points;
  IF has_meeting_points THEN score := score + 15; END IF;

  -- Check checklist completion
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'checklists') THEN
    SELECT COALESCE(
      ROUND(
        (COUNT(CASE WHEN completed THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 10
      )::integer,
      0
    )
    INTO checklist_completion
    FROM public.checklists
    WHERE trip_id = trip_id_param;
    
    score := score + checklist_completion;
  END IF;

  RETURN score;
END;
$$;

-- Fix enforce_trip_status_rules
CREATE OR REPLACE FUNCTION public.enforce_trip_status_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  validation_result record;
BEGIN
  -- Only check if status is changing
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT * INTO validation_result
    FROM public.validate_trip_status_transition(NEW.id, OLD.status, NEW.status)
    LIMIT 1;

    IF NOT validation_result.is_valid THEN
      RAISE EXCEPTION '%', validation_result.error_message;
    END IF;
  END IF;

  -- Update readiness score and can_accept_registrations
  NEW.readiness_score := public.calculate_trip_readiness_score(NEW.id);
  NEW.can_accept_registrations := public.check_trip_can_accept_registrations(NEW.id);

  RETURN NEW;
END;
$$;

-- Create trigger function for resource changes
CREATE OR REPLACE FUNCTION public.trigger_calculate_trip_readiness()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.trips
  SET readiness_score = public.calculate_trip_readiness_score(COALESCE(NEW.trip_id, OLD.trip_id))
  WHERE id = COALESCE(NEW.trip_id, OLD.trip_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop old triggers
DROP TRIGGER IF EXISTS update_trip_readiness_on_bus ON public.trip_buses;
DROP TRIGGER IF EXISTS update_trip_readiness_on_driver ON public.trip_drivers;
DROP TRIGGER IF EXISTS update_trip_readiness_on_tour_leader ON public.trip_tour_leaders;
DROP TRIGGER IF EXISTS update_trip_readiness_on_resource_schedule ON public.resource_schedules;
DROP TRIGGER IF EXISTS update_trip_readiness_on_meeting_point ON public.trip_meeting_points;
DROP TRIGGER IF EXISTS update_trip_readiness_on_checklist ON public.checklists;

-- Create new triggers
CREATE TRIGGER update_trip_readiness_on_resource_schedule
AFTER INSERT OR UPDATE OR DELETE ON public.resource_schedules
FOR EACH ROW
EXECUTE FUNCTION public.trigger_calculate_trip_readiness();

CREATE TRIGGER update_trip_readiness_on_meeting_point
AFTER INSERT OR UPDATE OR DELETE ON public.trip_meeting_points
FOR EACH ROW
EXECUTE FUNCTION public.trigger_calculate_trip_readiness();

CREATE TRIGGER update_trip_readiness_on_checklist
AFTER INSERT OR UPDATE OR DELETE ON public.checklists
FOR EACH ROW
EXECUTE FUNCTION public.trigger_calculate_trip_readiness();

-- Recalculate all trip readiness scores
UPDATE public.trips
SET readiness_score = public.calculate_trip_readiness_score(id)
WHERE status NOT IN ('deleted', 'cancelled');
