import React, { useState } from 'react'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { SuperAdminRoute } from '@/components/Auth/SuperAdminRoute'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/components/Dashboard'
import { ParticipantsPage } from '@/features/participants/pages/ParticipantsPage'
import { TripsPage } from '@/features/trips/pages/TripsPage'
import { Destinations } from '@/components/Destinations'
import { SalesPage } from '@/features/sales/pages/SalesPage'
import { OperationalResourcesPage } from '@/features/operational-resources/pages/OperationalResourcesPage'
import { Finance } from '@/components/Finance'
import { OperationsPage } from '@/features/operations/pages/OperationsPage'
import { ReportsPage } from '@/features/finance/pages/ReportsPage'
import { AnalyticsPage } from '@/features/analytics/pages/AnalyticsPage'
import { CostPlansPage } from '@/features/cost-plans/pages/CostPlansPage'
import { TrashTransactionsPage } from '@/features/finance/pages/TrashTransactionsPage'
import { FinancePage } from '@/features/finance/pages/FinancePage'
import { TripParticipantsPage } from '@/features/trips/pages/TripParticipantsPage'
import { UserManagementPage } from '@/features/user-management/pages/UserManagementPage'
import { useAuth } from '@/hooks/useAuth'
function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedTripForParticipants, setSelectedTripForParticipants] = useState<{id: string, name: string} | null>(null)
  const { isSuperAdmin, isAdmin, userRole } = useAuth()

  console.log('[AppContent] Auth state:', {
    isSuperAdmin,
    isAdmin,
    userRole,
    activeTab
  })

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'participants':
        return <ParticipantsPage />
      case 'trips':
        return <TripsPage onViewTripParticipants={(trip) => {
          setSelectedTripForParticipants(trip)
          setActiveTab('trip-participants')
        }} />
      case 'destinations':
        return <Destinations />
      case 'sales':
        return <SalesPage />
      case 'operational-resources':
        return <OperationalResourcesPage />
      case 'finance':
        return (
          <SuperAdminRoute>
            <FinancePage />
          </SuperAdminRoute>
        )
      case 'operations':
        return <OperationsPage />
      case 'reports':
        return (
          <SuperAdminRoute>
            <ReportsPage />
          </SuperAdminRoute>
        )
      case 'analytics':
        return (
          <SuperAdminRoute>
            <AnalyticsPage />
          </SuperAdminRoute>
        )
      case 'cost-plans':
        return <CostPlansPage />
      case 'trash':
        return (
          <SuperAdminRoute>
            <TrashTransactionsPage />
          </SuperAdminRoute>
        )
      case 'user-management':
        return (
          <SuperAdminRoute>
            <UserManagementPage />
          </SuperAdminRoute>
        )
      case 'trip-participants':
        return selectedTripForParticipants ? (
          <TripParticipantsPage
            tripId={selectedTripForParticipants.id}
            tripName={selectedTripForParticipants.name}
            onBack={() => setActiveTab('trips')}
          />
        ) : (
          <Dashboard />
        )
      default:
        return <Dashboard />
    }
  }

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      onViewTripParticipants={(trip) => {
        setSelectedTripForParticipants(trip)
        setActiveTab('trip-participants')
      }}
    >
      {renderContent()}
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <AppContent />
      </ProtectedRoute>
    </AuthProvider>
  )
}

export default App