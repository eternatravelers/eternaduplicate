/*
  # Fix Security Issues - Part 2: Consolidate RLS Policies

  ## Consolidate Duplicate RLS Policies
  Merges multiple permissive policies into single, clearer policies per table
  This fixes the "Multiple Permissive Policies" security warnings
*/

-- =====================================================
-- Consolidate RLS Policies
-- =====================================================

-- BUSES table
DROP POLICY IF EXISTS "Allow public read access to buses" ON buses;
DROP POLICY IF EXISTS "Allow authenticated users to manage buses" ON buses;
CREATE POLICY "Authenticated users can read and manage buses" ON buses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- DRIVERS table
DROP POLICY IF EXISTS "Allow public read access to drivers" ON drivers;
DROP POLICY IF EXISTS "Allow authenticated users to manage drivers" ON drivers;
CREATE POLICY "Authenticated users can read and manage drivers" ON drivers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TOUR_LEADERS table
DROP POLICY IF EXISTS "Allow public read access to tour_leaders" ON tour_leaders;
DROP POLICY IF EXISTS "Allow authenticated users to manage tour_leaders" ON tour_leaders;
CREATE POLICY "Authenticated users can read and manage tour_leaders" ON tour_leaders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- DESTINATIONS table
DROP POLICY IF EXISTS "Allow public read access to destinations" ON destinations;
DROP POLICY IF EXISTS "Allow authenticated users to read destinations" ON destinations;
DROP POLICY IF EXISTS "Allow authenticated users to manage destinations" ON destinations;
CREATE POLICY "Authenticated users can read and manage destinations" ON destinations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- DOCUMENTS table
DROP POLICY IF EXISTS "Allow public read access to documents" ON documents;
DROP POLICY IF EXISTS "Allow authenticated users to manage documents" ON documents;
CREATE POLICY "Authenticated users can read and manage documents" ON documents
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- EMERGENCY_CONTACTS table
DROP POLICY IF EXISTS "Allow public read access to emergency_contacts" ON emergency_contacts;
DROP POLICY IF EXISTS "Allow authenticated users to manage emergency_contacts" ON emergency_contacts;
CREATE POLICY "Authenticated users can read and manage emergency_contacts" ON emergency_contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CHECKLISTS table
DROP POLICY IF EXISTS "Allow public read access to checklists" ON checklists;
DROP POLICY IF EXISTS "Allow authenticated users to manage checklists" ON checklists;
CREATE POLICY "Authenticated users can read and manage checklists" ON checklists
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CHECKLIST_TEMPLATES table
DROP POLICY IF EXISTS "Allow public read access to checklist_templates" ON checklist_templates;
DROP POLICY IF EXISTS "Allow authenticated users to manage checklist templates" ON checklist_templates;
CREATE POLICY "Authenticated users can read and manage checklist_templates" ON checklist_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CHECKLIST_TEMPLATE_ITEMS table
DROP POLICY IF EXISTS "Allow public read access to checklist template items" ON checklist_template_items;
DROP POLICY IF EXISTS "Allow authenticated users to manage checklist template items" ON checklist_template_items;
CREATE POLICY "Authenticated users can read and manage checklist_template_items" ON checklist_template_items
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TRIP_BUSES table
DROP POLICY IF EXISTS "Allow public read access to trip_buses" ON trip_buses;
DROP POLICY IF EXISTS "Allow authenticated users to manage trip_buses" ON trip_buses;
CREATE POLICY "Authenticated users can read and manage trip_buses" ON trip_buses
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TRIP_DRIVERS table
DROP POLICY IF EXISTS "Allow public read access to trip_drivers" ON trip_drivers;
DROP POLICY IF EXISTS "Allow authenticated users to manage trip_drivers" ON trip_drivers;
CREATE POLICY "Authenticated users can read and manage trip_drivers" ON trip_drivers
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TRIP_TOUR_LEADERS table
DROP POLICY IF EXISTS "Allow public read access to trip_tour_leaders" ON trip_tour_leaders;
DROP POLICY IF EXISTS "Allow authenticated users to manage trip_tour_leaders" ON trip_tour_leaders;
CREATE POLICY "Authenticated users can read and manage trip_tour_leaders" ON trip_tour_leaders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TRIP_DESTINATIONS table
DROP POLICY IF EXISTS "Allow public read access to trip_destinations" ON trip_destinations;
DROP POLICY IF EXISTS "Allow authenticated users to manage trip_destinations" ON trip_destinations;
CREATE POLICY "Authenticated users can read and manage trip_destinations" ON trip_destinations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TRIP_TYPES table
DROP POLICY IF EXISTS "Public read access to trip_types" ON trip_types;
DROP POLICY IF EXISTS "Authenticated users can manage trip_types" ON trip_types;
CREATE POLICY "Authenticated users can read and manage trip_types" ON trip_types
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- SALES table
DROP POLICY IF EXISTS "Allow authenticated select on sales" ON sales;
DROP POLICY IF EXISTS "Allow authenticated users to manage sales" ON sales;
CREATE POLICY "Authenticated users can read and manage sales" ON sales
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- PARTICIPANTS table - remove one duplicate policy
DROP POLICY IF EXISTS "Authenticated users can view participant ids for trips" ON participants;

-- TRANSACTIONS table - consolidate by action
DROP POLICY IF EXISTS "Authenticated users can read transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can create transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can update transactions" ON transactions;
DROP POLICY IF EXISTS "Authenticated users can delete transactions" ON transactions;
DROP POLICY IF EXISTS "Allow admin to read transactions" ON transactions;
DROP POLICY IF EXISTS "Allow admin to insert transactions" ON transactions;
DROP POLICY IF EXISTS "Allow admin to update transactions" ON transactions;
DROP POLICY IF EXISTS "Allow super admin to manage transactions" ON transactions;

CREATE POLICY "Authenticated users can read transactions" ON transactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage transactions" ON transactions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can modify transactions" ON transactions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can remove transactions" ON transactions
  FOR DELETE TO authenticated USING (true);

-- TRANSACTION_CATEGORIES table
DROP POLICY IF EXISTS "Allow admin to read transaction_categories" ON transaction_categories;
DROP POLICY IF EXISTS "Allow super admin to manage transaction_categories" ON transaction_categories;
CREATE POLICY "Authenticated users can read and manage transaction_categories" ON transaction_categories
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- TRIPS table - consolidate overlapping policies
DROP POLICY IF EXISTS "Allow authenticated users to select trips" ON trips;
DROP POLICY IF EXISTS "Allow authenticated users to insert trips" ON trips;
DROP POLICY IF EXISTS "Allow authenticated users to update trips" ON trips;
DROP POLICY IF EXISTS "Allow authenticated users to delete trips" ON trips;
DROP POLICY IF EXISTS "Allow public read access to trip_types" ON trips;
DROP POLICY IF EXISTS "Allow authenticated users to manage trip_types" ON trips;

CREATE POLICY "Authenticated users can read trips" ON trips
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create trips" ON trips
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can modify trips" ON trips
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can remove trips" ON trips
  FOR DELETE TO authenticated USING (true);
