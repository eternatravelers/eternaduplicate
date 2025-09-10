import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Edit, Trash2, Calculator, Search, DollarSign, Users, Target, X, Copy } from 'lucide-react'
import { useCostPlans, useCreateCostPlan, useUpdateCostPlan, useDeleteCostPlan } from '@/hooks/useCostPlans'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface CostCategory {
  name: string
  amount: number
  notes: string
}

export function CostPlans() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCostPlan, setEditingCostPlan] = useState<string | null>(null)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const { costPlans, loading, refetch } = useCostPlans()
  const { createCostPlan, loading: creating } = useCreateCostPlan()
  const { updateCostPlan, loading: updating } = useUpdateCostPlan()
  const { deleteCostPlan, loading: deleting } = useDeleteCostPlan()
  const { isSuperAdmin } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    estimated_participants: '',
    categories: [] as CostCategory[]
  })

  const [newCategory, setNewCategory] = useState({
    name: '',
    amount: 0,
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data, error } = editingCostPlan 
      ? await updateCostPlan(editingCostPlan, formData)
      : await createCostPlan(formData)

    if (!error) {
      setShowAddForm(false)
      setEditingCostPlan(null)
      setIsDuplicating(false)
      resetForm()
      refetch()
    }
  }

  const handleEdit = (costPlan: any) => {
    setFormData({
      name: costPlan.name,
      estimated_participants: costPlan.estimated_participants || '',
      categories: Array.isArray(costPlan.categories) ? costPlan.categories : []
    })
    setEditingCostPlan(costPlan.id)
    setIsDuplicating(false)
    setShowAddForm(true)
  }

  const handleDuplicate = (costPlan: any) => {
    setFormData({
      name: `${costPlan.name} (Copy)`,
      estimated_participants: costPlan.estimated_participants || '',
      categories: Array.isArray(costPlan.categories) ? costPlan.categories : []
    })
    setEditingCostPlan(null)
    setIsDuplicating(true)
    setShowAddForm(true)
  }
  const handleDelete = async (id: string) => {
    const { error } = await deleteCostPlan(id)
    if (!error) {
      refetch()
    }
  }

  const addCategory = () => {
    if (newCategory.name.trim()) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, { ...newCategory }]
      }))
      setNewCategory({ name: '', amount: 0, notes: '' })
    }
  }

  const removeCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }))
  }

  const updateCategory = (index: number, field: keyof CostCategory, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) => 
        i === index ? { ...cat, [field]: value } : cat
      )
    }))
  }

  const resetForm = () => {
    setFormData({
      name: '',
      estimated_participants: '',
      categories: []
    })
    setNewCategory({ name: '', amount: 0, notes: '' })
  }

  const handleAddNew = () => {
    setEditingCostPlan(null)
    setIsDuplicating(false)
    resetForm()
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingCostPlan(null)
    setIsDuplicating(false)
    resetForm()
  }

  const filteredCostPlans = costPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalCost = formData.categories.reduce((sum, cat) => sum + (cat.amount || 0), 0)
  const estimatedParticipants = typeof formData.estimated_participants === 'string' && formData.estimated_participants === '' ? 1 : Number(formData.estimated_participants) || 1
  const costPerPerson = estimatedParticipants > 0 ? totalCost / estimatedParticipants : 0

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Rencana Biaya</h1>
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
          <h1 className="text-3xl font-bold">Rencana Biaya</h1>
          <p className="text-gray-600 mt-2">Kelola template biaya untuk trip Anda</p>
        </div>
        <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Rencana Biaya
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Template
            </CardTitle>
            <Calculator className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costPlans.length}</div>
            <p className="text-xs text-gray-500">
              Template biaya tersedia
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rata-rata Biaya
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costPlans.length > 0 
                ? formatCurrency(costPlans.reduce((sum, plan) => sum + (plan.total_cost || 0), 0) / costPlans.length)
                : formatCurrency(0)
              }
            </div>
            <p className="text-xs text-gray-500">
              Per template
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rata-rata per Orang
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costPlans.length > 0 
                ? formatCurrency(costPlans.reduce((sum, plan) => sum + (plan.cost_per_person || 0), 0) / costPlans.length)
                : formatCurrency(0)
              }
            </div>
            <p className="text-xs text-gray-500">
              Biaya per peserta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add/Edit Cost Plan Form */}
      {showAddForm && (
        <Card className="border-green-200 shadow-lg">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center space-x-2 text-green-800">
              <Calculator className="h-5 w-5" />
              <span>
                {isDuplicating 
                  ? 'Duplikat Rencana Biaya' 
                  : editingCostPlan 
                    ? 'Edit Rencana Biaya' 
                    : 'Tambah Rencana Biaya Baru'
                }
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {isDuplicating && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Menduplikat template biaya.</strong> Anda dapat mengubah nama dan detail lainnya sebelum menyimpan.
                </p>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nama Template <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Paket Wisata Bali 3D2N"
                    required
                    className="focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimated_participants" className="text-sm font-medium">
                    Estimasi Peserta <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="estimated_participants"
                    type="number"
                    min="1"
                    value={formData.estimated_participants}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value)
                      setFormData(prev => ({ ...prev, estimated_participants: isNaN(val) ? '' : val }))
                    }}
                    className="focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>

              {/* Categories Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <Label className="text-base font-semibold flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Kategori Biaya</span>
                </Label>

                {/* Add New Category */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-white border rounded-lg">
                  <Input
                    placeholder="Nama kategori"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    type="number"
                    placeholder="Jumlah"
                    value={newCategory.amount}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  />
                  <Input
                    placeholder="Catatan (opsional)"
                    value={newCategory.notes}
                    onChange={(e) => setNewCategory(prev => ({ ...prev, notes: e.target.value }))}
                  />
                  <Button type="button" onClick={addCategory} size="sm">
                    <Plus className="h-3 w-3 mr-1" />
                    Tambah
                  </Button>
                </div>

                {/* Categories List */}
                {formData.categories.length > 0 && (
                  <div className="space-y-2">
                    {formData.categories.map((category, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-white border rounded-lg">
                        <Input
                          value={category.name}
                          onChange={(e) => updateCategory(index, 'name', e.target.value)}
                          placeholder="Nama kategori"
                        />
                        <Input
                          type="number"
                          value={category.amount}
                          onChange={(e) => updateCategory(index, 'amount', parseFloat(e.target.value) || 0)}
                          placeholder="Jumlah"
                        />
                        <Input
                          value={category.notes}
                          onChange={(e) => updateCategory(index, 'notes', e.target.value)}
                          placeholder="Catatan"
                        />
                        <Button 
                          type="button" 
                          variant="destructive" 
                          size="sm"
                          onClick={() => removeCategory(index)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Hapus
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Summary */}
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-3 text-blue-800">Ringkasan Biaya</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-600">Total Biaya</div>
                    <div className="text-xl font-bold text-green-600">{formatCurrency(totalCost)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Biaya per Orang</div>
                    <div className="text-xl font-bold text-blue-600">{formatCurrency(costPerPerson)}</div>
                  </div>
                  <div>
                    <div className="text-gray-600">Estimasi Peserta</div>
                    <div className="text-xl font-bold text-purple-600">{estimatedParticipants} orang</div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <Button 
                  type="submit" 
                  disabled={creating || updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {creating || updating 
                    ? 'Menyimpan...' 
                    : isDuplicating 
                      ? 'Duplikat Template' 
                      : editingCostPlan 
                        ? 'Update Template' 
                        : 'Simpan Template'
                  }
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

      {/* Cost Plans List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="h-5 w-5 text-green-600" />
              <span>Daftar Template Biaya</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCostPlans.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calculator className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'Template tidak ditemukan' : 'Belum ada template biaya'}
              </h3>
              <p className="text-sm mb-4">
                {searchTerm 
                  ? 'Coba gunakan kata kunci yang berbeda'
                  : 'Mulai dengan membuat template biaya pertama Anda'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={handleAddNew}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Template
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Template</TableHead>
                  <TableHead>Estimasi Peserta</TableHead>
                  <TableHead>Total Biaya</TableHead>
                  <TableHead>Biaya per Orang</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Dibuat</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCostPlans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell>
                      <div className="font-medium text-gray-900">{plan.name}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-3 w-3" />
                        <span>{plan.estimated_participants} orang</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-green-600">
                        {formatCurrency(plan.total_cost || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-semibold text-blue-600">
                        {formatCurrency(plan.cost_per_person || 0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {Array.isArray(plan.categories) ? plan.categories.length : 0} kategori
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {formatShortDate(plan.created_at)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(plan)}
                          title="Edit Template"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                          onClick={() => handleDuplicate(plan)}
                          title="Duplikat Template"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        {isSuperAdmin && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Hapus Template Biaya</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus template "{plan.name}"? 
                                  Tindakan ini tidak dapat dibatalkan.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDelete(plan.id)}
                                  disabled={deleting}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  {deleting ? 'Menghapus...' : 'Hapus'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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