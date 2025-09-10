import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DollarSign, Plus, TrendingUp, TrendingDown, Wallet, Search, Settings, Edit, Trash2, FolderPlus, Tag, MapPin, Calendar, BarChart3, Filter } from 'lucide-react'
import { useTransactions, useTransactionSummary, useCreateTransaction } from '@/hooks/useTransactions'
import { useTrips } from '@/hooks/useTrips'
import { useDestinations } from '@/hooks/useDestinations'
import { useTransactionCategories, useCreateTransactionCategory, useUpdateTransactionCategory, useDeleteTransactionCategory, useFlatCategories } from '@/hooks/useTransactionCategories'
import { formatCurrency, formatShortDate } from '@/lib/utils'

export function Finance() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('transactions')
  
  // Trip flow states
  const [selectedTripIds, setSelectedTripIds] = useState<string[]>([])
  const [tripFlowSearchTerm, setTripFlowSearchTerm] = useState('')
  
  const { transactions, loading, refetch } = useTransactions()
  const summary = useTransactionSummary()
  const { trips } = useTrips()
  const { destinations } = useDestinations()
  const { createTransaction, loading: creating } = useCreateTransaction()
  
  // Trip flow hooks
  const { transactions: tripTransactions, loading: tripTransactionsLoading } = useTransactions(selectedTripIds.length > 0 ? selectedTripIds : undefined)
  const tripSummary = useTransactionSummary(selectedTripIds.length > 0 ? selectedTripIds : undefined)
  
  // Category management hooks
  const { categories, loading: categoriesLoading, refetch: refetchCategories } = useTransactionCategories()
  const { createCategory, loading: creatingCategory } = useCreateTransactionCategory()
  const { updateCategory, loading: updatingCategory } = useUpdateTransactionCategory()
  const { deleteCategory, loading: deletingCategory } = useDeleteTransactionCategory()
  const flatCategories = useFlatCategories()

  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: 'Pemasukan',
    category: '',
    amount: 0,
    description: '',
    trip_id: null as string | null,
    destination_id: null as string | null,
    trip_type: ''
  })

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    type: 'Pemasukan' as 'Pemasukan' | 'Pengeluaran',
    parent_id: null as string | null,
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      trip_id: formData.trip_id === 'none' ? null : formData.trip_id,
      destination_id: formData.destination_id === 'none' ? null : formData.destination_id
    }
    
    const { data, error } = await createTransaction(submitData)

    if (!error) {
      setShowAddForm(false)
      setFormData({
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_type: 'Pemasukan',
        category: '',
        amount: 0,
        description: '',
        trip_id: null,
        destination_id: null,
        trip_type: ''
      })
      refetch()
    }
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...categoryFormData,
      parent_id: categoryFormData.parent_id === 'none' ? null : categoryFormData.parent_id
    }

    const { data, error } = editingCategory 
      ? await updateCategory(editingCategory, submitData)
      : await createCategory(submitData)

    if (!error) {
      setShowCategoryForm(false)
      setEditingCategory(null)
      setCategoryFormData({
        name: '',
        type: 'Pemasukan',
        parent_id: null,
        description: ''
      })
      refetchCategories()
    }
  }

  const handleEditCategory = (category: any) => {
    setCategoryFormData({
      name: category.name,
      type: category.type,
      parent_id: category.parent_id,
      description: category.description || ''
    })
    setEditingCategory(category.id)
    setShowCategoryForm(true)
  }

  const handleDeleteCategory = async (id: string) => {
    const { error } = await deleteCategory(id)
    if (!error) {
      refetchCategories()
    }
  }

  const handleTripSelection = (tripId: string, checked: boolean) => {
    if (checked) {
      setSelectedTripIds(prev => [...prev, tripId])
    } else {
      setSelectedTripIds(prev => prev.filter(id => id !== tripId))
    }
  }

  const handleSelectAllTrips = () => {
    const filteredTripIds = filteredTripsForFlow.map(trip => trip.id)
    setSelectedTripIds(filteredTripIds)
  }

  const handleDeselectAllTrips = () => {
    setSelectedTripIds([])
  }

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || transaction.transaction_type === filterType
    return matchesSearch && matchesType
  })

  const filteredTripsForFlow = trips.filter(trip =>
    trip.name.toLowerCase().includes(tripFlowSearchTerm.toLowerCase()) ||
    trip.destinations?.some(d => d.name?.toLowerCase().includes(tripFlowSearchTerm.toLowerCase()))
  )

  const filteredTripTransactions = tripTransactions.filter(transaction => {
    const matchesSearch = transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.category.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || transaction.transaction_type === filterType
    return matchesSearch && matchesType
  })

  const getTypeBadge = (type: string) => {
    return type === 'Pemasukan' 
      ? <Badge className="bg-green-500">Pemasukan</Badge>
      : <Badge className="bg-red-500">Pengeluaran</Badge>
  }

  const getCategoryDisplay = (categoryName: string) => {
    // Find if this is a sub-category
    const flatCategory = flatCategories.find(cat => cat.name === categoryName || cat.name.includes(categoryName))
    if (flatCategory?.isSubCategory) {
      return (
        <div>
          <div className="font-medium">{categoryName}</div>
          <div className="text-xs text-gray-500">Sub-kategori</div>
        </div>
      )
    }
    return categoryName
  }

  const getSelectedTripsDisplay = () => {
    if (selectedTripIds.length === 0) return 'Belum ada trip dipilih'
    if (selectedTripIds.length === 1) {
      const trip = trips.find(t => t.id === selectedTripIds[0])
      return trip?.name || 'Trip tidak ditemukan'
    }
    return `${selectedTripIds.length} trip dipilih`
  }

  if (loading || categoriesLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manajemen Keuangan</h1>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manajemen Keuangan</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => setActiveTab('categories')}>
            <Settings className="h-4 w-4 mr-2" />
            Kelola Kategori
          </Button>
          <Button onClick={() => setShowAddForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Transaksi
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pemasukan
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summary.totalIncome)}
            </div>
            <p className="text-xs text-gray-500">
              Dari pembayaran dan DP
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pengeluaran
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summary.totalExpense)}
            </div>
            <p className="text-xs text-gray-500">
              Biaya operasional
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Saldo Bersih
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(summary.netBalance)}
            </div>
            <p className="text-xs text-gray-500">
              Keuntungan bersih
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Transaksi</TabsTrigger>
          <TabsTrigger value="trip-flow">Arus Keuangan per Trip</TabsTrigger>
          <TabsTrigger value="categories">Kelola Kategori</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-6">
          {/* Add Transaction Form */}
          {showAddForm && (
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="bg-blue-50">
                <CardTitle className="text-blue-800">Tambah Transaksi</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="transaction_date">Tanggal</Label>
                      <Input
                        id="transaction_date"
                        type="date"
                        value={formData.transaction_date}
                        onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transaction_type">Jenis Transaksi</Label>
                      <Select 
                        value={formData.transaction_type} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, transaction_type: value, category: '' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                          <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Select 
                        value={formData.category} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          {flatCategories
                            .filter(cat => cat.type === formData.transaction_type)
                            .map(category => (
                              <SelectItem key={category.id} value={category.name}>
                                <div className="flex items-center space-x-2">
                                  {category.isSubCategory && <span className="text-gray-400">└─</span>}
                                  <span>{category.isSubCategory ? category.name.split(' → ')[1] : category.name}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount">Jumlah</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="trip_id">Trip (Opsional)</Label>
                      <Select 
                        value={formData.trip_id || 'none'} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, trip_id: value === 'none' ? null : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih trip" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tidak terkait trip</SelectItem>
                          {trips.map(trip => (
                            <SelectItem key={trip.id} value={trip.id}>
                              {trip.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="destination_id">Destinasi (Opsional)</Label>
                      <Select 
                        value={formData.destination_id || 'none'} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, destination_id: value === 'none' ? null : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih destinasi" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tidak terkait destinasi</SelectItem>
                          {destinations.map(destination => (
                            <SelectItem key={destination.id} value={destination.id}>
                              {destination.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Keterangan</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Detail transaksi..."
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Menyimpan...' : 'Simpan Transaksi'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Transactions Table */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Riwayat Transaksi</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari transaksi..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                      <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Jenis</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Trip</TableHead>
                    <TableHead>Keterangan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatShortDate(transaction.transaction_date)}</TableCell>
                      <TableCell>{getTypeBadge(transaction.transaction_type)}</TableCell>
                      <TableCell>{getCategoryDisplay(transaction.category)}</TableCell>
                      <TableCell className={transaction.transaction_type === 'Pemasukan' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.transaction_type === 'Pemasukan' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>{transaction.trips?.name || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{transaction.description || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada transaksi yang ditemukan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trip-flow" className="space-y-6">
          {/* Trip Selection */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Pilih Trip untuk Analisis Keuangan</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={handleSelectAllTrips}>
                    Pilih Semua
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleDeselectAllTrips}>
                    Hapus Semua
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari trip..."
                    value={tripFlowSearchTerm}
                    onChange={(e) => setTripFlowSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {selectedTripIds.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">Trip Terpilih:</div>
                    <div className="text-sm text-blue-700">{getSelectedTripsDisplay()}</div>
                  </div>
                )}

                <div className="grid gap-3 max-h-64 overflow-y-auto">
                  {filteredTripsForFlow.map((trip) => (
                    <div key={trip.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                      <Checkbox
                        checked={selectedTripIds.includes(trip.id)}
                        onCheckedChange={(checked) => handleTripSelection(trip.id, checked as boolean)}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{trip.name}</div>
                        <div className="text-sm text-gray-500 flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatShortDate(trip.departure_date)}</span>
                          </div>
                          {trip.destinations && trip.destinations.length > 0 && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{trip.destinations.map(d => d.name).join(', ')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatCurrency(trip.price)}
                      </div>
                    </div>
                  ))}
                </div>

                {filteredTripsForFlow.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Tidak ada trip yang ditemukan</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Trip Financial Summary */}
          {selectedTripIds.length > 0 && (
            <>
              <div className="grid gap-6 md:grid-cols-3">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Pemasukan Trip
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(tripSummary.totalIncome)}
                    </div>
                    <p className="text-xs text-gray-500">
                      Dari {selectedTripIds.length} trip terpilih
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Pengeluaran Trip
                    </CardTitle>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(tripSummary.totalExpense)}
                    </div>
                    <p className="text-xs text-gray-500">
                      Biaya operasional trip
                    </p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Profit Trip
                    </CardTitle>
                    <Wallet className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${tripSummary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(tripSummary.netBalance)}
                    </div>
                    <p className="text-xs text-gray-500">
                      Keuntungan bersih trip
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Trip Transactions Table */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Transaksi Trip Terpilih</CardTitle>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Cari transaksi..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 w-64"
                        />
                      </div>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Semua</SelectItem>
                          <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                          <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {tripTransactionsLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-gray-500 mt-2">Memuat transaksi...</p>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Jenis</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Jumlah</TableHead>
                            <TableHead>Trip</TableHead>
                            <TableHead>Keterangan</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredTripTransactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell>{formatShortDate(transaction.transaction_date)}</TableCell>
                              <TableCell>{getTypeBadge(transaction.transaction_type)}</TableCell>
                              <TableCell>{getCategoryDisplay(transaction.category)}</TableCell>
                              <TableCell className={transaction.transaction_type === 'Pemasukan' ? 'text-green-600' : 'text-red-600'}>
                                {transaction.transaction_type === 'Pemasukan' ? '+' : '-'}{formatCurrency(transaction.amount)}
                              </TableCell>
                              <TableCell>{transaction.trips?.name || '-'}</TableCell>
                              <TableCell className="max-w-xs truncate">{transaction.description || '-'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      
                      {filteredTripTransactions.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Tidak ada transaksi untuk trip yang dipilih</p>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {selectedTripIds.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-30 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Pilih Trip untuk Melihat Arus Keuangan</h3>
                <p className="text-gray-600 mb-4">
                  Pilih satu atau beberapa trip di atas untuk melihat ringkasan pemasukan, pengeluaran, dan profit dari trip tersebut.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {/* Add Category Form */}
          {showCategoryForm && (
            <Card className="border-green-200 shadow-lg">
              <CardHeader className="bg-green-50">
                <CardTitle className="text-green-800">
                  {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleCategorySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="category_name">Nama Kategori</Label>
                      <Input
                        id="category_name"
                        value={categoryFormData.name}
                        onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Contoh: Transportasi Darat"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category_type">Jenis</Label>
                      <Select 
                        value={categoryFormData.type} 
                        onValueChange={(value: 'Pemasukan' | 'Pengeluaran') => setCategoryFormData(prev => ({ ...prev, type: value, parent_id: null }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                          <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="parent_category">Kategori Induk (Opsional)</Label>
                      <Select 
                        value={categoryFormData.parent_id || 'none'} 
                        onValueChange={(value) => setCategoryFormData(prev => ({ ...prev, parent_id: value === 'none' ? null : value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori induk" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Kategori Utama</SelectItem>
                          {categories
                            .filter(cat => cat.type === categoryFormData.type && !cat.parent_id)
                            .map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500">
                        Kosongkan jika ini adalah kategori utama, atau pilih kategori induk untuk membuat sub-kategori
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category_description">Deskripsi</Label>
                    <Textarea
                      id="category_description"
                      value={categoryFormData.description}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Deskripsi kategori (opsional)..."
                      rows={3}
                    />
                  </div>

                  <div className="flex space-x-2">
                    <Button type="submit" disabled={creatingCategory || updatingCategory}>
                      {creatingCategory || updatingCategory ? 'Menyimpan...' : editingCategory ? 'Update Kategori' : 'Simpan Kategori'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowCategoryForm(false)
                        setEditingCategory(null)
                        setCategoryFormData({
                          name: '',
                          type: 'Pemasukan',
                          parent_id: null,
                          description: ''
                        })
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Categories Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="h-5 w-5" />
                  <span>Kelola Kategori Transaksi</span>
                </CardTitle>
                <Button onClick={() => setShowCategoryForm(true)}>
                  <FolderPlus className="h-4 w-4 mr-2" />
                  Tambah Kategori
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {/* Pemasukan Categories */}
                <div>
                  <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Kategori Pemasukan</span>
                  </h3>
                  <div className="space-y-3">
                    {categories
                      .filter(cat => cat.type === 'Pemasukan')
                      .map((category) => (
                        <div key={category.id} className="border rounded-lg p-4 bg-green-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Tag className="h-4 w-4 text-green-600" />
                              <span className="font-medium text-green-800">{category.name}</span>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus kategori "{category.name}"? 
                                      Tindakan ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteCategory(category.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          {category.description && (
                            <p className="text-sm text-green-600 mb-2">{category.description}</p>
                          )}
                          {category.children && category.children.length > 0 && (
                            <div className="ml-4 space-y-2">
                              {category.children.map((child) => (
                                <div key={child.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-400">└─</span>
                                    <span className="text-sm">{child.name}</span>
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleEditCategory(child)}
                                    >
                                      <Edit className="h-2 w-2" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-2 w-2" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Hapus Sub-Kategori</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Apakah Anda yakin ingin menghapus sub-kategori "{child.name}"?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Batal</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteCategory(child.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Hapus
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Pengeluaran Categories */}
                <div>
                  <h3 className="text-lg font-semibold text-red-700 mb-4 flex items-center space-x-2">
                    <TrendingDown className="h-5 w-5" />
                    <span>Kategori Pengeluaran</span>
                  </h3>
                  <div className="space-y-3">
                    {categories
                      .filter(cat => cat.type === 'Pengeluaran')
                      .map((category) => (
                        <div key={category.id} className="border rounded-lg p-4 bg-red-50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <Tag className="h-4 w-4 text-red-600" />
                              <span className="font-medium text-red-800">{category.name}</span>
                            </div>
                            <div className="flex space-x-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditCategory(category)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Apakah Anda yakin ingin menghapus kategori "{category.name}"? 
                                      Tindakan ini tidak dapat dibatalkan.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Batal</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteCategory(category.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Hapus
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          {category.description && (
                            <p className="text-sm text-red-600 mb-2">{category.description}</p>
                          )}
                          {category.children && category.children.length > 0 && (
                            <div className="ml-4 space-y-2">
                              {category.children.map((child) => (
                                <div key={child.id} className="flex items-center justify-between p-2 bg-white rounded border">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-gray-400">└─</span>
                                    <span className="text-sm">{child.name}</span>
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-6 w-6 p-0"
                                      onClick={() => handleEditCategory(child)}
                                    >
                                      <Edit className="h-2 w-2" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-2 w-2" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Hapus Sub-Kategori</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Apakah Anda yakin ingin menghapus sub-kategori "{child.name}"?
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Batal</AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() => handleDeleteCategory(child.id)}
                                            className="bg-red-600 hover:bg-red-700"
                                          >
                                            Hapus
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              {categories.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Tag className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">Belum ada kategori</h3>
                  <p className="text-sm mb-4">
                    Mulai dengan menambahkan kategori transaksi pertama Anda
                  </p>
                  <Button onClick={() => setShowCategoryForm(true)}>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    Tambah Kategori
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}