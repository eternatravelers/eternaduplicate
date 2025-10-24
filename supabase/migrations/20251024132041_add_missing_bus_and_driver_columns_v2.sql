/*
  # Add Missing Columns to Buses and Drivers Tables

  ## Changes to `buses` table
  - Add `bus_number` (text, unique) - Bus identification number that components expect
  - Add `type` (text) - Bus type/category (e.g., "Medium Bus", "Large Bus", "Minibus")
  - Add `notes` (text) - Additional notes about the bus
  - Generate bus_number from plate_number for existing records
  - Create unique constraint on bus_number

  ## Changes to `drivers` table
  - Add `license_type` (text) - Type of driver's license (e.g., "SIM A", "SIM B1")
  - Add `license_expiry` (date) - License expiration date
  - Add `emergency_contact` (text) - Emergency contact person
  - Add `emergency_phone` (text) - Emergency contact phone number
  - Add `notes` (text) - Additional notes about the driver

  ## Sample Data
  - Add sample buses and drivers if tables are empty to enable immediate testing
*/

-- Add missing columns to buses table
DO $$
BEGIN
  -- Add bus_number column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'buses' AND column_name = 'bus_number'
  ) THEN
    ALTER TABLE buses ADD COLUMN bus_number text;
  END IF;

  -- Add type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'buses' AND column_name = 'type'
  ) THEN
    ALTER TABLE buses ADD COLUMN type text;
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'buses' AND column_name = 'notes'
  ) THEN
    ALTER TABLE buses ADD COLUMN notes text;
  END IF;
END $$;

-- Add missing columns to drivers table
DO $$
BEGIN
  -- Add license_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'drivers' AND column_name = 'license_type'
  ) THEN
    ALTER TABLE drivers ADD COLUMN license_type text;
  END IF;

  -- Add license_expiry column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'drivers' AND column_name = 'license_expiry'
  ) THEN
    ALTER TABLE drivers ADD COLUMN license_expiry date;
  END IF;

  -- Add emergency_contact column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'drivers' AND column_name = 'emergency_contact'
  ) THEN
    ALTER TABLE drivers ADD COLUMN emergency_contact text;
  END IF;

  -- Add emergency_phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'drivers' AND column_name = 'emergency_phone'
  ) THEN
    ALTER TABLE drivers ADD COLUMN emergency_phone text;
  END IF;

  -- Add notes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'drivers' AND column_name = 'notes'
  ) THEN
    ALTER TABLE drivers ADD COLUMN notes text;
  END IF;
END $$;

-- Generate bus_number for existing records using a CTE
WITH numbered_buses AS (
  SELECT id, row_number() OVER (ORDER BY created_at) as rn
  FROM buses
  WHERE bus_number IS NULL
)
UPDATE buses
SET bus_number = 'BUS-' || LPAD(numbered_buses.rn::text, 3, '0')
FROM numbered_buses
WHERE buses.id = numbered_buses.id;

-- Set default type for existing buses if not set
UPDATE buses 
SET type = 'Standard Bus'
WHERE type IS NULL;

-- Make bus_number NOT NULL after populating existing records
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM buses WHERE bus_number IS NULL) THEN
    RAISE EXCEPTION 'Cannot make bus_number NOT NULL: some records still have NULL values';
  END IF;
  
  ALTER TABLE buses ALTER COLUMN bus_number SET NOT NULL;
END $$;

-- Add unique constraint on bus_number
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'buses_bus_number_key'
  ) THEN
    ALTER TABLE buses ADD CONSTRAINT buses_bus_number_key UNIQUE (bus_number);
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_buses_bus_number ON buses(bus_number);
CREATE INDEX IF NOT EXISTS idx_buses_type ON buses(type);
CREATE INDEX IF NOT EXISTS idx_drivers_license_type ON drivers(license_type);

-- Insert sample data only if tables are empty
DO $$
BEGIN
  -- Add sample buses if table is empty
  IF NOT EXISTS (SELECT 1 FROM buses LIMIT 1) THEN
    INSERT INTO buses (bus_number, plate_number, type, model, capacity, status, notes)
    VALUES 
      ('BUS-001', 'B 1234 ABC', 'Large Bus', 'Mercedes-Benz OH 1626', 50, 'active', 'Bus pariwisata besar untuk trip jarak jauh'),
      ('BUS-002', 'B 5678 DEF', 'Medium Bus', 'Isuzu Elf Long', 30, 'active', 'Bus medium untuk grup menengah'),
      ('BUS-003', 'B 9012 GHI', 'Minibus', 'Toyota Hiace Commuter', 15, 'active', 'Minibus untuk grup kecil');
  END IF;

  -- Add sample drivers if table is empty
  IF NOT EXISTS (SELECT 1 FROM drivers LIMIT 1) THEN
    INSERT INTO drivers (name, phone, license_number, license_type, status, notes)
    VALUES 
      ('Budi Santoso', '081234567890', 'SIM-2024-001', 'SIM A Umum', 'active', 'Driver berpengalaman 15 tahun'),
      ('Agus Setiawan', '081234567891', 'SIM-2024-002', 'SIM A Umum', 'active', 'Spesialis rute pegunungan'),
      ('Dedi Kurniawan', '081234567892', 'SIM-2024-003', 'SIM A Umum', 'active', 'Driver untuk bus besar');
  END IF;
END $$;