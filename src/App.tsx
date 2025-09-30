import React, { useState } from 'react'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
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
import { useAuth } from '@/hooks/useAuth'
function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedTripForParticipants, setSelectedTripForParticipants] = useState<{id: string, name: string} | null>(null)
  const { isSuperAdmin, isAdmin } = useAuth()

  const renderContent = () => {
    // Check if user has access to the requested tab
    const hasAccess = () => {
      if (isSuperAdmin) return true // Super admin has access to everything
      
      if (isAdmin) {
        // Admin only has access to specific tabs
        const adminAllowedTabs = [
          'dashboard',
          'participants', 
          'trips', 
          'destinations', 
          'sales', 
          'operational-resources', 
          'finance',
          'operations',
          'reports',
          'operational-resources',
          'finance',
          'operations',
          'reports',
          'analytics',
          'cost-plans',
          'trash',
          'trip-participants'
        ]
        return adminAllowedTabs.includes(activeTab)
      }
      
      return false
    }

    if (!hasAccess()) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="text-6xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Terbatas</h2>
            <p className="text-gray-600">Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          </div>
        </div>
      )
    }

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
        return <FinancePage />
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