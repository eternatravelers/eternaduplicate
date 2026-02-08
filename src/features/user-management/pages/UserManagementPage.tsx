import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Plus, AlertCircle, Users, Search, CreditCard as Edit, Trash2, UserPlus, UserX, UserCheck, Ban } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { formatShortDate } from '@/lib/utils'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  role: string
  is_active: boolean
  deactivated_at: string | null
  deactivated_by: string | null
  reactivated_at: string | null
  created_at: string
}

export function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'admin'
  })
  const [inviting, setInviting] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deactivatingUserId, setDeactivatingUserId] = useState<string | null>(null)
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const { isSuperAdmin, user: currentUser } = useAuth()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!isSuperAdmin) {
        setError('Anda tidak memiliki izin untuk mengakses manajemen pengguna')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-users`
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch users')
      }

      const data = await response.json()
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
      setInviting(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-user`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteData.email,
          role: inviteData.role
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to invite user')
      }

      const data = await response.json()

      if (data.success) {
        alert(`Undangan berhasil dikirim!\n\nEmail: ${inviteData.email}\n\nPengguna dapat mendaftar melalui halaman registrasi dengan menggunakan email tersebut.`)

        setInviteData({
          email: '',
          role: 'admin'
        })
        setShowInviteForm(false)
        fetchUsers()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengundang pengguna')
    } finally {
      setInviting(false)
    }
  }

  const handleEditUser = (user: UserProfile) => {
    setEditingUser(user)
    setShowEditForm(true)
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingUser) return

    try {
      setError(null)

      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          full_name: editingUser.full_name,
          company_name: editingUser.company_name,
          phone: editingUser.phone,
          role: editingUser.role,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingUser.id)

      if (updateError) throw updateError

      alert('Pengguna berhasil diperbarui!')
      setShowEditForm(false)
      setEditingUser(null)
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal memperbarui pengguna')
    }
  }

  const handleDeactivateUser = async () => {
    if (!deactivatingUserId) return

    try {
      setActionLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deactivate-user`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: deactivatingUserId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to deactivate user')
      }

      alert('Pengguna berhasil dinonaktifkan!')
      setShowDeactivateDialog(false)
      setDeactivatingUserId(null)
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menonaktifkan pengguna')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivateUser = async (userId: string) => {
    if (!confirm('Apakah Anda yakin ingin mengaktifkan kembali pengguna ini?')) {
      return
    }

    try {
      setActionLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reactivate-user`
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to reactivate user')
      }

      alert('Pengguna berhasil diaktifkan kembali!')
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengaktifkan pengguna')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteUser = async () => {
    if (!deletingUserId) return

    try {
      setActionLoading(true)
      setError(null)

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('No active session')
      }

      const { error: deleteError } = await supabase.auth.admin.deleteUser(
        deletingUserId
      )

      if (deleteError) throw deleteError

      alert('Pengguna berhasil dihapus secara permanen!')
      setShowDeleteDialog(false)
      setDeletingUserId(null)
      fetchUsers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus pengguna')
    } finally {
      setActionLoading(false)
    }
  }

  const openDeleteDialog = (userId: string) => {
    setDeletingUserId(userId)
    setShowDeleteDialog(true)
  }

  const openDeactivateDialog = (userId: string) => {
    setDeactivatingUserId(userId)
    setShowDeactivateDialog(true)
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active)

    return matchesSearch && matchesRole && matchesStatus
  })

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-blue-100 text-blue-800">Super Admin</Badge>
      case 'admin':
        return <Badge className="bg-green-100 text-green-800">Admin</Badge>
      case 'user':
        return <Badge variant="outline">User</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800">Aktif</Badge>
    }
    return <Badge className="bg-gray-100 text-gray-800">Nonaktif</Badge>
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
        <Dialog open={showInviteForm} onOpenChange={setShowInviteForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Undang Pengguna
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Undang Pengguna Baru</span>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleInviteUser} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-800">
                  Pengguna yang diundang akan menerima akses untuk mendaftar dengan email mereka. Mereka akan mengisi data lengkap saat registrasi.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@perusahaan.com"
                    value={inviteData.email}
                    onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-gray-500">Email yang akan digunakan untuk registrasi</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Peran</Label>
                  <Select value={inviteData.role} onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">Peran yang akan diberikan setelah registrasi</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={inviting} className="bg-blue-600 hover:bg-blue-700">
                  {inviting ? 'Mengirim Undangan...' : 'Kirim Undangan'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowInviteForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
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
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-xs text-gray-500">
              Pengguna terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pengguna Aktif
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.is_active).length}
            </div>
            <p className="text-xs text-gray-500">
              Pengguna yang aktif
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pengguna Nonaktif
            </CardTitle>
            <UserX className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => !u.is_active).length}
            </div>
            <p className="text-xs text-gray-500">
              Pengguna dinonaktifkan
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari pengguna..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Peran</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="inactive">Nonaktif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || roleFilter !== 'all' ? 'Pengguna tidak ditemukan' : 'Belum ada pengguna'}
              </h3>
              <p className="text-sm mb-4">
                {searchTerm || roleFilter !== 'all' 
                  ? 'Coba ubah filter pencarian Anda'
                  : 'Mulai dengan mengundang pengguna pertama'
                }
              </p>
              {!searchTerm && roleFilter === 'all' && (
                <Button onClick={() => setShowInviteForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Undang Pengguna
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Perusahaan</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Bergabung</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.full_name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.company_name || '-'}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.is_active)}</TableCell>
                    <TableCell>{formatShortDate(user.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEditUser(user)}
                          title="Edit pengguna"
                          disabled={actionLoading}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {user.id !== currentUser?.id && (
                          <>
                            {user.is_active ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700"
                                onClick={() => openDeactivateDialog(user.id)}
                                title="Nonaktifkan pengguna"
                                disabled={actionLoading}
                              >
                                <Ban className="h-3 w-3" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                onClick={() => handleReactivateUser(user.id)}
                                title="Aktifkan kembali pengguna"
                                disabled={actionLoading}
                              >
                                <UserCheck className="h-3 w-3" />
                              </Button>
                            )}
                            {user.role !== 'super_admin' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                onClick={() => openDeleteDialog(user.id)}
                                title="Hapus pengguna permanent"
                                disabled={actionLoading}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Edit className="h-5 w-5" />
              <span>Edit Pengguna</span>
            </DialogTitle>
          </DialogHeader>
          {editingUser && (
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Email</Label>
                  <Input
                    value={editingUser.email}
                    disabled
                    className="bg-gray-50"
                  />
                  <p className="text-xs text-gray-500">Email tidak dapat diubah</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-fullName">Nama Lengkap</Label>
                  <Input
                    id="edit-fullName"
                    value={editingUser.full_name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, full_name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-companyName">Nama Perusahaan</Label>
                  <Input
                    id="edit-companyName"
                    value={editingUser.company_name || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, company_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Nomor Telepon</Label>
                  <Input
                    id="edit-phone"
                    value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Peran</Label>
                  <Select
                    value={editingUser.role}
                    onValueChange={(value) => setEditingUser({ ...editingUser, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">
                  Simpan Perubahan
                </Button>
                <Button type="button" variant="outline" onClick={() => {
                  setShowEditForm(false)
                  setEditingUser(null)
                }}>
                  Batal
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Deactivate User Alert Dialog */}
      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nonaktifkan Pengguna</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menonaktifkan pengguna ini? Pengguna tidak akan dapat login, tetapi data mereka akan tetap tersimpan dan dapat diaktifkan kembali kapan saja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeactivateDialog(false)
              setDeactivatingUserId(null)
            }} disabled={actionLoading}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateUser}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={actionLoading}
            >
              {actionLoading ? 'Menonaktifkan...' : 'Nonaktifkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Alert Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengguna Permanen</AlertDialogTitle>
            <AlertDialogDescription>
              <strong className="text-red-600">PERINGATAN:</strong> Tindakan ini tidak dapat dibatalkan!
              <br /><br />
              Anda akan menghapus pengguna ini secara permanen dari sistem. Semua data terkait pengguna akan hilang selamanya.
              <br /><br />
              Jika Anda hanya ingin menangguhkan akses sementara, gunakan opsi "Nonaktifkan" sebagai gantinya.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false)
              setDeletingUserId(null)
            }} disabled={actionLoading}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={actionLoading}
            >
              {actionLoading ? 'Menghapus...' : 'Hapus Permanen'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}