import React, { useState } from 'react'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/components/Dashboard'
import { ParticipantsPage } from '@/features/participants/pages/ParticipantsPage'
import { TripsPage } from '@/features/trips/pages/TripsPage'
import { Destinations } from '@/components/Destinations'
import { SalesPage } from '@/features/sales/pages/SalesPage'
import { OperationalResources } from '@/components/OperationalResources'
import { Finance } from '@/components/Finance'
import { OperationsPage } from '@/features/operations/pages/OperationsPage'
import { ReportsPage } from '@/features/finance/pages/ReportsPage'
import { AnalyticsPage } from '@/features/analytics/pages/AnalyticsPage'
import { CostPlansPage } from '@/features/cost-plans/pages/CostPlansPage'
import { TrashTransactionsPage } from '@/features/finance/pages/TrashTransactionsPage'
import { supabase } from '@/lib/supabase'

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'participants':
        return <ParticipantsPage />
      case 'trips':
        return <TripsPage />
      case 'destinations':
        return <Destinations />
      case 'sales':
        return <SalesPage />
      case 'operational-resources':
        return <OperationalResources />
      case 'finance':
        return <Finance />
      case 'operations':
        return <OperationsPage />
      case 'reports':
        return <ReportsPage />
      case 'analytics':
        return <AnalyticsPage />
      case 'cost-plans':
        return <CostPlansPage />
      case 'trash':
        return <TrashTransactionsPage />
      case 'user-management':
        return <UserManagementPage />
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  )
}

// --- START TEMPORARY DIAGNOSTIC CODE ---
import { useEffect } from 'react'; // Import useEffect here

function App() {
  useEffect(() => {
    const testSupabaseConnection = async () => {
      console.log('🚀 Starting Supabase connection test...');
      console.time('supabase_connection_test');
      try {
        // Test 1: Try to fetch from trip_types table
        console.log('--- Testing with supabase-js client ---');
        console.log('📋 Testing trip_types table...');
        const { data: tripTypesData, error: tripTypesError } = await supabase
          .from('trip_types')
          .select('id, name')
          .limit(1);

        if (tripTypesError) {
          console.error('❌ trip_types query failed:', tripTypesError);
        } else {
          console.log('✅ trip_types query successful:', tripTypesData);
        }

        // Test 2: Try to fetch from destinations table
        console.log('📋 Testing destinations table...');
        const { data: destinationsData, error: destinationsError } = await supabase
          .from('destinations')
          .select('id, name')
          .limit(1);

        if (destinationsError) {
          console.error('❌ destinations query failed:', destinationsError);
        } else {
          console.log('✅ destinations query successful:', destinationsData);
        }

        // Test 3: Try to fetch from user_profiles table using supabase-js client
        console.log('📋 Testing user_profiles table...');
        const { data: userProfilesData, error: userProfilesError } = await supabase
          .from('user_profiles')
          .select('id, full_name')
          .limit(1);

        if (userProfilesError) {
          console.error('❌ user_profiles query failed:', userProfilesError);
        } else {
          console.log('✅ user_profiles query successful:', userProfilesData);
        }

        console.log('--- Testing with raw fetch API ---');
        // Test 4: Raw fetch to trip_types REST API endpoint
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const restApiUrl = `${supabaseUrl}/rest/v1/trip_types`;
        console.log('📋 Testing raw fetch to trip_types REST API:', restApiUrl);
        const response = await fetch(restApiUrl, {
          headers: { 'apikey': supabaseAnonKey, 'Authorization': `Bearer ${supabaseAnonKey}` }
        });
        const rawFetchData = await response.json();
        console.log('✅ Raw fetch successful:', rawFetchData);


      } catch (err) {
        console.error('❌ Supabase connection test caught an exception:', err);
      } finally {
        console.timeEnd('supabase_connection_test');
        console.log('🏁 Supabase connection test finished');
      }
    };
    testSupabaseConnection();
  }, []);
  // --- END TEMPORARY DIAGNOSTIC CODE ---

  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App