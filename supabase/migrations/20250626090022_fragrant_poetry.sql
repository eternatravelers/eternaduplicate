/*
  # Add cost plan integration to trips table

  1. Changes
    - Add `cost_plan_id` column to `trips` table
    - Add foreign key relationship to `cost_plans` table
    - Add index for better performance

  2. Notes
    - `cost_plan_id` is nullable to allow trips without cost plans
    - Foreign key uses ON DELETE SET NULL to preserve trips when cost plan is deleted
*/

-- Add cost_plan_id column to trips table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'trips' AND column_name = 'cost_plan_id'
  ) THEN
    ALTER TABLE trips ADD COLUMN cost_plan_id uuid REFERENCES cost_plans(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for the new foreign key
CREATE INDEX IF NOT EXISTS idx_trips_cost_plan_id ON trips(cost_plan_id);