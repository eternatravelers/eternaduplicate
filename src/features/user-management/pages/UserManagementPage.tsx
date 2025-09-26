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
import { Plus, AlertCircle, Users, Search, Edit, Trash2, UserPlus } from 'lucide-react'
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
  users?: {
    email: string
  }
  email?: string // Computed from users.email
}

export function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteData, setInviteData] = useState({
    email: '',
    fullName: '',
    companyName: '',
    phone: '',
    role: 'admin'
  })
  const [inviting, setInviting] = useState(false)
  
  const { isSuperAdmin, user: currentUser, tenantId } = useAuth()

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!isSuperAdmin) {
        setError('Anda tidak memiliki izin untuk mengakses manajemen pengguna')
        return
      }

      // Fetch user profiles with email from auth.users
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          user_id,
          full_name,
          company_name,
          phone,
          role,
          tenant_id,
          created_at,
          updated_at,
          users!user_profiles_user_id_fkey (
            email
          )
        `)
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Map the joined data to include email
      const usersWithEmails = (data || []).map(profile => ({
        ...profile,
        email: profile.users?.email || 'N/A'
      }))

      setUsers(usersWithEmails)
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

      // Create user account
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: inviteData.email,
        password: 'TempPassword123!', // Temporary password - user should change this
        options: {
          data: {
            full_name: inviteData.fullName,
            company_name: inviteData.companyName,
            phone: inviteData.phone,
            tenant_id: tenantId,
            role: inviteData.role
          }
        }
      })

      if (authError) throw authError

      if (authData.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: authData.user.id,
            full_name: inviteData.fullName,
            company_name: inviteData.companyName,
            phone: inviteData.phone,
            role: inviteData.role,
            tenant_id: tenantId
          }])

        if (profileError) throw profileError

        // Reset form and refresh users
        setInviteData({
          email: '',
          fullName: '',
          companyName: '',
          phone: '',
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter
    
    return matchesSearch && matchesRole
  })

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <Badge className="bg-purple-100 text-purple-800">Super Admin</Badge>
      case 'admin':
        return <Badge className="bg-blue-100 text-blue-800">Admin</Badge>
      case 'user':
        return <Badge variant="outline">User</Badge>
      default:
        return <Badge variant="secondary">{role}</Badge>
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [isSuperAdmin, tenantId])

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
            <Button className="bg-purple-600 hover:bg-purple-700">
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteData.email}
                    onChange={(e) => setInviteData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Nama Lengkap</Label>
                  <Input
                    id="fullName"
                    value={inviteData.fullName}
                    onChange={(e) => setInviteData(prev => ({ ...prev, fullName: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nama Perusahaan</Label>
                  <Input
                    id="companyName"
                    value={inviteData.companyName}
                    onChange={(e) => setInviteData(prev => ({ ...prev, companyName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={inviteData.phone}
                    onChange={(e) => setInviteData(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="role">Peran</Label>
                  <Select value={inviteData.role} onValueChange={(value) => setInviteData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit" disabled={inviting}>
                  {inviting ? 'Mengundang...' : 'Undang Pengguna'}
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
      <div className="grid gap-6 md:grid-cols-3">
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
              Admin
            </CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <p className="text-xs text-gray-500">
              Administrator
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Super Admin
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.role === 'super_admin').length}
            </div>
            <p className="text-xs text-gray-500">
              Super Administrator
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
                        <div className="text-sm text-gray-500">ID: {user.user_id.slice(0, 8)}...</div>
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.company_name || '-'}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{formatShortDate(user.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                          <Edit className="h-3 w-3" />
                        </Button>
                        {user.role !== 'super_admin' && (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                            <Trash2 className="h-3 w-3" />
                          </Button>
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
    </div>
  )
}