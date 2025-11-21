/*
  # Enhanced Checklist System with Advanced Features V3

  ## Changes from V2
  - Fixed user_id null constraint in checklist_history
  - Made user_id nullable for system-triggered changes
  - Improved trigger logic to handle both user and system changes
*/

-- Add new columns to checklists table
DO $$ 
BEGIN
  -- Assignment fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklists' AND column_name = 'assigned_to'
  ) THEN
    ALTER TABLE public.checklists ADD COLUMN assigned_to uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklists' AND column_name = 'assigned_role'
  ) THEN
    ALTER TABLE public.checklists ADD COLUMN assigned_role text;
  END IF;

  -- Deadline tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklists' AND column_name = 'deadline_date'
  ) THEN
    ALTER TABLE public.checklists ADD COLUMN deadline_date timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklists' AND column_name = 'days_before_departure'
  ) THEN
    ALTER TABLE public.checklists ADD COLUMN days_before_departure integer;
  END IF;

  -- Completion tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklists' AND column_name = 'completed_by'
  ) THEN
    ALTER TABLE public.checklists ADD COLUMN completed_by uuid REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklists' AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.checklists ADD COLUMN completed_at timestamptz;
  END IF;

  -- Notes and attachments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklists' AND column_name = 'notes'
  ) THEN
    ALTER TABLE public.checklists ADD COLUMN notes text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklists' AND column_name = 'attachments'
  ) THEN
    ALTER TABLE public.checklists ADD COLUMN attachments jsonb DEFAULT '[]'::jsonb;
  END IF;

  -- Status workflow
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklists' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.checklists ADD COLUMN status text DEFAULT 'pending' 
      CHECK (status IN ('pending', 'in_progress', 'completed', 'overdue', 'cancelled'));
  END IF;

  -- Notification tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklists' AND column_name = 'notification_sent'
  ) THEN
    ALTER TABLE public.checklists ADD COLUMN notification_sent boolean DEFAULT false;
  END IF;

  -- Sort order
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checklists' AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE public.checklists ADD COLUMN sort_order integer DEFAULT 0;
  END IF;
END $$;

-- Create checklist_comments table
CREATE TABLE IF NOT EXISTS public.checklist_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment text NOT NULL,
  mentions jsonb DEFAULT '[]'::jsonb,
  edited boolean DEFAULT false,
  edited_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create checklist_history table (audit trail) - user_id now nullable for system changes
CREATE TABLE IF NOT EXISTS public.checklist_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create checklist_notifications table
CREATE TABLE IF NOT EXISTS public.checklist_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id),
  notification_type text NOT NULL CHECK (notification_type IN ('reminder', 'assignment', 'mention', 'overdue')),
  channel text NOT NULL CHECK (channel IN ('email', 'push', 'sms')),
  sent boolean DEFAULT false,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on new tables
ALTER TABLE public.checklist_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for checklist_comments
DROP POLICY IF EXISTS "Authenticated users can view all checklist comments" ON public.checklist_comments;
CREATE POLICY "Authenticated users can view all checklist comments"
  ON public.checklist_comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can add comments" ON public.checklist_comments;
CREATE POLICY "Authenticated users can add comments"
  ON public.checklist_comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.checklist_comments;
CREATE POLICY "Users can update their own comments"
  ON public.checklist_comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.checklist_comments;
CREATE POLICY "Users can delete their own comments"
  ON public.checklist_comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for checklist_history (read-only audit log)
DROP POLICY IF EXISTS "Authenticated users can view checklist history" ON public.checklist_history;
CREATE POLICY "Authenticated users can view checklist history"
  ON public.checklist_history FOR SELECT
  TO authenticated
  USING (true);

-- Policies for checklist_notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.checklist_notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.checklist_notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can create notifications" ON public.checklist_notifications;
CREATE POLICY "System can create notifications"
  ON public.checklist_notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "System can update notification status" ON public.checklist_notifications;
CREATE POLICY "System can update notification status"
  ON public.checklist_notifications FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_checklists_assigned_to ON public.checklists(assigned_to);
