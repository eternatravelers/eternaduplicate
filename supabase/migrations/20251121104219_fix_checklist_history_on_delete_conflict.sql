/*
  # Fix Checklist History Foreign Key Conflict on Delete

  ## Problem
  When deleting a checklist, the trigger `log_checklist_change` tries to insert a history record
  with a `checklist_id` that references the deleted checklist. However, the `ON DELETE CASCADE`
  on `checklist_history` already deleted related records, causing a foreign key violation when
  the trigger tries to insert the history record.

  ## Solution
  1. Change the foreign key constraint on `checklist_history.checklist_id` from `ON DELETE CASCADE` 
     to `ON DELETE SET NULL`
  2. Make `checklist_id` nullable so it can be set to NULL when the parent checklist is deleted
  3. This preserves the audit trail even after checklist deletion

  ## Changes
  - Drop existing foreign key constraint
  - Alter column to allow NULL
  - Recreate foreign key with ON DELETE SET NULL
*/

-- Drop existing foreign key constraint
ALTER TABLE public.checklist_history 
  DROP CONSTRAINT IF EXISTS checklist_history_checklist_id_fkey;

-- Allow checklist_id to be NULL (for deleted checklists)
ALTER TABLE public.checklist_history 
  ALTER COLUMN checklist_id DROP NOT NULL;

-- Recreate foreign key with ON DELETE SET NULL instead of CASCADE
ALTER TABLE public.checklist_history
  ADD CONSTRAINT checklist_history_checklist_id_fkey 
  FOREIGN KEY (checklist_id) 
  REFERENCES public.checklists(id) 
  ON DELETE SET NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_checklist_history_checklist_id 
  ON public.checklist_history(checklist_id) 
  WHERE checklist_id IS NOT NULL;
