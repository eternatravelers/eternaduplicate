/*
  # Cost Planning System

  1. New Tables
    - `cost_plans`
      - `id` (uuid, primary key)
      - `name` (text, required)
      - `estimated_participants` (integer, default 1)
      - `categories` (jsonb, stores array of cost categories)
      - `total_cost` (numeric, default 0)
      - `cost_per_person` (numeric, default 0)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `cost_plans` table
    - Add policies for authenticated users to manage cost plans

  3. Performance
    - Add indexes for better performance on name and created_at
*/

-- Create cost_plans table
CREATE TABLE IF NOT EXISTS cost_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  estimated_participants integer NOT NULL DEFAULT 1,
  categories jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_cost numeric DEFAULT 0,
  cost_per_person numeric DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE cost_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for cost_plans
CREATE POLICY "Allow authenticated users to manage cost_plans"
  ON cost_plans
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cost_plans_name ON cost_plans(name);
CREATE INDEX IF NOT EXISTS idx_cost_plans_created_at ON cost_plans(created_at);

-- Add trigger to update updated_at column
CREATE TRIGGER update_cost_plans_updated_at
  BEFORE UPDATE ON cost_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();