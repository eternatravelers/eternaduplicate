import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Navigation, MapPin } from 'lucide-react'
import { ProofOfTransferUploader } from './ProofOfTransferUploader'
import { formatShortDate } from '@/lib/utils'

interface ParticipantFormProps {
  initialData?: any
  onSubmit: (data: any, file?: File | null) => Promise<void>
  onCancel: () => void
  trips: any[]
  sales: any[]
  creating: boolean
  updating: boolean
  editingParticipant: string | null
}

export function ParticipantForm({
  initialData,
  onSubmit,
  onCancel,
  trips,
  sales,
  creating,
  updating,
  editingParticipant
}: ParticipantFormProps) {
  const [formData, setFormData] = useState({
    trip_id: '',
    sales_id: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    participant_count: '' as number | '',
    package_price: '' as number | '',
    dp_amount: '' as number | '',
    dp_transfer_date: '',
    additional_requests: '',
    meeting_point_details: ''
  })

  const [proofOfTransferUrl, setProofOfTransferUrl] = useState<string | null>(null)
  const [selectedTripMeetingPoint, setSelectedTripMeetingPoint] = useState<string>('')

  useEffect(() => {
    if (initialData) {
      setFormData(initialData)
      setProofOfTransferUrl(initialData.proof_of_transfer_url || null)
    }
  }, [initialData])

  useEffect(() => {
    if (formData.trip_id) {
      const selectedTrip = trips.find(trip => trip.id === formData.trip_id)
      if (selectedTrip) {
        setSelectedTripMeetingPoint(selectedTrip.meeting_point)
        if (!editingParticipant) {
          setFormData(prev => ({ 
            ...prev, 
            meeting_point_details: selectedTrip.meeting_point 
          }))
        }
      }
    }
  }, [formData.trip_id, trips, editingParticipant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      participant_count: formData.participant_count === '' ? 1 : Number(formData.participant_count),
      package_price: formData.package_price === '' ? 0 : Number(formData.package_price),
      dp_amount: formData.dp_amount === '' ? 0 : Number(formData.dp_amount),
      dp_transfer_date: formData.dp_transfer_date || new Date().toISOString().split('T')[0],
      proof_of_transfer_url: proofOfTransferUrl
    }

    await onSubmit(submitData, null)
  }

  const handleUrlChange = (url: string | null) => {
    setProofOfTransferUrl(url)
  }

  return (
    <Card className="border-blue-200 shadow-lg">
      <CardHeader className="bg-blue-50">
        <CardTitle className="text-blue-800">
          {editingParticipant ? 'Edit Peserta' : 'Tambah Peserta Baru'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="trip_id">Trip</Label>
              <Select 
                value={formData.trip_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, trip_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih trip" />
                </SelectTrigger>
                <SelectContent>
                  {trips.map(trip => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.name} - {formatShortDate(trip.departure_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sales_id">Sales</Label>
              <Select 
                value={formData.sales_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, sales_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sales" />
                </SelectTrigger>
                <SelectContent>
                  {sales.map(sale => (
                    <SelectItem key={sale.id} value={sale.id}>
                      {sale.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participant_count">Jumlah Peserta</Label>
              <Input
                id="participant_count"
                type="number"
                min="1"
                value={formData.participant_count}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value)
                  setFormData(prev => ({ ...prev, participant_count: isNaN(val) ? '' : val }))
                }}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="package_price">Harga Paket</Label>
              <Input
                id="package_price"
                type="number"
                value={formData.package_price}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                  setFormData(prev => ({ ...prev, package_price: isNaN(val) ? '' : val }))
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dp_amount">Jumlah DP</Label>
              <Input
                id="dp_amount"
                type="number"
                value={formData.dp_amount}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                  setFormData(prev => ({ ...prev, dp_amount: isNaN(val) ? '' : val }))
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dp_transfer_date">Tanggal Transfer DP</Label>
              <Input
                id="dp_transfer_date"
                type="date"
                value={formData.dp_transfer_date}
                onChange={(e) => setFormData(prev => ({ ...prev, dp_transfer_date: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Alamat</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
              required
            />
          </div>

          {/* Meeting Point Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-green-50">
            <Label className="text-base font-semibold flex items-center space-x-2">
              <Navigation className="h-5 w-5" />
              <span>Titik Kumpul Peserta</span>
            </Label>
            
            {selectedTripMeetingPoint && (
              <div className="p-3 bg-white border rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">Titik Kumpul Default Trip:</div>
                <div className="text-sm text-gray-600 flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedTripMeetingPoint}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="meeting_point_details">
                Titik Kumpul Khusus (Opsional)
              </Label>
              <Textarea
                id="meeting_point_details"
                value={formData.meeting_point_details}
                onChange={(e) => setFormData(prev => ({ ...prev, meeting_point_details: e.target.value }))}
                placeholder="Kosongkan jika menggunakan titik kumpul default trip, atau isi dengan lokasi khusus..."
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Jika diisi, peserta akan menggunakan titik kumpul khusus ini. Jika kosong, akan menggunakan titik kumpul default dari trip.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additional_requests">Permintaan Tambahan</Label>
            <Textarea
              id="additional_requests"
              value={formData.additional_requests}
              onChange={(e) => setFormData(prev => ({ ...prev, additional_requests: e.target.value }))}
              placeholder="Makanan khusus, kebutuhan medis, dll..."
            />
          </div>

          <ProofOfTransferUploader
            url={proofOfTransferUrl}
            onUrlChange={handleUrlChange}
          />

          <div className="flex space-x-3 pt-4 border-t">
            <Button type="submit" disabled={creating || updating}>
              {creating || updating ? 'Menyimpan...' : editingParticipant ? 'Update Peserta' : 'Simpan Peserta'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}