import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserCheck } from 'lucide-react'

interface DriverFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  creating: boolean
  updating: boolean
  editingDriver: string | null
}

export function DriverForm({
  initialData,
  onSubmit,
  onCancel,
  creating,
  updating,
  editingDriver
}: DriverFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
    status: 'active'
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        phone: initialData.phone || '',
        license_number: initialData.license_number || '',
        status: initialData.status || 'active'
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
    <Card className="border-green-200 shadow-lg">
      <CardHeader className="bg-green-50">
        <CardTitle className="flex items-center space-x-2 text-green-800">
          <UserCheck className="h-5 w-5" />
          <span>{editingDriver ? 'Edit Driver' : 'Tambah Driver Baru'}</span>
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
                placeholder="Contoh: Ahmad Supardi"
                required
                className="focus:ring-green-500 focus:border-green-500"
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
                className="focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_number" className="text-sm font-medium">
                Nomor SIM
              </Label>
              <Input
                id="license_number"
                value={formData.license_number}
                onChange={(e) => setFormData(prev => ({ ...prev, license_number: e.target.value }))}
                placeholder="Contoh: 1234567890123456"
                className="focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status" className="text-sm font-medium">
                Status
              </Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="focus:ring-green-500 focus:border-green-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="on_leave">Cuti</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={creating || updating}
              className="bg-green-600 hover:bg-green-700"
            >
              {creating || updating ? 'Menyimpan...' : editingDriver ? 'Update Driver' : 'Simpan Driver'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="border-gray-300"
            >
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}