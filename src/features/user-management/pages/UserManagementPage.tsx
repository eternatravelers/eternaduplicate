import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, AlertCircle, Users, Shield, UserCheck, Edit, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { formatShortDate } from '@/lib/utils'

interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  role: string
  tenant_id: string | null
  created_at: string
  updated_at: string
}

interface InviteUserData {
  email: string
  role: string
  full_name: string
}

export function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [inviteData, setInviteData] = useState<InviteUserData>({
    email: '',
    role: 'user',
    full_name: ''
  })
  const [editData, setEditData] = useState<Partial<UserProfile>>({})
  const [submitting, setSubmitting] = useState(false)
  
  const { isSuperAdmin, user: currentUser, userProfile: currentUserProfile, tenantId } = useAuth()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!isSuperAdmin) {
        setError('Anda tidak memiliki izin untuk mengakses manajemen pengguna')
        return
      }

      // Fetch users from user_profiles table
      // RLS policies will automatically filter based on user permissions
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setUsers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setSubmitting(true)
      setError(null)

      // For now, we'll show a message that this requires Edge Function
      // In production, this would call an Edge Function to create the user
      setError('Fitur undangan pengguna memerlukan Supabase Edge Function untuk implementasi yang aman. Silakan buat Edge Function terlebih dahulu.')
      
      // Example of what the Edge Function call would look like:
      // const { data, error } = await supabase.functions.invoke('admin-create-user', {
      //   body: {
      //     email: inviteData.email,
      //     role: inviteData.role,
      //     full_name: inviteData.full_name,
      //     tenant_id: tenantId
      //   }
      // })
      
      // if (error) throw error
      
      // setShowInviteForm(false)
      // setInviteData({ email: '', role: 'user', full_name: '' })
      // fetchUsers()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengundang pengguna')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUser) return
    
    try {
      setSubmitting(true)
      setError(null)

      const { error } = await supabase
        .from('user_profiles')
        .update(editData)
        .eq('id', editingUser.id)

      if (error) throw error

      setShowEditForm(false)
      setEditingUser(null)
      setEditData({})
      fetchUsers()
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui pengguna')
    } finally {
      setSubmitting(false)
    }
  }

  const openEditForm = (user: UserProfile) => {
    setEditingUser(user)
    setEditData({
      full_name: user.full_name,
      company_name: user.company_name,
      phone: user.phone,
      role: user.role
    })
    setShowEditForm(true)
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
    regularUsers: users.filter(u => u.role === 'user').length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Pengguna</h1>
          <p className="text-gray-600 mt-2">Kelola pengguna dan peran akses sistem</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowInviteForm(true)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Undang Pengguna
          </Button>
        </div>
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

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Belum ada pengguna yang ditemukan</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="font-medium">{user.full_name || 'Nama tidak tersedia'}</div>
                      <div className="text-sm text-gray-500">ID: {user.user_id}</div>
                      {user.company_name && (
                        <div className="text-xs text-gray-400">{user.company_name}</div>
                      )}
                      <div className="text-xs text-gray-400">
                        Bergabung: {formatShortDate(user.created_at)}
                      </div>
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
                    {user.user_id === currentUser?.id && (
                      <span className="text-xs text-blue-600 font-medium">(Anda)</span>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditForm(user)}
                      disabled={user.user_id === currentUser?.id && user.role === 'super_admin'}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Undang Pengguna Baru</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleInviteUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite_email">Email</Label>
              <Input
                id="invite_email"
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite_full_name">Nama Lengkap</Label>
              <Input
                id="invite_full_name"
                value={inviteData.full_name}
                onChange={(e) => setInviteData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="invite_role">Peran</Label>
              <Select value={inviteData.role} onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Fitur ini memerlukan Supabase Edge Function untuk implementasi yang aman.
              </AlertDescription>
            </Alert>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Mengundang...' : 'Undang'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pengguna</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_full_name">Nama Lengkap</Label>
              <Input
                id="edit_full_name"
                value={editData.full_name || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, full_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_company_name">Nama Perusahaan</Label>
              <Input
                id="edit_company_name"
                value={editData.company_name || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, company_name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_phone">Telepon</Label>
              <Input
                id="edit_phone"
                value={editData.phone || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_role">Peran</Label>
              <Select 
                value={editData.role || 'user'} 
                onValueChange={(value) => setEditData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  {isSuperAdmin && <SelectItem value="super_admin">Super Admin</SelectItem>}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setShowEditForm(false)}>
                Batal
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Implementation Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Status Implementasi:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>✅ Tabel user_profiles dan RLS policies telah dikonfigurasi</li>
                <li>✅ Menampilkan dan mengedit data pengguna dari database</li>
                <li>⏳ Fitur undangan pengguna memerlukan Supabase Edge Function</li>
                <li>⏳ Operasi admin lanjutan memerlukan Service Role key di server-side</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}