CREATE INDEX IF NOT EXISTS idx_checklists_deadline_date ON public.checklists(deadline_date);
CREATE INDEX IF NOT EXISTS idx_checklists_status ON public.checklists(status);
CREATE INDEX IF NOT EXISTS idx_checklists_days_before ON public.checklists(days_before_departure);
CREATE INDEX IF NOT EXISTS idx_checklist_comments_checklist_id ON public.checklist_comments(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_comments_user_id ON public.checklist_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_history_checklist_id ON public.checklist_history(checklist_id);
CREATE INDEX IF NOT EXISTS idx_checklist_notifications_user_id ON public.checklist_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_checklist_notifications_sent ON public.checklist_notifications(sent);

-- Function to calculate checklist deadline based on trip departure
CREATE OR REPLACE FUNCTION public.calculate_checklist_deadline(
  trip_id_param uuid,
  days_before_param integer
)
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  trip_departure_date timestamptz;
  calculated_deadline timestamptz;
BEGIN
  SELECT t.departure_date INTO trip_departure_date
  FROM public.trips t
  WHERE t.id = trip_id_param;

  IF trip_departure_date IS NULL THEN
    RETURN NULL;
  END IF;

  calculated_deadline := trip_departure_date - (days_before_param || ' days')::interval;
  
  RETURN calculated_deadline;
END;
$$;

-- Function to auto-update checklist status based on deadline
CREATE OR REPLACE FUNCTION public.auto_update_checklist_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- If completed, set status to completed
  IF NEW.completed = true AND (OLD.completed IS NULL OR OLD.completed = false) THEN
    NEW.status := 'completed';
    NEW.completed_at := now();
    IF auth.uid() IS NOT NULL THEN
      NEW.completed_by := auth.uid();
    END IF;
  END IF;

  -- If uncompleted, check if overdue
  IF NEW.completed = false THEN
    IF NEW.deadline_date IS NOT NULL AND NEW.deadline_date < now() THEN
      NEW.status := 'overdue';
    ELSIF NEW.status = 'overdue' AND NEW.deadline_date > now() THEN
      NEW.status := 'pending';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Function to log checklist changes to history (only for user-initiated changes)
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

  IF TG_OP = 'INSERT' THEN
    change_action := 'created';
    old_data := NULL;
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    change_action := 'updated';
    old_data := to_jsonb(OLD);
    new_data := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    change_action := 'deleted';
    old_data := to_jsonb(OLD);
    new_data := NULL;
  END IF;

  INSERT INTO public.checklist_history (
    checklist_id,
    user_id,
    action,
    old_value,
    new_value
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    current_user_id,
    change_action,
    old_data,
    new_data
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Function to create notifications for approaching deadlines
CREATE OR REPLACE FUNCTION public.create_checklist_notification()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Create reminders for checklists with deadlines in 3 days
  INSERT INTO public.checklist_notifications (
    checklist_id,
    user_id,
    notification_type,
    channel
  )
  SELECT 
    c.id,
    COALESCE(c.assigned_to, t.created_by),
    'reminder',
    'email'
  FROM public.checklists c
  JOIN public.trips t ON c.trip_id = t.id
  WHERE c.completed = false
    AND c.deadline_date IS NOT NULL
    AND c.deadline_date BETWEEN now() AND now() + interval '3 days'
    AND c.notification_sent = false
    AND NOT EXISTS (
      SELECT 1 FROM public.checklist_notifications cn
      WHERE cn.checklist_id = c.id
        AND cn.notification_type = 'reminder'
        AND cn.created_at > now() - interval '1 day'
    );

  -- Mark notifications as sent
  UPDATE public.checklists
  SET notification_sent = true
  WHERE id IN (
    SELECT checklist_id 
    FROM public.checklist_notifications
    WHERE sent = false
      AND notification_type = 'reminder'
  );
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_auto_update_checklist_status ON public.checklists;
CREATE TRIGGER trigger_auto_update_checklist_status
  BEFORE UPDATE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_update_checklist_status();

DROP TRIGGER IF EXISTS trigger_log_checklist_change ON public.checklists;
CREATE TRIGGER trigger_log_checklist_change
  AFTER INSERT OR UPDATE OR DELETE ON public.checklists
  FOR EACH ROW
  EXECUTE FUNCTION public.log_checklist_change();

DROP TRIGGER IF EXISTS trigger_update_checklist_comments_updated_at ON public.checklist_comments;
CREATE TRIGGER trigger_update_checklist_comments_updated_at
  BEFORE UPDATE ON public.checklist_comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update existing checklists with deadline dates (if they have trips)
UPDATE public.checklists c
SET 
  deadline_date = public.calculate_checklist_deadline(c.trip_id, COALESCE(c.days_before_departure, 7)),
  status = CASE 
    WHEN c.completed = true THEN 'completed'
    WHEN public.calculate_checklist_deadline(c.trip_id, COALESCE(c.days_before_departure, 7)) < now() THEN 'overdue'
    ELSE 'pending'
  END
WHERE c.trip_id IS NOT NULL 
  AND c.deadline_date IS NULL;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.calculate_checklist_deadline TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_checklist_notification TO authenticated;
