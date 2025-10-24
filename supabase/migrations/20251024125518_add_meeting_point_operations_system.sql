/*
  # Meeting Point Operations System

  1. New Tables
    - `pickup_schedules`
      - `id` (uuid, primary key)
      - `trip_id` (uuid, references trips)
      - `meeting_point_name` (text, meeting point location name)
      - `pickup_time` (time, scheduled pickup time)
      - `estimated_duration` (integer, duration in minutes)
      - `notes` (text, special instructions)
      - `status` (text, default 'scheduled')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `meeting_point_assignments`
      - `id` (uuid, primary key)
      - `pickup_schedule_id` (uuid, references pickup_schedules)
      - `trip_id` (uuid, references trips)
      - `meeting_point_name` (text)
      - `bus_id` (uuid, references buses, nullable)
      - `driver_id` (uuid, references drivers, nullable)
      - `capacity_used` (integer, calculated participants count)
      - `capacity_available` (integer, from bus capacity)
      - `assignment_status` (text, default 'pending')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Indexes
    - Index on trip_id for both tables for fast filtering by trip
    - Index on meeting_point_name for grouping operations
    - Index on status fields for filtering

  3. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage meeting point operations
*/

-- Create pickup_schedules table
CREATE TABLE IF NOT EXISTS pickup_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  meeting_point_name text NOT NULL,
  pickup_time time,
  estimated_duration integer DEFAULT 30,
  notes text,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create meeting_point_assignments table
CREATE TABLE IF NOT EXISTS meeting_point_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_schedule_id uuid REFERENCES pickup_schedules(id) ON DELETE CASCADE,
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  meeting_point_name text NOT NULL,
  bus_id uuid REFERENCES buses(id) ON DELETE SET NULL,
  driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
  capacity_used integer DEFAULT 0,
  capacity_available integer DEFAULT 0,
  assignment_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_pickup_schedules_trip_id ON pickup_schedules(trip_id);
CREATE INDEX IF NOT EXISTS idx_pickup_schedules_meeting_point ON pickup_schedules(meeting_point_name);
CREATE INDEX IF NOT EXISTS idx_pickup_schedules_status ON pickup_schedules(status);

CREATE INDEX IF NOT EXISTS idx_meeting_point_assignments_trip_id ON meeting_point_assignments(trip_id);
CREATE INDEX IF NOT EXISTS idx_meeting_point_assignments_meeting_point ON meeting_point_assignments(meeting_point_name);
CREATE INDEX IF NOT EXISTS idx_meeting_point_assignments_bus_id ON meeting_point_assignments(bus_id);
CREATE INDEX IF NOT EXISTS idx_meeting_point_assignments_driver_id ON meeting_point_assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_meeting_point_assignments_status ON meeting_point_assignments(assignment_status);

-- Enable Row Level Security
ALTER TABLE pickup_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_point_assignments ENABLE ROW LEVEL SECURITY;

-- Create policies for pickup_schedules
CREATE POLICY "Authenticated users can view pickup schedules"
  ON pickup_schedules
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pickup schedules"
  ON pickup_schedules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pickup schedules"
  ON pickup_schedules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete pickup schedules"
  ON pickup_schedules
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for meeting_point_assignments
CREATE POLICY "Authenticated users can view meeting point assignments"
  ON meeting_point_assignments
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert meeting point assignments"
  ON meeting_point_assignments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update meeting point assignments"
  ON meeting_point_assignments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete meeting point assignments"
  ON meeting_point_assignments
  FOR DELETE
  TO authenticated
  USING (true);

-- Create function to get meeting point summary for a trip
CREATE OR REPLACE FUNCTION get_meeting_point_summary(p_trip_id uuid)
RETURNS TABLE (
  meeting_point_name text,
  participant_count bigint,
  registration_count bigint,
  has_pickup_schedule boolean,
  has_transportation_assigned boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(p.meeting_point_details, t.meeting_point) as meeting_point_name,
    SUM(COALESCE(p.participant_count, 1))::bigint as participant_count,
    COUNT(p.id)::bigint as registration_count,
    EXISTS(
      SELECT 1 FROM pickup_schedules ps 
      WHERE ps.trip_id = p_trip_id 
      AND ps.meeting_point_name = COALESCE(p.meeting_point_details, t.meeting_point)
    ) as has_pickup_schedule,
    EXISTS(
      SELECT 1 FROM meeting_point_assignments mpa 
      WHERE mpa.trip_id = p_trip_id 
      AND mpa.meeting_point_name = COALESCE(p.meeting_point_details, t.meeting_point)
      AND mpa.bus_id IS NOT NULL
    ) as has_transportation_assigned
  FROM participants p
  JOIN trips t ON t.id = p.trip_id
  WHERE p.trip_id = p_trip_id
    AND p.deleted_at IS NULL
    AND p.parent_participant_id IS NULL
  GROUP BY COALESCE(p.meeting_point_details, t.meeting_point), t.meeting_point
  ORDER BY participant_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_meeting_point_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_pickup_schedules_updated_at
  BEFORE UPDATE ON pickup_schedules
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_point_tables_updated_at();

CREATE TRIGGER update_meeting_point_assignments_updated_at
  BEFORE UPDATE ON meeting_point_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_point_tables_updated_at();