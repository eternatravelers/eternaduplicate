/*
  # Add Master Meeting Points Table

  ## Summary
  This migration creates a master meeting points table to store predefined meeting point locations
  that can be used across trips, and updates the get_meeting_point_summary function to show
  all meeting points even when no participants are registered yet.

  ## 1. New Tables
    - `meeting_points`
      - `id` (uuid, primary key)
      - `name` (text, unique, not null) - The meeting point location name
      - `description` (text, nullable) - Additional details about the location
      - `address` (text, nullable) - Full address
      - `is_active` (boolean, default true) - Whether this meeting point is available
      - `display_order` (integer, default 0) - Order for displaying in lists
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  ## 2. Trip Meeting Points Junction Table
    - `trip_meeting_points`
      - `id` (uuid, primary key)
      - `trip_id` (uuid, references trips)
      - `meeting_point_id` (uuid, references meeting_points)
      - `is_primary` (boolean, default false) - Marks the primary meeting point for the trip
      - `created_at` (timestamptz, default now())

  ## 3. Function Updates
    - Updated `get_meeting_point_summary` to return all meeting points configured for a trip,
      including those with zero participants

  ## 4. Security
    - Enable RLS on meeting_points table
    - Add policies for authenticated users to view and manage meeting points
    - Enable RLS on trip_meeting_points table

  ## 5. Data Migration
    - Insert common meeting point locations
    - Automatically create trip_meeting_points entries based on existing trips.meeting_point data
*/

