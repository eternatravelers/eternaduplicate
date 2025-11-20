/*
  # Add Foreign Key Columns to Resource Schedules (v2)

  ## Overview
  This migration adds specific foreign key columns (bus_id, driver_id, tour_leader_id) to the
  resource_schedules table to enable proper joins with their respective tables.

  ## Changes
    - Clean up invalid data first
    - Add `bus_id` column with foreign key to buses table
    - Add `driver_id` column with foreign key to drivers table  
    - Add `tour_leader_id` column with foreign key to tour_leaders table
    - Add indexes for better query performance
    - Add trigger to auto-populate these columns based on resource_type and resource_id

  ## Security
    - No RLS changes needed, existing policies remain intact

  ## Important Notes
    - Invalid records will be deleted before adding constraints
    - These columns will be automatically populated based on resource_type
    - Enables direct joins: tour_leaders.resource_schedules, buses.resource_schedules, etc.
*/

-- First, delete invalid records that reference non-existent resources
DELETE FROM resource_schedules
WHERE 
  (resource_type = 'bus' AND NOT EXISTS (SELECT 1 FROM buses WHERE id = resource_schedules.resource_id))
  OR (resource_type = 'driver' AND NOT EXISTS (SELECT 1 FROM drivers WHERE id = resource_schedules.resource_id))
  OR (resource_type = 'tour_leader' AND NOT EXISTS (SELECT 1 FROM tour_leaders WHERE id = resource_schedules.resource_id));

-- Add foreign key columns (nullable initially)
ALTER TABLE resource_schedules 
  ADD COLUMN IF NOT EXISTS bus_id uuid;

ALTER TABLE resource_schedules 
  ADD COLUMN IF NOT EXISTS driver_id uuid;

ALTER TABLE resource_schedules 
  ADD COLUMN IF NOT EXISTS tour_leader_id uuid;

-- Backfill existing records
UPDATE resource_schedules
SET bus_id = resource_id
WHERE resource_type = 'bus' AND bus_id IS NULL;

UPDATE resource_schedules
SET driver_id = resource_id
WHERE resource_type = 'driver' AND driver_id IS NULL;

UPDATE resource_schedules
SET tour_leader_id = resource_id
WHERE resource_type = 'tour_leader' AND tour_leader_id IS NULL;

-- Now add foreign key constraints
ALTER TABLE resource_schedules 
  ADD CONSTRAINT resource_schedules_bus_id_fkey 
  FOREIGN KEY (bus_id) REFERENCES buses(id) ON DELETE CASCADE;

ALTER TABLE resource_schedules 
  ADD CONSTRAINT resource_schedules_driver_id_fkey 
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE;

ALTER TABLE resource_schedules 
  ADD CONSTRAINT resource_schedules_tour_leader_id_fkey 
  FOREIGN KEY (tour_leader_id) REFERENCES tour_leaders(id) ON DELETE CASCADE;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resource_schedules_bus_id ON resource_schedules(bus_id);
CREATE INDEX IF NOT EXISTS idx_resource_schedules_driver_id ON resource_schedules(driver_id);
CREATE INDEX IF NOT EXISTS idx_resource_schedules_tour_leader_id ON resource_schedules(tour_leader_id);

-- Create trigger function to auto-populate FK columns for new records
CREATE OR REPLACE FUNCTION sync_resource_schedule_fk_columns()
RETURNS TRIGGER AS $$
BEGIN
  -- Set the appropriate FK column based on resource_type
  IF NEW.resource_type = 'bus' THEN
    NEW.bus_id = NEW.resource_id;
    NEW.driver_id = NULL;
    NEW.tour_leader_id = NULL;
  ELSIF NEW.resource_type = 'driver' THEN
    NEW.driver_id = NEW.resource_id;
    NEW.bus_id = NULL;
    NEW.tour_leader_id = NULL;
  ELSIF NEW.resource_type = 'tour_leader' THEN
    NEW.tour_leader_id = NEW.resource_id;
    NEW.bus_id = NULL;
    NEW.driver_id = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_resource_schedule_fk_columns_trigger ON resource_schedules;

CREATE TRIGGER sync_resource_schedule_fk_columns_trigger
  BEFORE INSERT OR UPDATE ON resource_schedules
  FOR EACH ROW
  EXECUTE FUNCTION sync_resource_schedule_fk_columns();
