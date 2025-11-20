/*
  # Resource Conflict Prevention System

  ## Overview
  This migration implements a comprehensive resource conflict prevention system to ensure buses, drivers, 
  and tour leaders cannot be double-booked for overlapping trip dates.

  ## New Functions
  
  ### 1. check_bus_availability
  - Validates if a bus is available for a given date range
  - Returns TRUE if available, FALSE if already assigned to another trip
  - Checks against all active, ongoing, and confirmed trips
  
  ### 2. check_driver_availability  
  - Validates if a driver is available for a given date range
  - Returns TRUE if available, FALSE if already assigned to another trip
  - Checks against all active, ongoing, and confirmed trips
  
  ### 3. check_tour_leader_availability
  - Validates if a tour leader is available for a given date range
  - Returns TRUE if available, FALSE if already assigned to another trip
  - Checks against all active, ongoing, and confirmed trips
  
  ### 4. get_conflicting_trips_for_bus
  - Returns list of trips that conflict with the proposed date range for a bus
  - Used for displaying warnings to users
  
  ### 5. get_conflicting_trips_for_driver
  - Returns list of trips that conflict with the proposed date range for a driver
  - Used for displaying warnings to users
  
  ### 6. get_conflicting_trips_for_tour_leader
  - Returns list of trips that conflict with the proposed date range for a tour leader
  - Used for displaying warnings to users

  ## Security
  - All functions are available to authenticated users only
  - Functions check against trips with status: active, confirmed, ongoing, open
  - Deleted, cancelled, and draft trips are excluded from conflict checking

  ## Important Notes
  - These functions DO NOT enforce hard constraints, they provide validation tools
  - Frontend should call these functions before allowing resource assignment
  - Backend triggers can optionally enforce these as hard constraints in future
*/

