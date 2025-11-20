/*
  # Operational Readiness Checklist Templates System

  ## Overview
  This migration creates a template-based checklist system that automatically generates
  operational readiness checklists for trips based on their trip type and departure timeline.

  ## New Tables
  
  ### 1. checklist_templates
  - Stores reusable checklist templates
  - Can be customized per trip type
  - Includes timing rules (H-14, H-7, H-3, H-1, etc.)
  
  ### 2. checklist_template_items
  - Individual checklist items within templates
  - Includes priority, category, and timing
  - Can have assigned roles/responsibilities

  ## New Functions
  
  ### 1. generate_checklists_from_template
  - Automatically creates checklists for a trip based on template
  - Applies to trip type or uses default template
  - Called when trip status changes to 'open'
  
  ### 2. auto_generate_checklists_on_status_change
  - Trigger function that generates checklists when trip opens
  - Ensures all trips have proper operational checklists

  ## Triggers
  
  ### 1. auto_generate_checklists_trigger
  - Fires when trip status changes to 'open'
  - Automatically generates checklists from template

  ## Security
  - RLS enabled on all new tables
  - Authenticated users can manage templates
  - Public read access for templates

  ## Default Template
  - Creates a comprehensive default template with items for:
    - H-14: Resource confirmation, vendor bookings
    - H-7: Close registration, verify payments, briefing
    - H-3: Final manifest, coordination, equipment check
    - H-1: Welcome kit, final briefing, schedule confirmation
    - Day of: Final checks before departure
*/

