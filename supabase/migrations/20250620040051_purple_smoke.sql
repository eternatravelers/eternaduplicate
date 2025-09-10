/*
  # Add support for multiple destinations per trip

  1. New Tables
    - `trip_destinations`
      - `id` (uuid, primary key)
      - `trip_id` (uuid, foreign key to trips.id with CASCADE delete)
      - `destination_id` (uuid, foreign key to destinations.id with CASCADE delete)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Changes
    - Remove `destination_id` column from `trips` table
    - Remove existing foreign key constraint

  3. Security
    - Enable RLS on `trip_destinations` table
    - Add policies for authenticated users to manage trip destinations
    - Add policy for public read access to trip destinations

  4. Performance
    - Add indexes for faster lookups on trip_id and destination_id
    - Add unique constraint to prevent duplicate trip-destination pairs
*/

-- Remove existing foreign key constraint from trips to destinations
ALTER TABLE public.trips DROP CONSTRAINT IF EXISTS trips_destination_id_fkey;

-- Drop the destination_id column from the trips table
ALTER TABLE public.trips DROP COLUMN IF EXISTS destination_id;

-- Create the new junction table for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.trip_destinations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id uuid NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    destination_id uuid NOT NULL REFERENCES public.destinations(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    UNIQUE (trip_id, destination_id) -- Ensure unique pairs
);

-- Enable Row Level Security for the new table
ALTER TABLE public.trip_destinations ENABLE ROW LEVEL SECURITY;

-- Policies for trip_destinations
CREATE POLICY "Allow authenticated users to manage trip_destinations"
  ON public.trip_destinations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to trip_destinations"
  ON public.trip_destinations
  FOR SELECT
  TO public
  USING (true);

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_trip_destinations_trip_id ON public.trip_destinations USING btree (trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_destinations_destination_id ON public.trip_destinations USING btree (destination_id);

-- Add trigger to update updated_at column for trip_destinations
CREATE TRIGGER update_trip_destinations_updated_at
  BEFORE UPDATE ON public.trip_destinations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();