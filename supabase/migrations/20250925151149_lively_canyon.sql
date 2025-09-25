/*
  # Add participant deletion audit and soft delete functionality

  1. New Tables
    - `participant_audit_log`
      - `id` (uuid, primary key)
      - `participant_id` (uuid, foreign key)
      - `action` (text - 'deleted', 'restored', 'permanently_deleted')
      - `performed_by_user_id` (uuid)
      - `performed_by_user_name` (text)
      - `reason` (text, optional)
      - `participant_data` (jsonb - snapshot of participant data)
      - `created_at` (timestamp)

  2. Schema Changes
    - Add `deleted_at` column to `participants` table
    - Add `deleted_by_user_id` column to `participants` table
    - Add `deleted_by_user_name` column to `participants` table
    - Add `deletion_reason` column to `participants` table

  3. Security
    - Enable RLS on `participant_audit_log` table
    - Add policies for audit log access
    - Update participant policies to handle soft deletes
*/

-- Add audit log table for participant deletions
CREATE TABLE IF NOT EXISTS participant_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('deleted', 'restored', 'permanently_deleted')),
  performed_by_user_id uuid,
  performed_by_user_name text NOT NULL,
  reason text,
  participant_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add soft delete columns to participants table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE participants ADD COLUMN deleted_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'deleted_by_user_id'
  ) THEN
    ALTER TABLE participants ADD COLUMN deleted_by_user_id uuid;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'deleted_by_user_name'
  ) THEN
    ALTER TABLE participants ADD COLUMN deleted_by_user_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'deletion_reason'
  ) THEN
    ALTER TABLE participants ADD COLUMN deletion_reason text;
  END IF;
END $$;

-- Enable RLS on audit log table
ALTER TABLE participant_audit_log ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_participant_audit_log_participant_id ON participant_audit_log(participant_id);
CREATE INDEX IF NOT EXISTS idx_participant_audit_log_action ON participant_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_participant_audit_log_created_at ON participant_audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_participants_deleted_at ON participants(deleted_at);

-- RLS Policies for audit log
CREATE POLICY "Allow authenticated users to read audit logs"
  ON participant_audit_log
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert audit logs"
  ON participant_audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Update participants policies to handle soft deletes
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow admin/super_admin select on participants" ON participants;
DROP POLICY IF EXISTS "Allow authenticated select on participants" ON participants;
DROP POLICY IF EXISTS "Allow authenticated users to manage participants" ON participants;

-- Create new policies that exclude soft-deleted participants by default
CREATE POLICY "Allow admin/super_admin select on participants"
  ON participants
  FOR SELECT
  TO authenticated
  USING (
    (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND
    (deleted_at IS NULL OR get_user_role() = 'super_admin'::text)
  );

CREATE POLICY "Allow authenticated select on participants"
  ON participants
  FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

CREATE POLICY "Allow authenticated users to manage participants"
  ON participants
  FOR ALL
  TO authenticated
  USING (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]))
  WITH CHECK (get_user_role() = ANY (ARRAY['admin'::text, 'super_admin'::text]));

-- Create function to log participant actions
CREATE OR REPLACE FUNCTION log_participant_action(
  p_participant_id uuid,
  p_action text,
  p_performed_by_user_id uuid,
  p_performed_by_user_name text,
  p_reason text DEFAULT NULL,
  p_participant_data jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO participant_audit_log (
    participant_id,
    action,
    performed_by_user_id,
    performed_by_user_name,
    reason,
    participant_data
  ) VALUES (
    p_participant_id,
    p_action,
    p_performed_by_user_id,
    p_performed_by_user_name,
    p_reason,
    p_participant_data
  );
END;
$$;