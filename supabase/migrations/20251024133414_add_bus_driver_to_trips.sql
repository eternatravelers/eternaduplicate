/*
  # Add Bus and Driver References to Trips Table

  ## Changes
  - Add `bus_id` (uuid, references buses) to trips table
  - Add `driver_id` (uuid, references drivers) to trips table
  - Add indexes for performance
  - These columns enable trips to be assigned specific buses and drivers from operational resources

  ## Purpose
  Meeting Point Operations will pull bus and driver data from the trip assignment,
  ensuring consistency with the Manajemen Perjalanan (Trip Management) module.
*/

-- Add bus_id column to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'bus_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN bus_id uuid REFERENCES buses(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Add driver_id column to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'trips' AND column_name = 'driver_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_trips_bus_id ON trips(bus_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
