import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, AlertCircle, Users, Shield, UserCheck } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  email: string
  full_name?: string
  company_name?: string
  phone?: string
  role?: string
  created_at: string
  last_sign_in_at?: string
}

export function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
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

      // Instead of using admin API, we'll create a more limited approach
      // For now, we'll show a placeholder implementation
      // In a real app, you'd need to create a server-side function or use RLS policies
      
      // Placeholder data - in real implementation, this would come from a secure endpoint
      const mockUsers: UserProfile[] = [
        {
          id: currentUser?.id || '1',
          email: currentUser?.email || 'admin@example.com',
          full_name: currentUser?.user_metadata?.full_name || 'Super Admin',
          company_name: currentUser?.user_metadata?.company_name || 'Travel Agency',
          phone: currentUser?.user_metadata?.phone || '',
          role: 'super_admin',
          created_at: new Date().toISOString(),
          last_sign_in_at: new Date().toISOString()
        }
      ]

      setUsers(mockUsers)
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

  const userStats = {
    totalUsers: users.length,
    superAdmins: users.filter(u => u.role === 'super_admin').length,
    admins: users.filter(u => u.role === 'admin').length,
    regularUsers: users.filter(u => !u.role || u.role === 'user').length
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

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pengguna
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.totalUsers}</div>
            <p className="text-xs text-gray-500">
              Pengguna terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Super Admin
            </CardTitle>
            <Shield className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{userStats.superAdmins}</div>
            <p className="text-xs text-gray-500">
              Akses penuh
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Admin
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{userStats.admins}</div>
            <p className="text-xs text-gray-500">
              Akses terbatas
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pengguna Biasa
            </CardTitle>
            <Users className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.regularUsers}</div>
            <p className="text-xs text-gray-500">
              Akses dasar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Current Implementation Notice */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Implementasi Sementara</p>
              <p className="mb-2">
                Fitur manajemen pengguna saat ini menampilkan data terbatas karena keterbatasan keamanan client-side.
              </p>
              <p className="text-xs">
                Untuk implementasi lengkap, diperlukan:
              </p>
              <ul className="list-disc list-inside text-xs mt-1 space-y-1">
                <li>Supabase Edge Function untuk operasi admin</li>
                <li>Row Level Security (RLS) policies yang tepat</li>
                <li>Service role key di server-side</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{user.full_name || user.email}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    {user.company_name && (
                      <div className="text-xs text-gray-400">{user.company_name}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'super_admin' 
                      ? 'bg-red-100 text-red-800' 
                      : user.role === 'admin'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role === 'super_admin' ? 'Super Admin' : 
                     user.role === 'admin' ? 'Admin' : 'User'}
                  </span>
                  {user.id === currentUser?.id && (
                    <span className="text-xs text-blue-600 font-medium">(Anda)</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite Form Modal Placeholder */}
      {showInviteForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Undang Pengguna Baru</h2>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Fitur undangan pengguna memerlukan implementasi server-side untuk keamanan yang optimal.
                </AlertDescription>
              </Alert>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowInviteForm(false)}>
                  Tutup
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}