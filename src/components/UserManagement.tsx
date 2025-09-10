import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Users, Plus, Search, Edit, Trash2, Shield, UserCheck, Crown, AlertCircle } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { formatShortDate } from '@/lib/utils'

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

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [updatingRole, setUpdatingRole] = useState<string | null>(null)
  
  const { isSuperAdmin, user: currentUser } = useAuth()

  const [inviteData, setInviteData] = useState({
    email: '',
    fullName: '',
    role: 'admin'
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      // Only super admin can access user management
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

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setError(null)
      
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(
        inviteData.email,
        {
          data: {
            full_name: inviteData.fullName,
            role: inviteData.role,
            invited_by: currentUser?.id
          }
        }
      )

      if (error) throw error

      setShowInviteForm(false)
      setInviteData({ email: '', fullName: '', role: 'admin' })
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengundang pengguna')
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      setUpdatingRole(userId)
      setError(null)

      // Prevent changing own role
      if (userId === currentUser?.id) {
        setError('Anda tidak dapat mengubah peran Anda sendiri')
        return
      }

      const { error } = await supabase.auth.admin.updateUserById(userId, {
        user_metadata: { role: newRole }
      })

      if (error) throw error

      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengubah peran pengguna')
    } finally {
      setUpdatingRole(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      setError(null)

      // Prevent deleting own account
      if (userId === currentUser?.id) {
        setError('Anda tidak dapat menghapus akun Anda sendiri')
        return
      }

      const { error } = await supabase.auth.admin.deleteUser(userId)

      if (error) throw error

      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus pengguna')
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [isSuperAdmin])

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_metadata?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return (
          <Badge className="bg-purple-100 text-purple-800 border-purple-200">
            <Crown className="h-3 w-3 mr-1" />
            Super Admin
          </Badge>
        )
      case 'admin':
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
            <Shield className="h-3 w-3 mr-1" />
            Admin
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <UserCheck className="h-3 w-3 mr-1" />
            User
          </Badge>
        )
    }
  }

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

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pengguna
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Super Admin
            </CardTitle>
            <Crown className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.user_metadata?.role === 'super_admin').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Admin
            </CardTitle>
            <Shield className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.user_metadata?.role === 'admin').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite User Form */}
      {showInviteForm && (
        <Card className="border-purple-200 shadow-lg">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center space-x-2 text-purple-800">
              <Plus className="h-5 w-5" />
              <span>Undang Pengguna Baru</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="user@example.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <Input
                    id="fullName"
                    value={inviteData.fullName}
                    onChange={(e) => setInviteData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Peran</Label>
                  <Select value={inviteData.role} onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Kirim Undangan
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowInviteForm(false)}
                >
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Daftar Pengguna</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari pengguna..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pengguna</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead>Login Terakhir</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {user.user_metadata?.full_name || 'Nama tidak tersedia'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {user.user_metadata?.company_name || ''}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {getRoleBadge(user.user_metadata?.role || 'admin')}
                  </TableCell>
                  <TableCell>{formatShortDate(user.created_at)}</TableCell>
                  <TableCell>
                    {user.last_sign_in_at ? formatShortDate(user.last_sign_in_at) : 'Belum pernah'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {user.id !== currentUser?.id && (
                        <>
                          <Select
                            value={user.user_metadata?.role || 'admin'}
                            onValueChange={(value) => handleUpdateRole(user.id, value)}
                            disabled={updatingRole === user.id}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="super_admin">Super Admin</SelectItem>
                            </SelectContent>
                          </Select>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Pengguna</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus pengguna "{user.email}"? 
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Hapus
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </>
                      )}
                      {user.id === currentUser?.id && (
                        <Badge variant="outline" className="text-blue-600">
                          Anda
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}