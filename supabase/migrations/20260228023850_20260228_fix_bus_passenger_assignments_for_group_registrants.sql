/*
  # Fix bus_passenger_assignments for group registrants

  ## Problem
  A registrant (participant) can have participant_count > 1, meaning they registered
  multiple people. Previously the table enforced UNIQUE(resource_schedule_id, participant_id)
  which prevented assigning more than 1 seat per registrant.

  ## Changes
  1. Drop unique constraint `unique_participant_per_bus` to allow multiple seats per registrant
  2. Drop check constraint `positive_seat_number` since seat_number is changing to text
  3. Drop unique constraint `unique_seat_per_bus` since seat numbers are now text and we allow flexibility
  4. Change `seat_number` column from integer to text to support formats like "1", "2A", etc.
*/

ALTER TABLE bus_passenger_assignments
  DROP CONSTRAINT IF EXISTS unique_participant_per_bus;

ALTER TABLE bus_passenger_assignments
  DROP CONSTRAINT IF EXISTS unique_seat_per_bus;

ALTER TABLE bus_passenger_assignments
  DROP CONSTRAINT IF EXISTS positive_seat_number;

ALTER TABLE bus_passenger_assignments
  ALTER COLUMN seat_number TYPE text USING seat_number::text;
