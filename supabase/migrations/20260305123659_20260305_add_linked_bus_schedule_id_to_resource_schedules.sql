/*
  # Add linked_bus_schedule_id to resource_schedules

  ## Summary
  Allows driver and tour_leader schedules to be explicitly paired to a specific bus schedule
  within the same trip. This enables the manifest panel to display the correct crew per bus
  when a trip uses multiple buses.

  ## Changes
  ### Modified Tables
  - `resource_schedules`
    - New column: `linked_bus_schedule_id` (uuid, nullable)
      - FK to `resource_schedules(id)` ON DELETE SET NULL
      - Only meaningful when resource_type is 'driver' or 'tour_leader'
      - NULL means the crew member is not assigned to any specific bus (trip-level crew)

  ## New Index
  - `idx_resource_schedules_linked_bus` on (linked_bus_schedule_id) for fast per-bus crew lookup

  ## Security
  - No RLS changes needed; inherits existing policies on resource_schedules
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resource_schedules' AND column_name = 'linked_bus_schedule_id'
  ) THEN
    ALTER TABLE resource_schedules
      ADD COLUMN linked_bus_schedule_id uuid
        REFERENCES resource_schedules(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_resource_schedules_linked_bus
  ON resource_schedules (linked_bus_schedule_id)
  WHERE linked_bus_schedule_id IS NOT NULL;
