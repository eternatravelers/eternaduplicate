/*
  # Create Trip Types Table

  ## Overview
  This migration creates the trip_types table to store different types of trips
  (e.g., "Open Trip", "Private Trip", etc.)

  ## New Tables
    - `trip_types`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null) - Name of the trip type
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  ## Security
    - Enable RLS on `trip_types` table
    - Allow authenticated users to manage trip types
    - Allow public read access to trip types

  ## Initial Data
    - Insert default trip types: "Open Trip" and "Private Trip"
*/

-- Create trip_types table
CREATE TABLE IF NOT EXISTS trip_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE trip_types ENABLE ROW LEVEL SECURITY;

-- Policies for trip_types
CREATE POLICY "Authenticated users can manage trip_types"
  ON trip_types FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public read access to trip_types"
  ON trip_types FOR SELECT
  TO public
  USING (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_trip_types_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trip_types_updated_at
  BEFORE UPDATE ON trip_types
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_types_updated_at();

-- Insert default trip types
INSERT INTO trip_types (name) VALUES ('Open Trip')
ON CONFLICT (name) DO NOTHING;

INSERT INTO trip_types (name) VALUES ('Private Trip')
ON CONFLICT (name) DO NOTHING;
