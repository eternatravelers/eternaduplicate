/*
  # Create emergency_contacts table for emergency contact management

  1. New Tables
    - `emergency_contacts`
      - `id` (uuid, primary key)
      - `name` (text, contact name or institution)
      - `role` (text, role or position)
      - `phone` (text, phone number)
      - `category` (text, contact category enum)
      - `location` (text, location, nullable)
      - `notes` (text, additional notes, nullable)
      - `is_active` (boolean, active status)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `emergency_contacts` table
    - Add policy for authenticated users to manage emergency contacts
    - Add policy for public read access to emergency contacts

  3. Indexes
    - Index on category for filtering
    - Index on is_active for filtering
    - Index on name for searching
*/

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  phone text NOT NULL,
  category text NOT NULL CHECK (category IN ('medical', 'police', 'company', 'local')),
  location text,
  notes text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_category ON emergency_contacts(category);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_is_active ON emergency_contacts(is_active);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_name ON emergency_contacts(name);

-- Create policies
CREATE POLICY "Allow authenticated users to manage emergency_contacts"
  ON emergency_contacts
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to emergency_contacts"
  ON emergency_contacts
  FOR SELECT
  TO public
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_emergency_contacts_updated_at
  BEFORE UPDATE ON emergency_contacts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();