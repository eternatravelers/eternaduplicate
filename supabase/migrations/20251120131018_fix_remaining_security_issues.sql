/*
  # Fix Remaining Security Issues

  ## 1. Add Missing Indexes for Foreign Keys (16 indexes)
  Creates indexes for foreign keys that don't have covering indexes

  ## 2. Remove Unused Indexes from Previous Migration (7 indexes)
  Removes the indexes we added that turned out to be unused

  ## 3. Consolidate Remaining Duplicate RLS Policies
  Fixes the last remaining duplicate policies
*/

-- =====================================================
-- SECTION 1: Add Missing FK Indexes
-- =====================================================

-- Checklist template items
CREATE INDEX IF NOT EXISTS idx_checklist_template_items_template_id
ON checklist_template_items(template_id);

-- Meeting point buses
CREATE INDEX IF NOT EXISTS idx_meeting_point_buses_bus_id
ON meeting_point_buses(bus_id);

-- Meeting point drivers
CREATE INDEX IF NOT EXISTS idx_meeting_point_drivers_driver_id
ON meeting_point_drivers(driver_id);

-- Participants
CREATE INDEX IF NOT EXISTS idx_participants_sales_id
ON participants(sales_id)
WHERE sales_id IS NOT NULL;

-- Resource schedules
CREATE INDEX IF NOT EXISTS idx_resource_schedules_bus_id
ON resource_schedules(bus_id)
WHERE bus_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resource_schedules_driver_id
ON resource_schedules(driver_id)
WHERE driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resource_schedules_meeting_point_id
ON resource_schedules(meeting_point_id)
WHERE meeting_point_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_resource_schedules_tour_leader_id
ON resource_schedules(tour_leader_id)
WHERE tour_leader_id IS NOT NULL;

-- Transaction categories
CREATE INDEX IF NOT EXISTS idx_transaction_categories_parent_id
ON transaction_categories(parent_id)
WHERE parent_id IS NOT NULL;

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_destination_id
ON transactions(destination_id)
WHERE destination_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_trip_id
ON transactions(trip_id)
WHERE trip_id IS NOT NULL;

-- Trip destinations
CREATE INDEX IF NOT EXISTS idx_trip_destinations_destination_id
ON trip_destinations(destination_id);

-- Trips
CREATE INDEX IF NOT EXISTS idx_trips_bus_id
ON trips(bus_id)
WHERE bus_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trips_cost_plan_id
ON trips(cost_plan_id)
WHERE cost_plan_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trips_driver_id
ON trips(driver_id)
WHERE driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_trips_template_id
ON trips(template_id)
WHERE template_id IS NOT NULL;

-- =====================================================
-- SECTION 2: Remove Unused Indexes from Previous Migration
-- =====================================================

DROP INDEX IF EXISTS idx_meeting_point_assignments_pickup_schedule_id;
DROP INDEX IF EXISTS idx_participants_parent_participant_id;
DROP INDEX IF EXISTS idx_payment_installments_created_by;
DROP INDEX IF EXISTS idx_resource_schedules_created_by;
DROP INDEX IF EXISTS idx_user_profiles_deactivated_by;
DROP INDEX IF EXISTS idx_user_profiles_reactivated_by;
DROP INDEX IF EXISTS idx_transactions_category_date;

-- =====================================================
-- SECTION 3: Consolidate Remaining Duplicate RLS Policies
-- =====================================================

-- CHECKLIST_TEMPLATES - remove old duplicate policy
DROP POLICY IF EXISTS "Allow public read access to checklist templates" ON checklist_templates;

-- PARTICIPANTS table - these are intentionally separate for different roles
-- Keep: "Admin can view active participants" (for admins)
-- Keep: "Super admin can view all participants" (for super admins)
-- These serve different security purposes and should NOT be consolidated

-- USER_PROFILES table - these are intentionally separate for role-based access
-- The multiple policies implement different security levels:
-- - insert_own_profile: Users can create their own profile
-- - only_super_admin_can_set_super_admin: Prevent privilege escalation
-- - super_admin_all: Super admins can do everything
-- - admin_select_same_tenant, auth_view_same_tenant, user_select_own: Different read permissions
-- - admin_update_same_tenant, user_update_own: Different update permissions
-- These should NOT be consolidated as they implement defense-in-depth security