-- Create checklist_templates table
CREATE TABLE IF NOT EXISTS checklist_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trip_type text,  -- NULL means applies to all trip types
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create checklist_template_items table
CREATE TABLE IF NOT EXISTS checklist_template_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES checklist_templates(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL,
  priority text NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  category text NOT NULL CHECK (category IN ('pre-departure', 'during-trip', 'post-trip')),
  days_before_departure integer NOT NULL,  -- H-14 = 14, H-7 = 7, H-1 = 1, day-of = 0
  assigned_role text,  -- e.g., 'tour_leader', 'admin', 'driver', etc.
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE checklist_template_items ENABLE ROW LEVEL SECURITY;

-- Create policies for checklist_templates
CREATE POLICY "Allow authenticated users to manage checklist templates"
  ON checklist_templates
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to checklist templates"
  ON checklist_templates
  FOR SELECT
  TO public
  USING (true);

-- Create policies for checklist_template_items
CREATE POLICY "Allow authenticated users to manage checklist template items"
  ON checklist_template_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public read access to checklist template items"
  ON checklist_template_items
  FOR SELECT
  TO public
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_checklist_templates_trip_type ON checklist_templates(trip_type);
CREATE INDEX IF NOT EXISTS idx_checklist_template_items_template_id ON checklist_template_items(template_id);
CREATE INDEX IF NOT EXISTS idx_checklist_template_items_days_before ON checklist_template_items(days_before_departure);

-- Create triggers for updated_at
CREATE TRIGGER update_checklist_templates_updated_at
  BEFORE UPDATE ON checklist_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_checklist_template_items_updated_at
  BEFORE UPDATE ON checklist_template_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate checklists from template
CREATE OR REPLACE FUNCTION generate_checklists_from_template(
  trip_id_param uuid,
  trip_type_param text
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  template_record record;
  template_item record;
  checklist_count integer := 0;
BEGIN
  -- Find applicable template (trip type specific or default)
  SELECT * INTO template_record
  FROM checklist_templates
  WHERE (trip_type = trip_type_param OR trip_type IS NULL)
    AND is_active = true
  ORDER BY trip_type NULLS LAST  -- Prioritize trip-type specific templates
  LIMIT 1;

  -- If no template found, return 0
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Delete existing checklists for this trip (if regenerating)
  DELETE FROM checklists WHERE trip_id = trip_id_param;

  -- Generate checklists from template items
  FOR template_item IN
    SELECT *
    FROM checklist_template_items
    WHERE template_id = template_record.id
    ORDER BY days_before_departure DESC, sort_order ASC
  LOOP
    INSERT INTO checklists (
      trip_id,
      title,
      description,
      completed,
      priority,
      category
    ) VALUES (
      trip_id_param,
      template_item.title,
      template_item.description,
      false,
      template_item.priority,
      template_item.category
    );
    
    checklist_count := checklist_count + 1;
  END LOOP;

  RETURN checklist_count;
END;
$$;

-- Function to auto-generate checklists when trip status changes
CREATE OR REPLACE FUNCTION auto_generate_checklists_on_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  generated_count integer;
BEGIN
  -- Only generate when status changes to 'open' and checklists don't exist yet
  IF NEW.status = 'open' AND OLD.status != 'open' THEN
    -- Check if checklists already exist for this trip
    IF NOT EXISTS (SELECT 1 FROM checklists WHERE trip_id = NEW.id) THEN
      -- Generate checklists from template
      generated_count := generate_checklists_from_template(NEW.id, NEW.trip_type);
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate checklists
DROP TRIGGER IF EXISTS auto_generate_checklists_trigger ON trips;
CREATE TRIGGER auto_generate_checklists_trigger
AFTER UPDATE ON trips
FOR EACH ROW
EXECUTE FUNCTION auto_generate_checklists_on_status_change();

-- Insert default checklist template
INSERT INTO checklist_templates (name, description, trip_type, is_active)
VALUES (
  'Template Standar Operasional Trip',
  'Template checklist operasional standar untuk semua jenis trip. Mencakup persiapan H-14 hingga hari keberangkatan.',
  NULL,  -- Applies to all trip types
  true
) ON CONFLICT DO NOTHING;

-- Get the template ID for inserting items
DO $$
DECLARE
  default_template_id uuid;
BEGIN
  SELECT id INTO default_template_id
  FROM checklist_templates
  WHERE trip_type IS NULL
  ORDER BY created_at DESC
  LIMIT 1;

  IF default_template_id IS NOT NULL THEN
    -- H-14 items
    INSERT INTO checklist_template_items (template_id, title, description, priority, category, days_before_departure, assigned_role, sort_order)
    VALUES
      (default_template_id, 'Konfirmasi Semua Sumber Daya', 'Pastikan bus, driver, dan tour leader sudah dikonfirmasi ketersediaannya', 'high', 'pre-departure', 14, 'admin', 1),
      (default_template_id, 'Booking Hotel/Vendor', 'Lakukan booking hotel dan vendor perjalanan sesuai rencana', 'high', 'pre-departure', 14, 'admin', 2),
      (default_template_id, 'Briefing Awal Tour Leader', 'Briefing kepada tour leader tentang rencana perjalanan', 'medium', 'pre-departure', 14, 'admin', 3);

    -- H-7 items
    INSERT INTO checklist_template_items (template_id, title, description, priority, category, days_before_departure, assigned_role, sort_order)
    VALUES
      (default_template_id, 'Tutup Pendaftaran', 'Tutup pendaftaran peserta baru (auto jika quota penuh)', 'high', 'pre-departure', 7, 'admin', 1),
      (default_template_id, 'Verifikasi Status Pembayaran', 'Pastikan minimal 80% peserta sudah lunas', 'high', 'pre-departure', 7, 'admin', 2),
      (default_template_id, 'Briefing Detail Tour Leader', 'Briefing lengkap kepada tour leader tentang itinerary dan peserta', 'high', 'pre-departure', 7, 'admin', 3),
      (default_template_id, 'Persiapan Dokumen Perjalanan', 'Siapkan semua dokumen perjalanan (manifest, voucher, tiket)', 'medium', 'pre-departure', 7, 'admin', 4);

    -- H-3 items
    INSERT INTO checklist_template_items (template_id, title, description, priority, category, days_before_departure, assigned_role, sort_order)
    VALUES
      (default_template_id, 'Finalisasi Manifest Peserta', 'Finalisasi daftar peserta dan meeting point assignment', 'high', 'pre-departure', 3, 'admin', 1),
      (default_template_id, 'Koordinasi Meeting Point', 'Koordinasi dengan PIC tiap meeting point untuk pickup', 'high', 'pre-departure', 3, 'admin', 2),
      (default_template_id, 'Cek Kondisi Bus', 'Pastikan bus dalam kondisi layak dan terawat', 'high', 'pre-departure', 3, 'driver', 3),
      (default_template_id, 'Siapkan Kontak Darurat', 'Pastikan semua kontak darurat sudah tersedia dan terdistribusi', 'medium', 'pre-departure', 3, 'tour_leader', 4);

    -- H-1 items
    INSERT INTO checklist_template_items (template_id, title, description, priority, category, days_before_departure, assigned_role, sort_order)
    VALUES
      (default_template_id, 'Persiapan Welcome Kit', 'Siapkan welcome kit untuk peserta', 'medium', 'pre-departure', 1, 'admin', 1),
      (default_template_id, 'Final Briefing Tim', 'Briefing terakhir untuk semua tim (driver, tour leader, koordinator)', 'high', 'pre-departure', 1, 'admin', 2),
      (default_template_id, 'Konfirmasi Jadwal Penjemputan', 'Konfirmasi ulang semua jadwal penjemputan di meeting points', 'high', 'pre-departure', 1, 'tour_leader', 3),
      (default_template_id, 'Cek Kelengkapan P3K dan Emergency Kit', 'Pastikan P3K dan emergency kit lengkap dan dibawa', 'high', 'pre-departure', 1, 'tour_leader', 4);

    -- Day of departure (0 days before)
    INSERT INTO checklist_template_items (template_id, title, description, priority, category, days_before_departure, assigned_role, sort_order)
    VALUES
      (default_template_id, 'Cek Kesiapan Bus Final', 'Cek kondisi bus, bahan bakar, dan kebersihan', 'high', 'pre-departure', 0, 'driver', 1),
      (default_template_id, 'Koordinasi Check-in Peserta', 'Pastikan sistem check-in peserta di meeting points berjalan lancar', 'high', 'pre-departure', 0, 'tour_leader', 2),
      (default_template_id, 'Distribusi Welcome Kit', 'Bagikan welcome kit kepada semua peserta', 'medium', 'pre-departure', 0, 'tour_leader', 3),
      (default_template_id, 'Safety Briefing Peserta', 'Berikan safety briefing kepada semua peserta', 'high', 'pre-departure', 0, 'tour_leader', 4);

  END IF;
END $$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION generate_checklists_from_template TO authenticated;
