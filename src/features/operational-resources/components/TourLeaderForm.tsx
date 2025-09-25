import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { UserCheck } from 'lucide-react'

interface TourLeaderFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  creating: boolean
  updating: boolean
  editingTourLeader: string | null
}

export function TourLeaderForm({
  initialData,
  onSubmit,
  onCancel,
  creating,
  updating,
  editingTourLeader
}: TourLeaderFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    certification: '',
    specialization: '',
    experience_years: '' as number | '',
    bio: '',
    status: 'active'
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        certification: initialData.certification || '',
        specialization: initialData.specialization || '',
        experience_years: initialData.experience_years || '',
        bio: initialData.bio || '',
        status: initialData.status || 'active'
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      experience_years: formData.experience_years === '' ? 0 : Number(formData.experience_years)
    }

    await onSubmit(submitData)
  }

  return (
    <Card className="border-purple-200 shadow-lg">
      <CardHeader className="bg-purple-50">
        <CardTitle className="flex items-center space-x-2 text-purple-800">
          <UserCheck className="h-5 w-5" />
          <span>{editingTourLeader ? 'Edit Tour Leader' : 'Tambah Tour Leader Baru'}</span>
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
                className="focus:ring-purple-500 focus:border-purple-500"
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
                placeholder="ahmad@example.com"
                className="focus:ring-purple-500 focus:border-purple-500"
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
                className="focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="certification" className="text-sm font-medium">
                Sertifikasi
              </Label>
              <Input
                id="certification"
                value={formData.certification}
                onChange={(e) => setFormData(prev => ({ ...prev, certification: e.target.value }))}
                placeholder="Contoh: Certified Tour Guide"
                className="focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="specialization" className="text-sm font-medium">
                Spesialisasi
              </Label>
              <Input
                id="specialization"
                value={formData.specialization}
                onChange={(e) => setFormData(prev => ({ ...prev, specialization: e.target.value }))}
                placeholder="Contoh: Adventure Tourism, Cultural Tours"
                className="focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience_years" className="text-sm font-medium">
                Pengalaman (Tahun)
              </Label>
              <Input
                id="experience_years"
                type="number"
                min="0"
                value={formData.experience_years}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value)
                  setFormData(prev => ({ ...prev, experience_years: isNaN(val) ? '' : val }))
                }}
                placeholder="Contoh: 5"
                className="focus:ring-purple-500 focus:border-purple-500"
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
                <SelectTrigger className="focus:ring-purple-500 focus:border-purple-500">
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

          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-medium">
              Bio/Deskripsi
            </Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Ceritakan tentang pengalaman dan keahlian tour leader..."
              rows={4}
              className="focus:ring-purple-500 focus:border-purple-500"
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={creating || updating}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {creating || updating ? 'Menyimpan...' : editingTourLeader ? 'Update Tour Leader' : 'Simpan Tour Leader'}
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