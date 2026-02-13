/*
  # Fix buses table null bus_number values
  
  1. Changes
    - Update NULL bus_number values to sequential numbers
    - Ensure bus_number has proper default value
*/

DO $$
BEGIN
  -- Update NULL bus_number values with sequential numbers
  WITH numbered_buses AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as row_num
    FROM buses
    WHERE bus_number IS NULL
  )
  UPDATE buses
  SET bus_number = (SELECT 'BUS-' || LPAD(row_num::text, 3, '0') FROM numbered_buses WHERE buses.id = numbered_buses.id)
  WHERE bus_number IS NULL;
  
  -- Set default value for future inserts if not already set
  ALTER TABLE buses ALTER COLUMN bus_number SET DEFAULT 'BUS-' || LPAD((EXTRACT(EPOCH FROM now())::integer % 10000)::text, 3, '0');
END $$;
