import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Bus } from 'lucide-react'

interface BusFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  creating: boolean
  updating: boolean
  editingBus: string | null
}

export function BusForm({
  initialData,
  onSubmit,
  onCancel,
  creating,
  updating,
  editingBus
}: BusFormProps) {
  const [formData, setFormData] = useState({
    plate_number: '',
    model: '',
    capacity: '' as number | '',
    status: 'active'
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        plate_number: initialData.plate_number || '',
        model: initialData.model || '',
        capacity: initialData.capacity || '',
        status: initialData.status || 'active'
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      capacity: formData.capacity === '' ? null : Number(formData.capacity)
    }

    await onSubmit(submitData)
  }

  return (
    <Card className="border-blue-200 shadow-lg">
      <CardHeader className="bg-blue-50">
        <CardTitle className="flex items-center space-x-2 text-blue-800">
          <Bus className="h-5 w-5" />
          <span>{editingBus ? 'Edit Bus' : 'Tambah Bus Baru'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="plate_number" className="text-sm font-medium">
                Nomor Plat <span className="text-red-500">*</span>
              </Label>
              <Input
                id="plate_number"
                value={formData.plate_number}
                onChange={(e) => setFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                placeholder="Contoh: B 1234 ABC"
                required
                className="focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model" className="text-sm font-medium">
                Model/Tipe Bus
              </Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
                placeholder="Contoh: Mercedes-Benz OH 1526"
                className="focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity" className="text-sm font-medium">
                Kapasitas Penumpang
              </Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={formData.capacity}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value)
                  setFormData(prev => ({ ...prev, capacity: isNaN(val) ? '' : val }))
                }}
                placeholder="Contoh: 45"
                className="focus:ring-blue-500 focus:border-blue-500"
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
                <SelectTrigger className="focus:ring-blue-500 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="inactive">Tidak Aktif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={creating || updating}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creating || updating ? 'Menyimpan...' : editingBus ? 'Update Bus' : 'Simpan Bus'}
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