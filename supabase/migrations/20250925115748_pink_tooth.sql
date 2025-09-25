/*
  # Create documents table for trip document management

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `name` (text, document name)
      - `type` (text, document type enum)
      - `file_url` (text, file URL in storage)
      - `file_type` (text, MIME type)
      - `file_size` (integer, file size in bytes)
      - `uploaded_by` (text, user who uploaded)
      - `uploaded_at` (timestamp, upload time)
      - `trip_id` (uuid, foreign key to trips, nullable)
      - `notes` (text, optional notes)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `documents` table
    - Add policy for authenticated users to manage documents
    - Add policy for public read access to documents

  3. Indexes
    - Index on trip_id for faster queries
    - Index on type for filtering
    - Index on uploaded_at for sorting
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('itinerary', 'participant_list', 'emergency_contact', 'insurance', 'permit', 'other')),
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  uploaded_by text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  trip_id uuid REFERENCES trips(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_documents_trip_id ON documents(trip_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_at ON documents(uploaded_at);

-- Create policies
CREATE POLICY "Allow authenticated users to manage documents"
  ON documents
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to documents"
  ON documents
  FOR SELECT
  TO public
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();