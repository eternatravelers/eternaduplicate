/*
  # Create trip_types table

  1. New Tables
    - `trip_types`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `trip_types` table
    - Add policy for authenticated users to manage trip types
    - Add policy for public read access

  3. Initial Data
    - Insert default trip types: "Open Trip" and "Private Trip"
*/

CREATE TABLE IF NOT EXISTS public.trip_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.trip_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to manage trip_types"
  ON public.trip_types
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to trip_types"
  ON public.trip_types
  FOR SELECT
  TO public
  USING (true);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_trip_types_updated_at
  BEFORE UPDATE ON public.trip_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default trip types
INSERT INTO public.trip_types (name) VALUES 
  ('Open Trip'),
  ('Private Trip')
ON CONFLICT (name) DO NOTHING;