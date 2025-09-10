import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Users, Plus, Search, Edit, Trash2, TrendingUp, Award, Phone, Mail, Calendar } from 'lucide-react'
import { useSales, useCreateSales, useUpdateSales } from '@/hooks/useSales'
import { useParticipants } from '@/hooks/useParticipants'
import { formatCurrency, formatShortDate } from '@/lib/utils'

export function Sales() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingSales, setEditingSales] = useState<string | null>(null)
  
  const { sales, loading, refetch } = useSales()
  const { participants } = useParticipants()
  const { createSales, loading: creating } = useCreateSales()
  const { updateSales, loading: updating } = useUpdateSales()

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data, error } = editingSales 
      ? await updateSales(editingSales, formData)
      : await createSales(formData)

    if (!error) {
      setShowAddForm(false)
      setEditingSales(null)
      setFormData({
        name: '',
        email: '',
        phone: ''
      })
      refetch()
    }
  }

  const handleEdit = (sale: any) => {
    setFormData({
      name: sale.name,
      email: sale.email || '',
      phone: sale.phone || ''
    })
    setEditingSales(sale.id)
    setShowAddForm(true)
  }

  const handleAddNew = () => {
    setEditingSales(null)
    setFormData({
      name: '',
      email: '',
      phone: ''
    })
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingSales(null)
    setFormData({
      name: '',
      email: '',
      phone: ''
    })
  }

  const filteredSales = sales.filter(sale =>
    sale.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Calculate sales performance
  const salesPerformance = sales.map(sale => {
    const saleParticipants = participants.filter(p => p.sales_id === sale.id)
    const totalRevenue = saleParticipants.reduce((sum, p) => sum + p.package_price, 0)
    const totalParticipants = saleParticipants.reduce((sum, p) => sum + p.participant_count, 0)
    const avgDealSize = saleParticipants.length > 0 ? totalRevenue / saleParticipants.length : 0
    
    return {
      ...sale,
      participantCount: totalParticipants,
      dealCount: saleParticipants.length,
      totalRevenue,
      avgDealSize,
      lastActivity: saleParticipants.length > 0 
        ? Math.max(...saleParticipants.map(p => new Date(p.created_at).getTime()))
        : null
    }
  }).sort((a, b) => b.totalRevenue - a.totalRevenue)

  const topPerformer = salesPerformance[0]
  const totalSalesRevenue = salesPerformance.reduce((sum, s) => sum + s.totalRevenue, 0)
  const totalDeals = salesPerformance.reduce((sum, s) => sum + s.dealCount, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manajemen Sales</h1>
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
          <h1 className="text-3xl font-bold">Manajemen Sales</h1>
          <p className="text-gray-600 mt-2">Kelola tim sales dan pantau performa mereka</p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Sales
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Sales
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{sales.length}</div>
                <p className="text-xs text-gray-500">
                  Anggota tim sales
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Revenue
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalSalesRevenue)}
                </div>
                <p className="text-xs text-gray-500">
                  Revenue dari sales
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Deals
                </CardTitle>
                <Award className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalDeals}</div>
                <p className="text-xs text-gray-500">
                  Transaksi berhasil
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Avg Deal Size
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalDeals > 0 ? formatCurrency(totalSalesRevenue / totalDeals) : formatCurrency(0)}
                </div>
                <p className="text-xs text-gray-500">
                  Rata-rata per deal
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performer */}
          {topPerformer && (
            <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-yellow-800">
                  <Award className="h-5 w-5" />
                  <span>Top Performer Bulan Ini</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{topPerformer.name}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      {topPerformer.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{topPerformer.email}</span>
                        </div>
                      )}
                      {topPerformer.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{topPerformer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(topPerformer.totalRevenue)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {topPerformer.dealCount} deals • {topPerformer.participantCount} peserta
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Performance Ranking</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesPerformance.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada data performance</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {salesPerformance.map((sale, index) => {
                    const maxRevenue = Math.max(...salesPerformance.map(s => s.totalRevenue))
                    const progressPercentage = maxRevenue > 0 ? (sale.totalRevenue / maxRevenue) * 100 : 0
                    
                    return (
                      <div key={sale.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge variant={index === 0 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center">
                              #{index + 1}
                            </Badge>
                            <div>
                              <h3 className="font-semibold text-gray-900">{sale.name}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <span>{sale.dealCount} deals</span>
                                <span>{sale.participantCount} peserta</span>
                                {sale.lastActivity && (
                                  <span>Last: {formatShortDate(new Date(sale.lastActivity))}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {formatCurrency(sale.totalRevenue)}
                            </div>
                            <div className="text-sm text-gray-500">
                              Avg: {formatCurrency(sale.avgDealSize)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Performance vs Top</span>
                            <span>{progressPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          {/* Add/Edit Sales Form */}
          {showAddForm && (
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Users className="h-5 w-5" />
                  <span>{editingSales ? 'Edit Sales' : 'Tambah Sales Baru'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Contoh: John Doe"
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="john@example.com"
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Nomor Telepon
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="08123456789"
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4 border-t">
                    <Button 
                      type="submit" 
                      disabled={creating || updating}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {creating || updating ? 'Menyimpan...' : editingSales ? 'Update Sales' : 'Simpan Sales'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancel}
                      className="border-gray-300"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Sales List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Daftar Sales</span>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari sales..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredSales.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm ? 'Sales tidak ditemukan' : 'Belum ada sales'}
                  </h3>
                  <p className="text-sm mb-4">
                    {searchTerm 
                      ? 'Coba gunakan kata kunci yang berbeda'
                      : 'Mulai dengan menambahkan anggota tim sales pertama'
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={handleAddNew}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Sales
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sales</TableHead>
                      <TableHead>Kontak</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Deals</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Bergabung</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSales.map((sale) => {
                      const performance = salesPerformance.find(p => p.id === sale.id)
                      const rank = salesPerformance.findIndex(p => p.id === sale.id) + 1
                      
                      return (
                        <TableRow key={sale.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {sale.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{sale.name}</div>
                                {rank <= 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    Rank #{rank}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {sale.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {sale.email}
                                </div>
                              )}
                              {sale.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {sale.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {performance && (
                              <div className="flex items-center space-x-2">
                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full" 
                                    style={{ 
                                      width: `${Math.min((performance.totalRevenue / (salesPerformance[0]?.totalRevenue || 1)) * 100, 100)}%` 
                                    }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500">
                                  {((performance.totalRevenue / (salesPerformance[0]?.totalRevenue || 1)) * 100).toFixed(0)}%
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{performance?.dealCount || 0} deals</div>
                              <div className="text-gray-500">{performance?.participantCount || 0} peserta</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              {formatCurrency(performance?.totalRevenue || 0)}
                            </div>
                            {performance && performance.avgDealSize > 0 && (
                              <div className="text-xs text-gray-500">
                                Avg: {formatCurrency(performance.avgDealSize)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatShortDate(sale.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleEdit(sale)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              {isSuperAdmin && (
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}