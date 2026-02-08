import React, { useState, lazy, Suspense, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/components/Auth/AuthProvider'
import { ProtectedRoute } from '@/components/Auth/ProtectedRoute'
import { SuperAdminRoute } from '@/components/Auth/SuperAdminRoute'
import { LoginForm } from '@/components/Auth/LoginForm'
import { RegisterPage } from '@/components/Auth/RegisterPage'
import { ResetPasswordPage } from '@/components/Auth/ResetPasswordPage'
import { Layout } from '@/components/Layout'
import { Dashboard } from '@/components/Dashboard'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'

const ParticipantsPage = lazy(() => import('@/features/participants/pages/ParticipantsPage').then(m => ({ default: m.ParticipantsPage })))
const TripsPage = lazy(() => import('@/features/trips/pages/TripsPage').then(m => ({ default: m.TripsPage })))
const Destinations = lazy(() => import('@/components/Destinations').then(m => ({ default: m.Destinations })))
const SalesPage = lazy(() => import('@/features/sales/pages/SalesPage').then(m => ({ default: m.SalesPage })))
const OperationalResourcesPage = lazy(() => import('@/features/operational-resources/pages/OperationalResourcesPage').then(m => ({ default: m.OperationalResourcesPage })))
const OperationsPage = lazy(() => import('@/features/operations/pages/OperationsPage').then(m => ({ default: m.OperationsPage })))
const ReportsPage = lazy(() => import('@/features/finance/pages/ReportsPage').then(m => ({ default: m.ReportsPage })))
const AnalyticsPage = lazy(() => import('@/features/analytics/pages/AnalyticsPage').then(m => ({ default: m.AnalyticsPage })))
const TemplatesPage = lazy(() => import('@/features/templates/pages/TemplatesPage').then(m => ({ default: m.TemplatesPage })))
const TrashTransactionsPage = lazy(() => import('@/features/finance/pages/TrashTransactionsPage').then(m => ({ default: m.TrashTransactionsPage })))
const FinancePage = lazy(() => import('@/features/finance/pages/FinancePage').then(m => ({ default: m.FinancePage })))
const TripParticipantsPage = lazy(() => import('@/features/trips/pages/TripParticipantsPage').then(m => ({ default: m.TripParticipantsPage })))
const TripReadinessPage = lazy(() => import('@/features/trips/pages/TripReadinessPage').then(m => ({ default: m.TripReadinessPage })))
const UserManagementPage = lazy(() => import('@/features/user-management/pages/UserManagementPage').then(m => ({ default: m.UserManagementPage })))
const BackupDataPage = lazy(() => import('@/features/backup/pages/BackupDataPage').then(m => ({ default: m.BackupDataPage })))

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
        <p className="text-gray-600">Memuat halaman...</p>
      </div>
    </div>
  )
}
function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [selectedTripForParticipants, setSelectedTripForParticipants] = useState<{id: string, name: string} | null>(null)
  const [selectedTripIdForScheduling, setSelectedTripIdForScheduling] = useState<string | null>(null)
  const [selectedTripForReadiness, setSelectedTripForReadiness] = useState<string | null>(null)
  const { isSuperAdmin, isAdmin, userRole } = useAuth()

  console.log('[AppContent] Auth state:', {
    isSuperAdmin,
    isAdmin,
    userRole,
    activeTab
  })

  const renderContent = () => {
    return (
      <Suspense fallback={<LoadingFallback />}>
        {(() => {
          switch (activeTab) {
            case 'dashboard':
              return <Dashboard />
            case 'participants':
              return <ParticipantsPage />
            case 'trips':
              return <TripsPage
                onViewTripParticipants={(trip) => {
                  setSelectedTripForParticipants(trip)
                  setActiveTab('trip-participants')
                }}
                onViewTripReadiness={(tripId) => {
                  setSelectedTripForReadiness(tripId)
                  setActiveTab('trip-readiness')
                }}
                onNavigateToResourceScheduling={(tripId) => {
                  setSelectedTripIdForScheduling(tripId)
                  setActiveTab('operational-resources')
                }}
              />
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
            case 'templates':
              return <TemplatesPage />
            case 'trash':
              return (
                <SuperAdminRoute>
                  <TrashTransactionsPage />
                </SuperAdminRoute>
              )
            case 'backup':
              return (
                <SuperAdminRoute>
                  <BackupDataPage />
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
            case 'trip-readiness':
              return selectedTripForReadiness ? (
                <TripReadinessPage
                  tripId={selectedTripForReadiness}
                  onBack={() => {
                    setSelectedTripForReadiness(null)
                    setActiveTab('trips')
                  }}
                  onNavigateToMeetingPoints={() => setActiveTab('destinations')}
                  onNavigateToCostPlans={() => setActiveTab('templates')}
                  onNavigateToResourceScheduling={() => setActiveTab('operational-resources')}
                />
              ) : (
                <Dashboard />
              )
            default:
              return <Dashboard />
          }
        })()}
      </Suspense>
    )
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
      <Routes>
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage onBackToLogin={() => window.location.href = '/login'} />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppContent />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App