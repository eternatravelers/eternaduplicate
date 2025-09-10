import React, { useState } from 'react'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/components/Dashboard'
import { Participants } from '@/components/Participants'
import { Trips } from '@/components/Trips'
import { Destinations } from '@/components/Destinations'
import { Sales } from '@/components/Sales'
import { OperationalResources } from '@/components/OperationalResources'
import { Finance } from '@/components/Finance'
import { Operations } from '@/components/Operations'
import { Reports } from '@/components/Reports'
import { Analytics } from '@/components/Analytics'
import { CostPlans } from '@/components/CostPlans'
import { TrashTransactions } from '@/components/TrashTransactions'

import { UserManagement } from '@/components/UserManagement'
function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />
      case 'participants':
        return <Participants />
      case 'trips':
        return <Trips />
      case 'destinations':
        return <Destinations />
      case 'sales':
        return <Sales />
      case 'operational-resources':
        return <OperationalResources />
      case 'finance':
        return <Finance />
      case 'operations':
        return <Operations />
      case 'reports':
        return <Reports />
      case 'analytics':
        return <Analytics />
      case 'cost-plans':
        return <CostPlans />
      case 'trash':
        return <TrashTransactions />
      case 'user-management':
        return <UserManagement />
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