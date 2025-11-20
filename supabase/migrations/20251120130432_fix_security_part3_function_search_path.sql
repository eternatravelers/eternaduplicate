/*
  # Fix Security Issues - Part 3: Function Search Path

  ## Fix Function Search Path Security
  Sets search_path to empty for all functions to prevent search path injection attacks
  This addresses the "Function Search Path Mutable" security warnings
*/

-- =====================================================
-- Fix Function Search Path Security (34 functions)
-- =====================================================

ALTER FUNCTION set_timestamp() SET search_path = '';
ALTER FUNCTION get_trip_resources(uuid) SET search_path = '';
ALTER FUNCTION sync_resource_schedule_fk_columns() SET search_path = '';
ALTER FUNCTION update_participant_payment_totals() SET search_path = '';
ALTER FUNCTION create_transaction_for_payment() SET search_path = '';
ALTER FUNCTION update_trip_types_updated_at() SET search_path = '';
ALTER FUNCTION update_participant_payment_totals_manual(uuid) SET search_path = '';
ALTER FUNCTION get_meeting_point_summary(uuid) SET search_path = '';
ALTER FUNCTION auto_create_dp_installment() SET search_path = '';
ALTER FUNCTION can_deactivate_user(uuid) SET search_path = '';
ALTER FUNCTION can_delete_user(uuid) SET search_path = '';
ALTER FUNCTION check_bus_availability(uuid, date, date, uuid) SET search_path = '';
ALTER FUNCTION check_driver_availability(uuid, date, date, uuid) SET search_path = '';
ALTER FUNCTION check_tour_leader_availability(uuid, date, date, uuid) SET search_path = '';
ALTER FUNCTION update_meeting_point_tables_updated_at() SET search_path = '';
ALTER FUNCTION update_meeting_points_updated_at() SET search_path = '';
ALTER FUNCTION get_conflicting_trips_for_bus(uuid, date, date, uuid) SET search_path = '';
ALTER FUNCTION get_conflicting_trips_for_driver(uuid, date, date, uuid) SET search_path = '';
ALTER FUNCTION get_conflicting_trips_for_tour_leader(uuid, date, date, uuid) SET search_path = '';
ALTER FUNCTION update_trip_participant_counts() SET search_path = '';
ALTER FUNCTION enforce_trip_status_rules() SET search_path = '';
ALTER FUNCTION update_resource_schedules_updated_at() SET search_path = '';
ALTER FUNCTION get_resource_schedule(text, uuid, timestamp with time zone, timestamp with time zone) SET search_path = '';
ALTER FUNCTION log_participant_action(uuid, text, uuid, text, text, jsonb) SET search_path = '';
ALTER FUNCTION check_trip_can_accept_registrations(uuid) SET search_path = '';
ALTER FUNCTION auto_generate_checklists_on_status_change() SET search_path = '';
ALTER FUNCTION generate_checklists_from_template(uuid, text) SET search_path = '';
ALTER FUNCTION validate_trip_status_transition(uuid, text, text) SET search_path = '';
ALTER FUNCTION calculate_trip_readiness_score(uuid) SET search_path = '';
ALTER FUNCTION update_updated_at_column() SET search_path = '';
ALTER FUNCTION get_user_role() SET search_path = '';
ALTER FUNCTION check_resource_schedule_conflict(text, uuid, timestamp with time zone, timestamp with time zone, uuid) SET search_path = '';
ALTER FUNCTION get_available_resources(text, timestamp with time zone, timestamp with time zone) SET search_path = '';
ALTER FUNCTION get_resource_utilization(text, timestamp with time zone, timestamp with time zone) SET search_path = '';
