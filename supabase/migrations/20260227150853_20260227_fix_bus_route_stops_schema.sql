/*
  # Fix bus_route_stops schema

  ## Changes
  1. Modified Tables
    - `bus_route_stops`
      - Make `meeting_point_id` nullable (allows manual entry of meeting point name)
      - Add `meeting_point_name` text column for storing display name (manual or from master data)

  ## Reason
  The BusRouteStopsManager component supports both selecting from master meeting points
  and manually entering a meeting point name. The current schema requires meeting_point_id
  to be NOT NULL and has no meeting_point_name column, causing saves to fail when:
  - A manual meeting point name is entered (meeting_point_id would be null)
  - The insert tries to write meeting_point_name which doesn't exist as a column
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'bus_route_stops' AND column_name = 'meeting_point_name'
  ) THEN
    ALTER TABLE bus_route_stops ADD COLUMN meeting_point_name text NOT NULL DEFAULT '';
  END IF;
END $$;

ALTER TABLE bus_route_stops ALTER COLUMN meeting_point_id DROP NOT NULL;