-- Create master meeting_points table
CREATE TABLE IF NOT EXISTS meeting_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  address text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create trip_meeting_points junction table
CREATE TABLE IF NOT EXISTS trip_meeting_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE NOT NULL,
  meeting_point_id uuid REFERENCES meeting_points(id) ON DELETE CASCADE NOT NULL,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(trip_id, meeting_point_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meeting_points_active ON meeting_points(is_active);
CREATE INDEX IF NOT EXISTS idx_meeting_points_display_order ON meeting_points(display_order);
CREATE INDEX IF NOT EXISTS idx_trip_meeting_points_trip_id ON trip_meeting_points(trip_id);
CREATE INDEX IF NOT EXISTS idx_trip_meeting_points_meeting_point_id ON trip_meeting_points(meeting_point_id);

-- Enable Row Level Security
ALTER TABLE meeting_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE trip_meeting_points ENABLE ROW LEVEL SECURITY;

-- Create policies for meeting_points
CREATE POLICY "Authenticated users can view meeting points"
  ON meeting_points
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert meeting points"
  ON meeting_points
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update meeting points"
  ON meeting_points
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete meeting points"
  ON meeting_points
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for trip_meeting_points
CREATE POLICY "Authenticated users can view trip meeting points"
  ON trip_meeting_points
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert trip meeting points"
  ON trip_meeting_points
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update trip meeting points"
  ON trip_meeting_points
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete trip meeting points"
  ON trip_meeting_points
  FOR DELETE
  TO authenticated
  USING (true);

-- Insert common meeting points
INSERT INTO meeting_points (name, description, display_order, is_active) VALUES
  ('Masjid Agung', 'Masjid Agung kota', 1, true),
  ('Alun-Alun Kota', 'Area alun-alun pusat kota', 2, true),
  ('Terminal Bus', 'Terminal bus utama', 3, true),
  ('Stasiun Kereta', 'Stasiun kereta api', 4, true),
  ('Kantor Cabang', 'Kantor cabang perusahaan', 5, true),
  ('Mall Pusat Kota', 'Mall di pusat kota', 6, true),
  ('Parkir Supermarket', 'Area parkir supermarket besar', 7, true),
  ('Hotel Meeting Point', 'Area parkir hotel', 8, true)
ON CONFLICT (name) DO NOTHING;

-- Migrate existing trip meeting_point data to trip_meeting_points table
DO $$
DECLARE
  trip_record RECORD;
  mp_id uuid;
BEGIN
  FOR trip_record IN 
    SELECT DISTINCT id, meeting_point 
    FROM trips 
    WHERE meeting_point IS NOT NULL AND meeting_point != ''
  LOOP
    -- Get or create meeting point
    SELECT id INTO mp_id 
    FROM meeting_points 
    WHERE name = trip_record.meeting_point;
    
    IF mp_id IS NULL THEN
      INSERT INTO meeting_points (name, is_active, display_order)
      VALUES (trip_record.meeting_point, true, 999)
      RETURNING id INTO mp_id;
    END IF;
    
    -- Create trip_meeting_points entry if doesn't exist
    INSERT INTO trip_meeting_points (trip_id, meeting_point_id, is_primary)
    VALUES (trip_record.id, mp_id, true)
    ON CONFLICT (trip_id, meeting_point_id) DO NOTHING;
  END LOOP;
END $$;

-- Also handle meeting_point_details from participants
DO $$
DECLARE
  participant_record RECORD;
  mp_id uuid;
BEGIN
  FOR participant_record IN 
    SELECT DISTINCT trip_id, meeting_point_details 
    FROM participants 
    WHERE meeting_point_details IS NOT NULL 
      AND meeting_point_details != ''
      AND deleted_at IS NULL
  LOOP
    -- Get or create meeting point
    SELECT id INTO mp_id 
    FROM meeting_points 
    WHERE name = participant_record.meeting_point_details;
    
    IF mp_id IS NULL THEN
      INSERT INTO meeting_points (name, is_active, display_order)
      VALUES (participant_record.meeting_point_details, true, 999)
      RETURNING id INTO mp_id;
    END IF;
    
    -- Create trip_meeting_points entry if doesn't exist
    INSERT INTO trip_meeting_points (trip_id, meeting_point_id, is_primary)
    VALUES (participant_record.trip_id, mp_id, false)
    ON CONFLICT (trip_id, meeting_point_id) DO NOTHING;
  END LOOP;
END $$;

-- Update the get_meeting_point_summary function to return all configured meeting points
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
  WITH trip_meeting_points_list AS (
    -- Get all meeting points configured for this trip
    SELECT mp.name as meeting_point_name
    FROM trip_meeting_points tmp
    JOIN meeting_points mp ON mp.id = tmp.meeting_point_id
    WHERE tmp.trip_id = p_trip_id
      AND mp.is_active = true
  ),
  participant_data AS (
    -- Get participant counts per meeting point
    SELECT 
      COALESCE(p.meeting_point_details, t.meeting_point) as meeting_point_name,
      SUM(COALESCE(p.participant_count, 1))::bigint as participant_count,
      COUNT(p.id)::bigint as registration_count
    FROM participants p
    JOIN trips t ON t.id = p.trip_id
    WHERE p.trip_id = p_trip_id
      AND p.deleted_at IS NULL
      AND p.parent_participant_id IS NULL
    GROUP BY COALESCE(p.meeting_point_details, t.meeting_point)
  )
  SELECT 
    tmp.meeting_point_name,
    COALESCE(pd.participant_count, 0) as participant_count,
    COALESCE(pd.registration_count, 0) as registration_count,
    EXISTS(
      SELECT 1 FROM pickup_schedules ps 
      WHERE ps.trip_id = p_trip_id 
      AND ps.meeting_point_name = tmp.meeting_point_name
    ) as has_pickup_schedule,
    EXISTS(
      SELECT 1 FROM meeting_point_assignments mpa 
      WHERE mpa.trip_id = p_trip_id 
      AND mpa.meeting_point_name = tmp.meeting_point_name
      AND mpa.bus_id IS NOT NULL
    ) as has_transportation_assigned
  FROM trip_meeting_points_list tmp
  LEFT JOIN participant_data pd ON pd.meeting_point_name = tmp.meeting_point_name
  ORDER BY 
    CASE WHEN pd.participant_count IS NULL THEN 1 ELSE 0 END,
    pd.participant_count DESC NULLS LAST,
    tmp.meeting_point_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_meeting_points_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_meeting_points_updated_at
  BEFORE UPDATE ON meeting_points
  FOR EACH ROW
  EXECUTE FUNCTION update_meeting_points_updated_at();
