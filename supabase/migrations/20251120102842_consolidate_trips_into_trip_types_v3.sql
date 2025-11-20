/*
  # Consolidate Trips into Trip Types (Option 2) - Final Version
  
  ## Overview
  This migration consolidates the trips and trip_types tables by:
  1. Removing unique constraint on name from trip_types
  2. Adding all necessary columns to trip_types
  3. Migrating all trip data to trip_types table
  4. Dropping the trips table
  5. Renaming trip_types to trips
  
  ## Changes
  
  ### 1. Schema Updates
  - Remove unique constraint on name (trips can have same name for different dates)
  - Add all columns from trips that don't exist in trip_types
  - Add is_template flag to distinguish templates from instances
  - Add template_id to link instances to their templates
  
  ### 2. Data Migration
  - Copy all trip records from trips to trip_types as individual instances
  - Preserve all trip metadata (dates, quota, status, resources, etc.)
  
  ### 3. Table Restructure
  - Drop the old trips table
  - Rename trip_types to trips
  
  ### 4. Security
  - Maintain all RLS policies
  - Preserve authentication and authorization rules
*/

-- Step 1: Remove unique constraint on name
ALTER TABLE trip_types DROP CONSTRAINT IF EXISTS trip_types_name_key;

-- Step 2: Add all necessary columns to trip_types
DO $$
BEGIN
  -- Basic trip information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'trip_type') THEN
    ALTER TABLE trip_types ADD COLUMN trip_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'departure_date') THEN
    ALTER TABLE trip_types ADD COLUMN departure_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'return_date') THEN
    ALTER TABLE trip_types ADD COLUMN return_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'meeting_point') THEN
    ALTER TABLE trip_types ADD COLUMN meeting_point text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'quota') THEN
    ALTER TABLE trip_types ADD COLUMN quota integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'price') THEN
    ALTER TABLE trip_types ADD COLUMN price numeric DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'additional_facilities') THEN
    ALTER TABLE trip_types ADD COLUMN additional_facilities text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'bus_number') THEN
    ALTER TABLE trip_types ADD COLUMN bus_number text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'driver_name') THEN
    ALTER TABLE trip_types ADD COLUMN driver_name text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'tour_leader') THEN
    ALTER TABLE trip_types ADD COLUMN tour_leader text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'status') THEN
    ALTER TABLE trip_types ADD COLUMN status text DEFAULT 'draft';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'tour_leader_id') THEN
    ALTER TABLE trip_types ADD COLUMN tour_leader_id uuid;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'pricing_type') THEN
    ALTER TABLE trip_types ADD COLUMN pricing_type text DEFAULT 'per_person';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'cost_plan_id') THEN
    ALTER TABLE trip_types ADD COLUMN cost_plan_id uuid;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'bus_id') THEN
    ALTER TABLE trip_types ADD COLUMN bus_id uuid;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'driver_id') THEN
    ALTER TABLE trip_types ADD COLUMN driver_id uuid;
  END IF;

  -- Status workflow columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'confirmed_participant_count') THEN
    ALTER TABLE trip_types ADD COLUMN confirmed_participant_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'pending_participant_count') THEN
    ALTER TABLE trip_types ADD COLUMN pending_participant_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'available_quota') THEN
    ALTER TABLE trip_types ADD COLUMN available_quota integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'readiness_score') THEN
    ALTER TABLE trip_types ADD COLUMN readiness_score integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'can_accept_registrations') THEN
    ALTER TABLE trip_types ADD COLUMN can_accept_registrations boolean DEFAULT false;
  END IF;

  -- Template/Instance distinction columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'is_template') THEN
    ALTER TABLE trip_types ADD COLUMN is_template boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_types' AND column_name = 'template_id') THEN
    ALTER TABLE trip_types ADD COLUMN template_id uuid;
  END IF;
END $$;

-- Step 3: Migrate data from trips to trip_types
INSERT INTO trip_types (
  id,
  name,
  trip_type,
  departure_date,
  return_date,
  meeting_point,
  quota,
  price,
  additional_facilities,
  bus_number,
  driver_name,
  tour_leader,
  status,
  tour_leader_id,
  pricing_type,
  cost_plan_id,
  bus_id,
  driver_id,
  confirmed_participant_count,
  pending_participant_count,
  available_quota,
  readiness_score,
  can_accept_registrations,
  is_template,
  template_id,
  created_at,
  updated_at
)
SELECT 
  id,
  name,
  trip_type,
  departure_date,
  return_date,
  meeting_point,
  quota,
  price,
  additional_facilities,
  bus_number,
  driver_name,
  tour_leader,
  status,
  tour_leader_id,
  pricing_type,
  cost_plan_id,
  bus_id,
  driver_id,
  confirmed_participant_count,
  pending_participant_count,
  available_quota,
  readiness_score,
  can_accept_registrations,
  false, -- These are actual trip instances, not templates
  NULL, -- No template reference for now
  created_at,
  updated_at
