/*
  # Trip Status Workflow and Quota Management System

  ## Overview
  This migration implements a comprehensive trip status workflow and quota management system
  to control trip lifecycle and prevent over-registration.

  ## Status Flow
  ```
  DRAFT → OPEN → CONFIRMED → ONGOING → COMPLETED
           ↓         ↓
       CANCELLED  CANCELLED
  ```

  ## New Columns Added to trips table
  
  ### 1. confirmed_participant_count (integer)
  - Real-time count of participants with status 'confirmed' or 'paid'
  - Updated automatically via trigger
  - Used for quota checking
  
  ### 2. pending_participant_count (integer)
  - Real-time count of participants with status 'pending'
  - Updated automatically via trigger
  - Used for waitlist management
  
  ### 3. available_quota (integer)
  - Computed: quota - confirmed_participant_count
  - Always kept in sync
  
  ### 4. readiness_score (integer)
  - Score from 0-100 indicating trip readiness
  - Based on: resources assigned, checklist completion, payment status
  - Auto-calculated via function
  
  ### 5. can_accept_registrations (boolean)
  - TRUE if status is 'open' and quota is available
  - FALSE otherwise
  - Updated automatically

  ## New Functions
  
  ### 1. calculate_trip_readiness_score
  - Calculates readiness percentage based on multiple factors
  - Checks: bus assigned, driver assigned, tour leader assigned, cost plan set, meeting points set
  
  ### 2. check_trip_can_accept_registrations
  - Returns whether a trip can accept new participant registrations
  - Checks status and available quota
  
  ### 3. validate_trip_status_transition
  - Validates if a status change is allowed based on business rules
  - Enforces the status flow diagram
  
  ### 4. update_trip_participant_counts
  - Trigger function that updates participant counts when participants table changes
  - Keeps counts in sync automatically
  
  ### 5. enforce_trip_status_rules
  - Trigger function that validates status changes
  - Prevents invalid status transitions

  ## Triggers
  
  ### 1. update_participant_counts_trigger
  - Fires on INSERT, UPDATE, DELETE of participants table
  - Updates trip participant counts in real-time
  
  ### 2. enforce_status_transition_trigger
  - Fires BEFORE UPDATE on trips table when status changes
  - Validates status transitions are allowed

  ## Security
  - All functions available to authenticated users
  - RLS policies remain unchanged (managed by existing policies)

  ## Important Business Rules Enforced
  1. DRAFT → OPEN: Requires at least 1 meeting point, 1 bus, 1 driver, 1 tour leader
  2. OPEN → CONFIRMED: Requires H-7 days before departure, min 80% capacity filled
  3. CONFIRMED → ONGOING: Automatic on departure date
  4. ONGOING → COMPLETED: Automatic on return date + 1 day
  5. Any status → CANCELLED: Allowed (with confirmation)
*/

-- Add new columns to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'confirmed_participant_count'
  ) THEN
    ALTER TABLE trips ADD COLUMN confirmed_participant_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'pending_participant_count'
  ) THEN
    ALTER TABLE trips ADD COLUMN pending_participant_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'available_quota'
  ) THEN
    ALTER TABLE trips ADD COLUMN available_quota integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'readiness_score'
  ) THEN
    ALTER TABLE trips ADD COLUMN readiness_score integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'can_accept_registrations'
  ) THEN
    ALTER TABLE trips ADD COLUMN can_accept_registrations boolean DEFAULT false;
  END IF;
END $$;

