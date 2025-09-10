/*
  # Tour Leader Management System

  1. New Tables
    - `tour_leaders`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `email` (text, optional)
      - `phone` (text, optional)
      - `certification` (text, optional)
      - `specialization` (text, optional)
      - `experience_years` (integer, default 0)
      - `status` (text, default 'active')
      - `bio` (text, optional)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Schema Changes
    - Modify `trips` table to use `tour_leader_id` instead of `tour_leader` text field
    - Add foreign key relationship

  3. Security
    - Enable RLS on `tour_leaders` table
    - Add policies for authenticated users to manage tour leaders
    - Add policy for public read access
*/

-- Create tour_leaders table
CREATE TABLE IF NOT EXISTS tour_leaders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  certification text,
  specialization text,
  experience_years integer DEFAULT 0,
  status text DEFAULT 'active',
  bio text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE tour_leaders ENABLE ROW LEVEL SECURITY;

-- Create policies for tour_leaders
CREATE POLICY "Allow public read access to tour_leaders"
  ON tour_leaders
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow authenticated users to manage tour_leaders"
  ON tour_leaders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tour_leaders_status ON tour_leaders(status);
CREATE INDEX IF NOT EXISTS idx_tour_leaders_name ON tour_leaders(name);

-- Add trigger to update updated_at column
CREATE TRIGGER update_tour_leaders_updated_at
  BEFORE UPDATE ON tour_leaders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add new column to trips table for foreign key relationship
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'tour_leader_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN tour_leader_id uuid REFERENCES tour_leaders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_trips_tour_leader_id ON trips(tour_leader_id);