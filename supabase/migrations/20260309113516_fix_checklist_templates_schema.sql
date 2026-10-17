/*
  # Fix Checklist Templates Schema

  ## Problem
  The checklist_templates and checklist_template_items tables are missing columns
  that the frontend code expects, causing create/edit operations to fail silently or
  with constraint violations.

  ## Changes

  ### checklist_templates
  - Add `category` column (text, nullable) - frontend sends this field on every insert/update
  - Add `usage_count` column (integer, default 0) - used for statistics display

  ### checklist_template_items
  - Make `days_before_departure` nullable - the form treats this as optional
  - Make `description` nullable - as a safeguard for optional description fields
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checklist_templates' AND column_name = 'category'
  ) THEN
    ALTER TABLE checklist_templates ADD COLUMN category text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'checklist_templates' AND column_name = 'usage_count'
  ) THEN
    ALTER TABLE checklist_templates ADD COLUMN usage_count integer DEFAULT 0;
  END IF;
END $$;

ALTER TABLE checklist_template_items
  ALTER COLUMN days_before_departure DROP NOT NULL;

ALTER TABLE checklist_template_items
  ALTER COLUMN description DROP NOT NULL;
