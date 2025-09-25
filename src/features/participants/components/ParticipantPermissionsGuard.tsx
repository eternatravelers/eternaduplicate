import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { Shield, Lock } from 'lucide-react'

interface ParticipantPermissionsGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'super_admin'
  action?: string
  fallback?: React.ReactNode
}

export function ParticipantPermissionsGuard({
  children,
  requiredRole = 'admin',
  action = 'melakukan aksi ini',
  fallback
}: ParticipantPermissionsGuardProps) {
  const { isAdmin, isSuperAdmin, userRole } = useAuth()

  const hasPermission = () => {
    if (requiredRole === 'super_admin') {
      return isSuperAdmin
    }
    return isAdmin || isSuperAdmin
  }

  if (!hasPermission()) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-red-100 p-3 rounded-full">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Akses Terbatas</h3>
          <p className="text-gray-600 mb-4">
            Anda tidak memiliki izin untuk {action}.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
            <Shield className="h-4 w-4" />
            <span>
              Diperlukan peran: {requiredRole === 'super_admin' ? 'Super Admin' : 'Admin'}
            </span>
          </div>
          <div className="mt-2 text-xs text-gray-400">
            Peran Anda saat ini: {userRole || 'Unknown'}
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}