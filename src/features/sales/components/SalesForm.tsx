import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users } from 'lucide-react'

interface SalesFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  creating: boolean
  updating: boolean
  editingSales: string | null
}

export function SalesForm({
  initialData,
  onSubmit,
  onCancel,
  creating,
  updating,
  editingSales
}: SalesFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        email: initialData.email || '',
        phone: initialData.phone || ''
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  return (
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