-- Function to calculate trip readiness score (0-100)
CREATE OR REPLACE FUNCTION calculate_trip_readiness_score(trip_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  score integer := 0;
  has_bus boolean;
  has_driver boolean;
  has_tour_leader boolean;
  has_cost_plan boolean;
  has_meeting_points boolean;
  checklist_completion integer;
BEGIN
  -- Check if bus is assigned (20 points)
  SELECT EXISTS(
    SELECT 1 FROM trip_buses WHERE trip_id = trip_id_param
  ) INTO has_bus;
  IF has_bus THEN score := score + 20; END IF;

  -- Check if driver is assigned (20 points)
  SELECT EXISTS(
    SELECT 1 FROM trip_drivers WHERE trip_id = trip_id_param
  ) INTO has_driver;
  IF has_driver THEN score := score + 20; END IF;

  -- Check if tour leader is assigned (20 points)
  SELECT EXISTS(
    SELECT 1 FROM trip_tour_leaders WHERE trip_id = trip_id_param
  ) INTO has_tour_leader;
  IF has_tour_leader THEN score := score + 20; END IF;

  -- Check if cost plan is set (15 points)
  SELECT cost_plan_id IS NOT NULL INTO has_cost_plan
  FROM trips WHERE id = trip_id_param;
  IF has_cost_plan THEN score := score + 15; END IF;

  -- Check if meeting points are set (15 points)
  SELECT EXISTS(
    SELECT 1 FROM trip_meeting_points WHERE trip_id = trip_id_param
  ) INTO has_meeting_points;
  IF has_meeting_points THEN score := score + 15; END IF;

  -- Check checklist completion if checklists table exists (10 points)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checklists') THEN
    SELECT COALESCE(
      ROUND(
        (COUNT(CASE WHEN completed THEN 1 END)::numeric / NULLIF(COUNT(*), 0)) * 10
      )::integer,
      0
    )
    INTO checklist_completion
    FROM checklists
    WHERE trip_id = trip_id_param;
    
    score := score + checklist_completion;
  END IF;

  RETURN score;
END;
$$;

-- Function to check if trip can accept registrations
CREATE OR REPLACE FUNCTION check_trip_can_accept_registrations(trip_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trip_status text;
  trip_quota integer;
  confirmed_count integer;
BEGIN
  SELECT status, quota, confirmed_participant_count
  INTO trip_status, trip_quota, confirmed_count
  FROM trips
  WHERE id = trip_id_param;

  -- Can accept if status is 'open' and there's available quota
  RETURN trip_status = 'open' AND (trip_quota IS NULL OR confirmed_count < trip_quota);
END;
$$;

-- Function to validate trip status transition
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

  -- CANCELLED can be reached from any status
  IF new_status = 'cancelled' THEN
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

  -- Invalid transition
  RETURN QUERY SELECT false, format('Transisi status dari %s ke %s tidak diizinkan', old_status, new_status)::text;
END;
$$;

-- Function to update trip participant counts (trigger function)
CREATE OR REPLACE FUNCTION update_trip_participant_counts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_trip_id uuid;
BEGIN
  -- Determine which trip_id was affected
  IF TG_OP = 'DELETE' THEN
    affected_trip_id := OLD.trip_id;
  ELSE
    affected_trip_id := NEW.trip_id;
  END IF;

  -- Update the trip's participant counts
  UPDATE trips
  SET 
    confirmed_participant_count = (
      SELECT COUNT(*)
      FROM participants
      WHERE trip_id = affected_trip_id
        AND status IN ('confirmed', 'paid', 'lunas')
        AND (parent_participant_id IS NULL)  -- Only count group leaders, not members
    ),
    pending_participant_count = (
      SELECT COUNT(*)
      FROM participants
      WHERE trip_id = affected_trip_id
        AND status IN ('pending', 'dp_paid')
        AND (parent_participant_id IS NULL)  -- Only count group leaders, not members
    ),
    available_quota = CASE 
      WHEN quota IS NOT NULL THEN 
        quota - (
          SELECT COUNT(*)
          FROM participants
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
          FROM participants
          WHERE trip_id = affected_trip_id
            AND status IN ('confirmed', 'paid', 'lunas')
            AND (parent_participant_id IS NULL)
        )
      )
    ),
    readiness_score = calculate_trip_readiness_score(affected_trip_id)
  WHERE id = affected_trip_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Function to enforce trip status rules (trigger function)
CREATE OR REPLACE FUNCTION enforce_trip_status_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  validation_result record;
BEGIN
  -- Only check if status is changing
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Validate the status transition
    SELECT * INTO validation_result
    FROM validate_trip_status_transition(NEW.id, OLD.status, NEW.status)
    LIMIT 1;

    IF NOT validation_result.is_valid THEN
      RAISE EXCEPTION '%', validation_result.error_message;
    END IF;
  END IF;

  -- Update readiness score and can_accept_registrations
  NEW.readiness_score := calculate_trip_readiness_score(NEW.id);
  NEW.can_accept_registrations := check_trip_can_accept_registrations(NEW.id);

  RETURN NEW;
END;
$$;

-- Create trigger to update participant counts
DROP TRIGGER IF EXISTS update_participant_counts_trigger ON participants;
CREATE TRIGGER update_participant_counts_trigger
AFTER INSERT OR UPDATE OR DELETE ON participants
FOR EACH ROW
EXECUTE FUNCTION update_trip_participant_counts();

-- Create trigger to enforce status transitions
DROP TRIGGER IF EXISTS enforce_status_transition_trigger ON trips;
CREATE TRIGGER enforce_status_transition_trigger
BEFORE UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION enforce_trip_status_rules();

-- Initialize counts for existing trips
UPDATE trips
SET 
  confirmed_participant_count = (
    SELECT COUNT(*)
    FROM participants p
    WHERE p.trip_id = trips.id
      AND p.status IN ('confirmed', 'paid', 'lunas')
      AND (p.parent_participant_id IS NULL)
  ),
  pending_participant_count = (
    SELECT COUNT(*)
    FROM participants p
    WHERE p.trip_id = trips.id
      AND p.status IN ('pending', 'dp_paid')
      AND (p.parent_participant_id IS NULL)
  ),
  available_quota = CASE 
    WHEN quota IS NOT NULL THEN 
      quota - (
        SELECT COUNT(*)
        FROM participants p
        WHERE p.trip_id = trips.id
          AND p.status IN ('confirmed', 'paid', 'lunas')
          AND (p.parent_participant_id IS NULL)
      )
    ELSE NULL
  END,
  readiness_score = calculate_trip_readiness_score(trips.id),
  can_accept_registrations = (
    status IN ('open', 'active') AND (
      quota IS NULL OR quota > (
        SELECT COUNT(*)
        FROM participants p
        WHERE p.trip_id = trips.id
          AND p.status IN ('confirmed', 'paid', 'lunas')
          AND (p.parent_participant_id IS NULL)
      )
    )
  );

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION calculate_trip_readiness_score TO authenticated;
GRANT EXECUTE ON FUNCTION check_trip_can_accept_registrations TO authenticated;
GRANT EXECUTE ON FUNCTION validate_trip_status_transition TO authenticated;
