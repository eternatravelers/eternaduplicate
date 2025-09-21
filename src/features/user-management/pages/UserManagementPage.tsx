import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface User {
  id: string
  email: string
  user_metadata: {
    full_name?: string
    company_name?: string
    phone?: string
    role?: string
  }
  created_at: string
  last_sign_in_at: string
}

export function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteForm, setShowInviteForm] = useState(false)
  
  const { isSuperAdmin, user: currentUser } = useAuth()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!isSuperAdmin) {
        setError('Anda tidak memiliki izin untuk mengakses manajemen pengguna')
        return
      }

      const { data, error } = await supabase.auth.admin.listUsers()
      
      if (error) throw error

      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [isSuperAdmin])

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Akses Terbatas</h2>
          <p className="text-gray-600">Hanya Super Admin yang dapat mengakses manajemen pengguna.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
          <p className="text-gray-600 mt-2">Kelola pengguna dan peran akses sistem</p>
        </div>
        <Button onClick={() => setShowInviteForm(true)} className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Undang Pengguna
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* User management components will be implemented later */}
      <div className="text-center py-8 text-gray-500">
        User management components coming soon...
      </div>
    </div>
  )
}