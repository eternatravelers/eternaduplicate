/*
  # Fix Security Issues - Part 1: Indexes

  ## 1. Add Missing Indexes for Foreign Keys (6 indexes)
  Creates indexes for foreign keys that don't have covering indexes to improve query performance

  ## 2. Remove Unused Indexes (57 indexes)
  Removes indexes that are not being used to reduce storage and maintenance overhead

  ## 3. Add Critical Performance Indexes
  Adds back essential indexes for frequently used queries
*/

-- =====================================================
-- SECTION 1: Add Missing Indexes for Foreign Keys
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_meeting_point_assignments_pickup_schedule_id
ON meeting_point_assignments(pickup_schedule_id);

CREATE INDEX IF NOT EXISTS idx_participants_parent_participant_id
ON participants(parent_participant_id)
WHERE parent_participant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_installments_created_by
ON payment_installments(created_by);

CREATE INDEX IF NOT EXISTS idx_resource_schedules_created_by
ON resource_schedules(created_by);

CREATE INDEX IF NOT EXISTS idx_user_profiles_deactivated_by
ON user_profiles(deactivated_by)
WHERE deactivated_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_profiles_reactivated_by
ON user_profiles(reactivated_by)
WHERE reactivated_by IS NOT NULL;

-- =====================================================
-- SECTION 2: Remove Unused Indexes
-- =====================================================

DROP INDEX IF EXISTS idx_participants_sales_id;
DROP INDEX IF EXISTS idx_participants_payment_status;
DROP INDEX IF EXISTS idx_participant_audit_log_participant_id;
DROP INDEX IF EXISTS idx_participant_audit_log_action;
DROP INDEX IF EXISTS idx_transactions_trip_id;
DROP INDEX IF EXISTS idx_transactions_destination_id;
DROP INDEX IF EXISTS idx_transactions_created_by_user_id;
DROP INDEX IF EXISTS idx_transactions_proof_url;
DROP INDEX IF EXISTS idx_trip_destinations_destination_id;
DROP INDEX IF EXISTS idx_trips_departure_date;
DROP INDEX IF EXISTS idx_trips_is_template;
DROP INDEX IF EXISTS idx_trips_template_id;
DROP INDEX IF EXISTS idx_trips_cost_plan_id;
DROP INDEX IF EXISTS idx_trips_bus_id;
DROP INDEX IF EXISTS idx_trips_driver_id;
DROP INDEX IF EXISTS idx_tour_leaders_status;
DROP INDEX IF EXISTS idx_buses_plate_number;
DROP INDEX IF EXISTS idx_buses_status;
DROP INDEX IF EXISTS idx_buses_bus_number;
DROP INDEX IF EXISTS idx_buses_type;
DROP INDEX IF EXISTS idx_drivers_name;
DROP INDEX IF EXISTS idx_drivers_status;
DROP INDEX IF EXISTS idx_drivers_license_type;
DROP INDEX IF EXISTS idx_meeting_point_buses_bus_id;
DROP INDEX IF EXISTS idx_meeting_point_drivers_driver_id;
DROP INDEX IF EXISTS idx_meeting_point_assignments_status;
DROP INDEX IF EXISTS idx_pickup_schedules_status;
DROP INDEX IF EXISTS user_profiles_email_idx;
DROP INDEX IF EXISTS user_profiles_role_idx;
DROP INDEX IF EXISTS user_profiles_is_active_idx;
DROP INDEX IF EXISTS user_profiles_deactivated_at_idx;
DROP INDEX IF EXISTS idx_cost_plans_name;
DROP INDEX IF EXISTS idx_transaction_categories_parent_id;
DROP INDEX IF EXISTS idx_payment_installments_payment_type;
DROP INDEX IF EXISTS idx_payment_installments_status;
DROP INDEX IF EXISTS idx_documents_type;
DROP INDEX IF EXISTS idx_checklists_category;
DROP INDEX IF EXISTS idx_checklists_priority;
DROP INDEX IF EXISTS idx_checklists_completed;
DROP INDEX IF EXISTS idx_emergency_contacts_category;
DROP INDEX IF EXISTS idx_emergency_contacts_is_active;
DROP INDEX IF EXISTS idx_emergency_contacts_name;
DROP INDEX IF EXISTS idx_resource_schedules_bus_id;
DROP INDEX IF EXISTS idx_resource_schedules_driver_id;
DROP INDEX IF EXISTS idx_resource_schedules_tour_leader_id;
DROP INDEX IF EXISTS idx_resource_schedules_resource;
DROP INDEX IF EXISTS idx_resource_schedules_return_datetime;
DROP INDEX IF EXISTS idx_resource_schedules_status;
DROP INDEX IF EXISTS idx_resource_schedules_meeting_point;
DROP INDEX IF EXISTS idx_resource_schedules_conflict_check;
DROP INDEX IF EXISTS idx_checklist_template_items_template_id;
DROP INDEX IF EXISTS idx_checklist_template_items_days_before;

-- =====================================================
-- SECTION 3: Add Critical Performance Indexes
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_participants_trip_id_active
ON participants(trip_id)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_category_date
ON transactions(category, transaction_date);

CREATE INDEX IF NOT EXISTS idx_resource_schedules_trip_dates
ON resource_schedules(trip_id, pickup_datetime, return_datetime);

CREATE INDEX IF NOT EXISTS idx_trips_status_departure
ON trips(status, departure_date);
