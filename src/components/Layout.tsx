import React, { useState } from 'react'
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  DollarSign, 
  CheckSquare, 
  FileText, 
  BarChart,
  Menu,
  X,
  Plane,
  Globe,
  UserCheck,
  UserCog,
  LogOut,
  Building,
  ChevronDown,
  ChevronUp,
  Wallet,
  Calculator,
  Settings,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface LayoutProps {
  children: React.ReactNode
  activeTab: string
  onTabChange: (tab: string) => void
  onViewTripParticipants?: (trip: {id: string, name: string}) => void
}

interface MenuItem {
  id: string
  label: string
  icon: any
  type: 'item' | 'category'
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    type: 'item'
  },
  {
    id: 'travel-management',
    label: 'Manajemen Perjalanan',
    icon: Plane,
    type: 'category',
    children: [
      { id: 'trips', label: 'Trip & Operasional', icon: MapPin, type: 'item' },
      { id: 'destinations', label: 'Destinasi', icon: Globe, type: 'item' },
      { id: 'operational-resources', label: 'Sumber Daya Operasional', icon: Settings, type: 'item' },
      { id: 'cost-plans', label: 'Rencana Biaya', icon: Calculator, type: 'item' }
    ]
  },
  {
    id: 'customer-management',
    label: 'Manajemen Pelanggan',
    icon: Users,
    type: 'category',
    children: [
      { id: 'participants', label: 'Pendaftaran', icon: Users, type: 'item' },
      { id: 'sales', label: 'Sales Management', icon: UserCheck, type: 'item' }
    ]
  },
  {
    id: 'finance-reports',
    label: 'Keuangan & Laporan',
    icon: DollarSign,
    type: 'category',
    children: [
      { id: 'finance', label: 'Keuangan', icon: Wallet, type: 'item' },
      { id: 'reports', label: 'Laporan', icon: FileText, type: 'item' },
      { id: 'analytics', label: 'Analisis', icon: BarChart, type: 'item' },
      { id: 'trash', label: 'Sampah', icon: Trash2, type: 'item' }
    ]
  },
  {
    id: 'operations-category',
    label: 'Operasional',
    icon: CheckSquare,
    type: 'category',
    children: [
      { id: 'operations', label: 'Trip Monitoring', icon: CheckSquare, type: 'item' },
      { id: 'meeting-points', label: 'Meeting Point Operations', icon: MapPin, type: 'item' }
    ]
  },
  {
    id: 'user-management',
    label: 'Manajemen Pengguna',
    icon: UserCog,
    type: 'item'
  }
]

export function Layout({ children, activeTab, onTabChange, onViewTripParticipants }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['travel-management'])
  const { user, signOut, userRole, isAdmin, isSuperAdmin } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    )
  }

  const isActiveItem = (itemId: string) => {
    return activeTab === itemId
  }

  const isActiveCategory = (category: MenuItem) => {
    return category.children?.some(child => child.id === activeTab) || false
  }

  // Get company name from user metadata
  const companyName = user?.user_metadata?.company_name || 
                     user?.app_metadata?.company_name || 
                     'Travel Agent'

  // Filter menu items based on user role
  const getFilteredMenuItems = () => {
    if (isSuperAdmin) {
      return menuItems
    }

    if (isAdmin) {
      return menuItems.filter(item => {
        if (item.id === 'dashboard') return true
        if (item.id === 'travel-management') return true
        if (item.id === 'customer-management') return true
        if (item.id === 'operations-category') return true
        if (item.id === 'finance-reports') return false
        if (item.id === 'user-management') return false
        return false
      })
    }

    return []
  }

  const filteredMenuItems = getFilteredMenuItems()

  const renderMenuItem = (item: MenuItem, isChild = false) => {
    const Icon = item.icon
    const isActive = isActiveItem(item.id)
    const isCategoryActive = item.type === 'category' && isActiveCategory(item)
    const isExpanded = expandedCategories.includes(item.id)

    if (item.type === 'item') {
      return (
        <button
          key={item.id}
          onClick={() => {
            onTabChange(item.id)
            setSidebarOpen(false)
          }}
          className={cn(
            "w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors",
            isChild && "ml-4 py-2",
            isActive
              ? "bg-primary text-primary-foreground"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <Icon className={cn("h-5 w-5 mr-3", isChild && "h-4 w-4")} />
          <span className={cn(isChild && "text-sm")}>{item.label}</span>
        </button>
      )
    }

    // Category item
    return (
      <div key={item.id}>
        <button
          onClick={() => toggleCategory(item.id)}
          className={cn(
            "w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-colors",
            isCategoryActive
              ? "bg-blue-50 text-blue-700 border border-blue-200"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          )}
        >
          <div className="flex items-center">
            <Icon className="h-5 w-5 mr-3" />
            {item.label}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>
        
        {isExpanded && item.children && (
          <div className="mt-1 space-y-1">
            {item.children.map(child => renderMenuItem(child, true))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 flex flex-col",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center justify-between h-16 px-6 border-b flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Plane className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-gray-900">WisataManager</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Tenant Info */}
        <div className="px-6 py-4 border-b bg-blue-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-full">
              <Building className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {companyName}
              </p>
              <p className="text-xs text-gray-500">
                {user?.email}
              </p>
              <div className="flex items-center space-x-2 mt-1">
                <Badge 
                  variant={isSuperAdmin ? "default" : "secondary"} 
                  className="text-xs"
                >
                  {isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'User'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-grow overflow-y-auto py-4">
          <div className="px-4 space-y-2">
            {filteredMenuItems.map(item => renderMenuItem(item))}
          </div>
        </nav>

        {/* Sign Out Button */}
        <div className="p-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="w-full justify-start"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Keluar
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <div className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between h-16 px-6">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {new Date().toLocaleDateString('id-ID', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}