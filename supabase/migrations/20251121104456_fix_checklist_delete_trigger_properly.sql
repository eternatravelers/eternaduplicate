/*
  # Fix Checklist Delete Trigger to Handle Foreign Key Properly

  ## Problem
  The trigger `log_checklist_change` runs AFTER DELETE and tries to INSERT into 
  checklist_history with a checklist_id that's being deleted in the same transaction.
  Even with ON DELETE SET NULL, the INSERT happens BEFORE the cascade, causing FK violation.

  ## Solution
  Option 1: Don't log DELETE operations to history (they're already being cascade deleted anyway)
  Option 2: Use exception handling to gracefully handle the FK violation
  
  We'll use Option 1 since CASCADE on related tables already handles cleanup,
  and we don't really need audit trail for deleted checklists in the history table.

  ## Changes
  - Modify log_checklist_change function to SKIP INSERT on DELETE operations
  - Return early for DELETE to avoid FK constraint issues
*/

-- Recreate the function with DELETE handling
CREATE OR REPLACE FUNCTION public.log_checklist_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  change_action text;
  old_data jsonb;
  new_data jsonb;
  current_user_id uuid;
BEGIN
  -- Get current user, can be null for system changes
  current_user_id := auth.uid();
  
  -- Only log if there's a user (skip system-triggered updates)
  IF current_user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Special handling for DELETE: don't try to insert history
  -- because the FK constraint will fail even with SET NULL
  -- The CASCADE delete on related tables handles cleanup
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  IF TG_OP = 'INSERT' THEN
    change_action := 'created';
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    change_action := 'updated';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  END IF;

  INSERT INTO public.checklist_history (
    checklist_id,
    user_id,
    action,
    old_value,
    new_value
  ) VALUES (
    NEW.id,
    current_user_id,
    change_action,
    old_data,
    new_data
  );

  RETURN NEW;
END;
$$;

-- Make sure the trigger is properly set up
DROP TRIGGER IF EXISTS trigger_log_checklist_change ON public.checklists;

CREATE TRIGGER trigger_log_checklist_change
  AFTER INSERT OR UPDATE OR DELETE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.log_checklist_change();
