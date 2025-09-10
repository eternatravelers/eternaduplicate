import { CostPlans } from '@/components/CostPlans'
import { TrashTransactions } from '@/components/TrashTransactions'
import { useAuth } from '@/hooks/useAuth'

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard')
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
          'cost-plans'
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
    }
  }
}