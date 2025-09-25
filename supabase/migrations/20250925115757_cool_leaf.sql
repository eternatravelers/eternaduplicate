/*
  # Create checklists table for trip operational checklists

  1. New Tables
    - `checklists`
      - `id` (uuid, primary key)
      - `trip_id` (uuid, foreign key to trips)
      - `title` (text, checklist item title)
      - `description` (text, detailed description)
      - `completed` (boolean, completion status)
      - `priority` (text, priority level enum)
      - `category` (text, checklist category enum)
      - `completed_by` (text, user who completed, nullable)
      - `completed_at` (timestamp, completion time, nullable)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `checklists` table
    - Add policy for authenticated users to manage checklists
    - Add policy for public read access to checklists

  3. Indexes
    - Index on trip_id for faster queries
    - Index on category for filtering
    - Index on priority for sorting
    - Index on completed for filtering
*/

CREATE TABLE IF NOT EXISTS checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  completed boolean DEFAULT false,
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  category text NOT NULL CHECK (category IN ('pre-departure', 'during-trip', 'post-trip')),
  completed_by text,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_checklists_trip_id ON checklists(trip_id);
CREATE INDEX IF NOT EXISTS idx_checklists_category ON checklists(category);
CREATE INDEX IF NOT EXISTS idx_checklists_priority ON checklists(priority);
CREATE INDEX IF NOT EXISTS idx_checklists_completed ON checklists(completed);

-- Create policies
CREATE POLICY "Allow authenticated users to manage checklists"
  ON checklists
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to checklists"
  ON checklists
  FOR SELECT
  TO public
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_checklists_updated_at
  BEFORE UPDATE ON checklists
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();