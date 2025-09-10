import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MapPin, Plus, Search, Edit, Trash2, Globe } from 'lucide-react'
import { useDestinations, useCreateDestination, useUpdateDestination } from '@/hooks/useDestinations'
import { formatShortDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export function Destinations() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDestination, setEditingDestination] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  
  const { destinations, loading, refetch } = useDestinations()
  const { createDestination, loading: creating } = useCreateDestination()
  const { updateDestination, loading: updating } = useUpdateDestination()
  const { isSuperAdmin } = useAuth()

  const [formData, setFormData] = useState({
    name: '',
    location: '',
    description: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data, error } = editingDestination
      ? await updateDestination(editingDestination, formData)
      : await createDestination(formData)

    if (!error) {
      setShowAddForm(false)
      setEditingDestination(null)
      setFormData({
        name: '',
        location: '',
        description: ''
      })
      refetch()
    }
  }

  const handleEdit = (destination: any) => {
    setFormData({
      name: destination.name,
      location: destination.location || '',
      description: destination.description || ''
    })
    setEditingDestination(destination.id)
    setShowAddForm(true)
  }

  const handleAddNew = () => {
    setEditingDestination(null)
    setFormData({
      name: '',
      location: '',
      description: ''
    })
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingDestination(null)
    setFormData({
      name: '',
      location: '',
      description: ''
    })
  }

  const filteredDestinations = destinations.filter(destination =>
    destination.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    destination.location?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manajemen Destinasi</h1>
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
          <h1 className="text-3xl font-bold">Manajemen Destinasi</h1>
          <p className="text-gray-600 mt-2">Kelola destinasi wisata untuk trip Anda</p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Destinasi
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Destinasi
            </CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{destinations.length}</div>
            <p className="text-xs text-gray-500">
              Destinasi tersedia
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Destinasi Aktif
            </CardTitle>
            <Globe className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{destinations.length}</div>
            <p className="text-xs text-gray-500">
              Siap untuk trip
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Terbaru Ditambah
            </CardTitle>
            <Plus className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {destinations.length > 0 ? formatShortDate(destinations[0]?.created_at) : '-'}
            </div>
            <p className="text-xs text-gray-500">
              Destinasi terakhir
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Add Destination Form */}
      {showAddForm && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <MapPin className="h-5 w-5" />
              <span>{editingDestination ? 'Edit Destinasi' : 'Tambah Destinasi Baru'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nama Destinasi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Pantai Kuta Bali"
                    required
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Lokasi
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Contoh: Badung, Bali"
                    className="focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium">
                  Deskripsi Destinasi
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Deskripsikan keunikan dan daya tarik destinasi ini..."
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
                  {creating || updating ? 'Menyimpan...' : editingDestination ? 'Update Destinasi' : 'Simpan Destinasi'}
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

      {/* Destinations List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5 text-blue-600" />
              <span>Daftar Destinasi</span>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari destinasi..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredDestinations.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm ? 'Destinasi tidak ditemukan' : 'Belum ada destinasi'}
              </h3>
              <p className="text-sm mb-4">
                {searchTerm 
                  ? 'Coba gunakan kata kunci yang berbeda'
                  : 'Mulai dengan menambahkan destinasi pertama Anda'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={handleAddNew}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Destinasi
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDestinations.map((destination) => (
                <Card key={destination.id} className="hover:shadow-md transition-shadow border-gray-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 mb-1">
                          {destination.name}
                        </CardTitle>
                        {destination.location && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mr-1" />
                            {destination.location}
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Aktif
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {destination.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {destination.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Dibuat: {formatShortDate(destination.created_at)}</span>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(destination)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {isSuperAdmin && (
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                            <Trash2 className="h-3 w-3" />
                          </Button>
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