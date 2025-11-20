import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { MapPin, Plus, Search, Edit, Trash2, Navigation } from 'lucide-react'
import { useMeetingPoints, useCreateMeetingPoint, useUpdateMeetingPoint, useDeleteMeetingPoint } from '@/hooks/useMeetingPoints'
import { useAuth } from '@/hooks/useAuth'

export function MasterMeetingPointsPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPoint, setEditingPoint] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  const { meetingPoints, loading, refetch } = useMeetingPoints()
  const { createMeetingPoint, loading: creating } = useCreateMeetingPoint()
  const { updateMeetingPoint, loading: updating } = useUpdateMeetingPoint()
  const { deleteMeetingPoint, loading: deleting } = useDeleteMeetingPoint()
  const { isSuperAdmin } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    display_order: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { data, error } = editingPoint
      ? await updateMeetingPoint(editingPoint, formData)
      : await createMeetingPoint(formData)

    if (!error) {
      setShowAddForm(false)
      setEditingPoint(null)
      setFormData({
        name: '',
        description: '',
        address: '',
        display_order: 0
      })
      refetch()
    }
  }

  const handleEdit = (point: any) => {
    setFormData({
      name: point.name,
      description: point.description || '',
      address: point.address || '',
      display_order: point.display_order || 0
    })
    setEditingPoint(point.id)
    setShowAddForm(true)
  }

  const handleAddNew = () => {
    setEditingPoint(null)
    setFormData({
      name: '',
      description: '',
      address: '',
      display_order: meetingPoints.length
    })
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingPoint(null)
    setFormData({
      name: '',
      description: '',
      address: '',
      display_order: 0
    })
  }

  const handleDelete = async (id: string) => {
    try {
      const { error } = await deleteMeetingPoint(id)
      if (!error) {
        refetch()
      }
    } catch (error) {
      console.error('Error deleting meeting point:', error)
    }
  }

  const filteredPoints = meetingPoints.filter(point =>
    point.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    point.address?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Master Meeting Points</h1>
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
          <h1 className="text-3xl font-bold">Master Meeting Points</h1>
          <p className="text-gray-600 mt-2">Kelola titik kumpul untuk semua trip Anda</p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Meeting Point
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Meeting Points
            </CardTitle>
            <Navigation className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meetingPoints.length}</div>
            <p className="text-xs text-gray-500">
              Titik kumpul tersedia
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Meeting Points Aktif
            </CardTitle>
            <MapPin className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetingPoints.filter(mp => mp.is_active).length}
            </div>
            <p className="text-xs text-gray-500">
              Siap digunakan
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tersedia untuk Trip
            </CardTitle>
            <Navigation className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {meetingPoints.filter(mp => mp.is_active).length}
            </div>
            <p className="text-xs text-gray-500">
              Dapat di-assign
            </p>
          </CardContent>
        </Card>
      </div>

      {showAddForm && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Navigation className="h-5 w-5" />
              <span>{editingPoint ? 'Edit Meeting Point' : 'Tambah Meeting Point Baru'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nama Meeting Point <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Parkir Timur Senayan"
                    required
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="display_order" className="text-sm font-medium">
                    Urutan Tampilan
                  </Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm font-medium">
                  Alamat Lengkap
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Contoh: Jl. Asia Afrika, Gelora, Tanah Abang, Jakarta Pusat"
                  className="focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Deskripsi & Petunjuk
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tambahkan deskripsi dan petunjuk untuk mencapai titik kumpul ini..."
                  rows={4}
                  className="focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <Button
                  type="submit"
                  disabled={creating || updating}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {creating || updating ? 'Menyimpan...' : editingPoint ? 'Update Meeting Point' : 'Simpan Meeting Point'}
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

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Navigation className="h-5 w-5 text-blue-600" />
              <span>Daftar Meeting Points</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari meeting point..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPoints.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Navigation className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'Meeting point tidak ditemukan' : 'Belum ada meeting point'}
              </h3>
              <p className="text-sm mb-4">
                {searchTerm
                  ? 'Coba gunakan kata kunci yang berbeda'
                  : 'Mulai dengan menambahkan meeting point pertama Anda'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleAddNew}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Meeting Point
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredPoints.map((point) => (
                <Card key={point.id} className="hover:shadow-md transition-shadow border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                          {point.name}
                        </CardTitle>
                        {point.address && (
                          <div className="flex items-start text-sm text-gray-600 mt-1">
                            <MapPin className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{point.address}</span>
                          </div>
                        )}
                      </div>
                      <Badge
                        variant="outline"
                        className={point.is_active ? "text-green-600 border-green-200" : "text-gray-600 border-gray-200"}
                      >
                        {point.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {point.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {point.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Urutan: {point.display_order}</span>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(point)}
                        >
                          <Edit className="h-3 w-3" />
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
                                <AlertDialogTitle>Hapus Meeting Point</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Apakah Anda yakin ingin menghapus meeting point "{point.name}"?
                                  Meeting point ini akan di-nonaktifkan dan tidak dapat dipilih untuk trip baru.
                                  Trip yang sudah menggunakan meeting point ini tidak akan terpengaruh.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Batal</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(point.id)}
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
