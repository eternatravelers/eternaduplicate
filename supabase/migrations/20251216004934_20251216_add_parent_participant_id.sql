/*
  # Add parent_participant_id column for group registration support

  1. Changes
    - Add `parent_participant_id` column to `participants` table
    - This enables group registration where one participant is the group leader
    - Other participants in the group will have parent_participant_id pointing to the leader
    - Nullable column for backward compatibility

  2. Relationship
    - parent_participant_id is a foreign key to participants(id)
    - ON DELETE CASCADE ensures group members are deleted when leader is deleted
    - NULL value indicates this is an individual or group leader registration

  3. Indexes
    - Add index on parent_participant_id for efficient queries
    - Helps filter and count group members quickly

  4. Notes
    - Individual participants and group leaders have NULL parent_participant_id
    - Group member records have parent_participant_id = group leader's ID
    - Existing records remain unaffected (column is nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'participants' AND column_name = 'parent_participant_id'
  ) THEN
    ALTER TABLE participants ADD COLUMN parent_participant_id uuid REFERENCES participants(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_participants_parent_participant_id ON participants(parent_participant_id);