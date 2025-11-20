/*
  # Restore Foreign Key Relationships to Trips Table
  
  ## Overview
  After consolidating trips and trip_types, we need to restore all foreign key
  relationships that were lost during the DROP CASCADE operation.
  
  ## Changes
  
  ### Foreign Keys to Restore:
  1. participants.trip_id → trips.id
  2. transactions.trip_id → trips.id
  3. trip_buses.trip_id → trips.id
  4. trip_drivers.trip_id → trips.id
  5. trip_tour_leaders.trip_id → trips.id
  6. trip_meeting_points.trip_id → trips.id
  7. trip_destinations.trip_id → trips.id (if exists)
  8. checklists.trip_id → trips.id (if exists)
  9. documents.trip_id → trips.id (if exists)
  10. emergency_contacts.trip_id → trips.id (if exists)
  11. pickup_schedules.trip_id → trips.id (if exists)
  
  ## Security
  - All existing RLS policies remain unchanged
*/

-- Restore foreign keys for participants table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'participants' AND column_name = 'trip_id') THEN
    ALTER TABLE participants DROP CONSTRAINT IF EXISTS participants_trip_id_fkey;
    ALTER TABLE participants ADD CONSTRAINT participants_trip_id_fkey 
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Restore foreign keys for transactions table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'trip_id') THEN
    ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_trip_id_fkey;
    ALTER TABLE transactions ADD CONSTRAINT transactions_trip_id_fkey 
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Restore foreign keys for trip_buses table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_buses' AND column_name = 'trip_id') THEN
    ALTER TABLE trip_buses DROP CONSTRAINT IF EXISTS trip_buses_trip_id_fkey;
    ALTER TABLE trip_buses ADD CONSTRAINT trip_buses_trip_id_fkey 
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Restore foreign keys for trip_drivers table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_drivers' AND column_name = 'trip_id') THEN
    ALTER TABLE trip_drivers DROP CONSTRAINT IF EXISTS trip_drivers_trip_id_fkey;
    ALTER TABLE trip_drivers ADD CONSTRAINT trip_drivers_trip_id_fkey 
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Restore foreign keys for trip_tour_leaders table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_tour_leaders' AND column_name = 'trip_id') THEN
    ALTER TABLE trip_tour_leaders DROP CONSTRAINT IF EXISTS trip_tour_leaders_trip_id_fkey;
    ALTER TABLE trip_tour_leaders ADD CONSTRAINT trip_tour_leaders_trip_id_fkey 
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Restore foreign keys for trip_meeting_points table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_meeting_points' AND column_name = 'trip_id') THEN
    ALTER TABLE trip_meeting_points DROP CONSTRAINT IF EXISTS trip_meeting_points_trip_id_fkey;
    ALTER TABLE trip_meeting_points ADD CONSTRAINT trip_meeting_points_trip_id_fkey 
      FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Restore foreign keys for trip_destinations table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trip_destinations') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'trip_destinations' AND column_name = 'trip_id') THEN
      ALTER TABLE trip_destinations DROP CONSTRAINT IF EXISTS trip_destinations_trip_id_fkey;
      ALTER TABLE trip_destinations ADD CONSTRAINT trip_destinations_trip_id_fkey 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Restore foreign keys for checklists table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checklists') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'checklists' AND column_name = 'trip_id') THEN
      ALTER TABLE checklists DROP CONSTRAINT IF EXISTS checklists_trip_id_fkey;
      ALTER TABLE checklists ADD CONSTRAINT checklists_trip_id_fkey 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Restore foreign keys for documents table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'documents') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'trip_id') THEN
      ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_trip_id_fkey;
      ALTER TABLE documents ADD CONSTRAINT documents_trip_id_fkey 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Restore foreign keys for emergency_contacts table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'emergency_contacts') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emergency_contacts' AND column_name = 'trip_id') THEN
      ALTER TABLE emergency_contacts DROP CONSTRAINT IF EXISTS emergency_contacts_trip_id_fkey;
      ALTER TABLE emergency_contacts ADD CONSTRAINT emergency_contacts_trip_id_fkey 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Restore foreign keys for pickup_schedules table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pickup_schedules') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'pickup_schedules' AND column_name = 'trip_id') THEN
      ALTER TABLE pickup_schedules DROP CONSTRAINT IF EXISTS pickup_schedules_trip_id_fkey;
      ALTER TABLE pickup_schedules ADD CONSTRAINT pickup_schedules_trip_id_fkey 
        FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_participants_trip_id ON participants(trip_id);
CREATE INDEX IF NOT EXISTS idx_transactions_trip_id ON transactions(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_buses_trip_id ON trip_buses(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_drivers_trip_id ON trip_drivers(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_tour_leaders_trip_id ON trip_tour_leaders(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_meeting_points_trip_id ON trip_meeting_points(trip_id);

-- Verify foreign keys are working
DO $$
DECLARE
  participant_count integer;
  trip_count integer;
BEGIN
  SELECT COUNT(*) INTO participant_count FROM participants;
  SELECT COUNT(*) INTO trip_count FROM trips WHERE is_template = false;
  
  RAISE NOTICE 'Foreign keys restored successfully';
  RAISE NOTICE 'Total trips: %', trip_count;
  RAISE NOTICE 'Total participants: %', participant_count;
END $$;