-- Function to check if a bus is available for given date range
CREATE OR REPLACE FUNCTION check_bus_availability(
  bus_id_param uuid,
  departure_date_param date,
  return_date_param date,
  exclude_trip_id_param uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conflict_count integer;
BEGIN
  -- Count trips that have overlapping dates with the same bus
  SELECT COUNT(*)
  INTO conflict_count
  FROM trip_buses tb
  JOIN trips t ON t.id = tb.trip_id
  WHERE tb.bus_id = bus_id_param
    AND t.status IN ('active', 'confirmed', 'ongoing', 'open')
    AND (exclude_trip_id_param IS NULL OR t.id != exclude_trip_id_param)
    AND (
      -- Date ranges overlap
      (t.departure_date, t.return_date) OVERLAPS (departure_date_param, return_date_param)
    );
  
  RETURN conflict_count = 0;
END;
$$;

-- Function to check if a driver is available for given date range
CREATE OR REPLACE FUNCTION check_driver_availability(
  driver_id_param uuid,
  departure_date_param date,
  return_date_param date,
  exclude_trip_id_param uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conflict_count integer;
BEGIN
  -- Count trips that have overlapping dates with the same driver
  SELECT COUNT(*)
  INTO conflict_count
  FROM trip_drivers td
  JOIN trips t ON t.id = td.trip_id
  WHERE td.driver_id = driver_id_param
    AND t.status IN ('active', 'confirmed', 'ongoing', 'open')
    AND (exclude_trip_id_param IS NULL OR t.id != exclude_trip_id_param)
    AND (
      -- Date ranges overlap
      (t.departure_date, t.return_date) OVERLAPS (departure_date_param, return_date_param)
    );
  
  RETURN conflict_count = 0;
END;
$$;

-- Function to check if a tour leader is available for given date range
CREATE OR REPLACE FUNCTION check_tour_leader_availability(
  tour_leader_id_param uuid,
  departure_date_param date,
  return_date_param date,
  exclude_trip_id_param uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  conflict_count integer;
BEGIN
  -- Count trips that have overlapping dates with the same tour leader
  SELECT COUNT(*)
  INTO conflict_count
  FROM trip_tour_leaders ttl
  JOIN trips t ON t.id = ttl.trip_id
  WHERE ttl.tour_leader_id = tour_leader_id_param
    AND t.status IN ('active', 'confirmed', 'ongoing', 'open')
    AND (exclude_trip_id_param IS NULL OR t.id != exclude_trip_id_param)
    AND (
      -- Date ranges overlap
      (t.departure_date, t.return_date) OVERLAPS (departure_date_param, return_date_param)
    );
  
  RETURN conflict_count = 0;
END;
$$;

-- Function to get conflicting trips for a bus
CREATE OR REPLACE FUNCTION get_conflicting_trips_for_bus(
  bus_id_param uuid,
  departure_date_param date,
  return_date_param date,
  exclude_trip_id_param uuid DEFAULT NULL
)
RETURNS TABLE(
  trip_id uuid,
  trip_name text,
  departure_date date,
  return_date date,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.departure_date,
    t.return_date,
    t.status
  FROM trip_buses tb
  JOIN trips t ON t.id = tb.trip_id
  WHERE tb.bus_id = bus_id_param
    AND t.status IN ('active', 'confirmed', 'ongoing', 'open')
    AND (exclude_trip_id_param IS NULL OR t.id != exclude_trip_id_param)
    AND (
      (t.departure_date, t.return_date) OVERLAPS (departure_date_param, return_date_param)
    )
  ORDER BY t.departure_date;
END;
$$;

-- Function to get conflicting trips for a driver
CREATE OR REPLACE FUNCTION get_conflicting_trips_for_driver(
  driver_id_param uuid,
  departure_date_param date,
  return_date_param date,
  exclude_trip_id_param uuid DEFAULT NULL
)
RETURNS TABLE(
  trip_id uuid,
  trip_name text,
  departure_date date,
  return_date date,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.departure_date,
    t.return_date,
    t.status
  FROM trip_drivers td
  JOIN trips t ON t.id = td.trip_id
  WHERE td.driver_id = driver_id_param
    AND t.status IN ('active', 'confirmed', 'ongoing', 'open')
    AND (exclude_trip_id_param IS NULL OR t.id != exclude_trip_id_param)
    AND (
      (t.departure_date, t.return_date) OVERLAPS (departure_date_param, return_date_param)
    )
  ORDER BY t.departure_date;
END;
$$;

-- Function to get conflicting trips for a tour leader
CREATE OR REPLACE FUNCTION get_conflicting_trips_for_tour_leader(
  tour_leader_id_param uuid,
  departure_date_param date,
  return_date_param date,
  exclude_trip_id_param uuid DEFAULT NULL
)
RETURNS TABLE(
  trip_id uuid,
  trip_name text,
  departure_date date,
  return_date date,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.departure_date,
    t.return_date,
    t.status
  FROM trip_tour_leaders ttl
  JOIN trips t ON t.id = ttl.trip_id
  WHERE ttl.tour_leader_id = tour_leader_id_param
    AND t.status IN ('active', 'confirmed', 'ongoing', 'open')
    AND (exclude_trip_id_param IS NULL OR t.id != exclude_trip_id_param)
    AND (
      (t.departure_date, t.return_date) OVERLAPS (departure_date_param, return_date_param)
    )
  ORDER BY t.departure_date;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION check_bus_availability TO authenticated;
GRANT EXECUTE ON FUNCTION check_driver_availability TO authenticated;
GRANT EXECUTE ON FUNCTION check_tour_leader_availability TO authenticated;
GRANT EXECUTE ON FUNCTION get_conflicting_trips_for_bus TO authenticated;
GRANT EXECUTE ON FUNCTION get_conflicting_trips_for_driver TO authenticated;
GRANT EXECUTE ON FUNCTION get_conflicting_trips_for_tour_leader TO authenticated;