FROM trips
WHERE NOT EXISTS (
  SELECT 1 FROM trip_types tt WHERE tt.id = trips.id
);

-- Step 4: Drop triggers on old trips table
DROP TRIGGER IF EXISTS update_participant_counts_trigger ON participants;
DROP TRIGGER IF EXISTS enforce_status_transition_trigger ON trips;
DROP TRIGGER IF EXISTS update_trips_updated_at ON trips;

-- Step 5: Drop the old trips table
DROP TABLE IF EXISTS trips CASCADE;

-- Step 6: Rename trip_types to trips
ALTER TABLE trip_types RENAME TO trips;

-- Step 7: Add foreign key constraints
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cost_plans') THEN
    ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_cost_plan_id_fkey;
    ALTER TABLE trips ADD CONSTRAINT trips_cost_plan_id_fkey 
      FOREIGN KEY (cost_plan_id) REFERENCES cost_plans(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tour_leaders') THEN
    ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_tour_leader_id_fkey;
    ALTER TABLE trips ADD CONSTRAINT trips_tour_leader_id_fkey 
      FOREIGN KEY (tour_leader_id) REFERENCES tour_leaders(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'buses') THEN
    ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_bus_id_fkey;
    ALTER TABLE trips ADD CONSTRAINT trips_bus_id_fkey 
      FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE SET NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
    ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_driver_id_fkey;
    ALTER TABLE trips ADD CONSTRAINT trips_driver_id_fkey 
      FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL;
  END IF;

  -- Self-referencing foreign key for template
  ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_template_id_fkey;
  ALTER TABLE trips ADD CONSTRAINT trips_template_id_fkey 
    FOREIGN KEY (template_id) REFERENCES trips(id) ON DELETE SET NULL;
END $$;

-- Step 8: Recreate triggers
CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_participant_counts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON participants
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_participant_counts();

CREATE TRIGGER enforce_status_transition_trigger
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION enforce_trip_status_rules();

-- Step 9: Update functions to handle templates
CREATE OR REPLACE FUNCTION calculate_trip_readiness_score(trip_id_param uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
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
  SELECT is_template INTO is_trip_template FROM trips WHERE id = trip_id_param;
  
  -- Templates don't need readiness scores
  IF is_trip_template THEN
    RETURN 100;
  END IF;

  -- Check if bus is assigned (20 points)
  SELECT EXISTS(
    SELECT 1 FROM trip_buses WHERE trip_id = trip_id_param
  ) OR (SELECT bus_id IS NOT NULL FROM trips WHERE id = trip_id_param)
  INTO has_bus;
  IF has_bus THEN score := score + 20; END IF;

  -- Check if driver is assigned (20 points)
  SELECT EXISTS(
    SELECT 1 FROM trip_drivers WHERE trip_id = trip_id_param
  ) OR (SELECT driver_id IS NOT NULL FROM trips WHERE id = trip_id_param)
  INTO has_driver;
  IF has_driver THEN score := score + 20; END IF;

  -- Check if tour leader is assigned (20 points)
  SELECT EXISTS(
    SELECT 1 FROM trip_tour_leaders WHERE trip_id = trip_id_param
  ) OR (SELECT tour_leader_id IS NOT NULL FROM trips WHERE id = trip_id_param)
  INTO has_tour_leader;
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

-- Step 10: Create indexes
CREATE INDEX IF NOT EXISTS idx_trips_departure_date ON trips(departure_date);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_is_template ON trips(is_template);
CREATE INDEX IF NOT EXISTS idx_trips_template_id ON trips(template_id);
CREATE INDEX IF NOT EXISTS idx_trips_tour_leader_id ON trips(tour_leader_id);
CREATE INDEX IF NOT EXISTS idx_trips_cost_plan_id ON trips(cost_plan_id);
CREATE INDEX IF NOT EXISTS idx_trips_bus_id ON trips(bus_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);

-- Step 11: Update RLS policies
DROP POLICY IF EXISTS "Allow public read access to trips" ON trips;
DROP POLICY IF EXISTS "Allow authenticated users to manage trips" ON trips;
DROP POLICY IF EXISTS "Allow authenticated users to select trips" ON trips;
DROP POLICY IF EXISTS "Allow authenticated users to insert trips" ON trips;
DROP POLICY IF EXISTS "Allow authenticated users to update trips" ON trips;
DROP POLICY IF EXISTS "Allow authenticated users to delete trips" ON trips;

CREATE POLICY "Allow authenticated users to select trips"
  ON trips
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert trips"
  ON trips
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update trips"
  ON trips
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete trips"
  ON trips
  FOR DELETE
  TO authenticated
  USING (true);

-- Step 12: Initialize counts for migrated trips
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
  )
WHERE is_template = false;

-- Grant permissions
GRANT ALL ON trips TO authenticated;