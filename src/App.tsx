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
import { UserManagementPage } from '@/features/user-management/pages/UserManagementPage'
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
        return <OperationalResourcesPage />
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