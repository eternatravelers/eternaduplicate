import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Navigation, MapPin, AlertCircle, Star } from 'lucide-react'
import { ProofOfTransferUploader } from './ProofOfTransferUploader'
import { formatShortDate } from '@/lib/utils'
import { useMeetingPointsForTrip } from '@/hooks/useMeetingPoints'
import { Alert, AlertDescription } from '@/components/ui/alert'

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
    id_card_number: '',
    address: '',
    participant_count: '' as number | '',
    package_price: '' as number | '',
    dp_amount: '' as number | '',
    dp_transfer_date: '',
    additional_requests: '',
    meeting_point_details: '',
    status: 'pending'
  })

  const [proofOfTransferUrl, setProofOfTransferUrl] = useState<string | null>(null)
  const [selectedTripMeetingPoint, setSelectedTripMeetingPoint] = useState<string>('')
  const [quotaWarning, setQuotaWarning] = useState<string | null>(null)
  const { meetingPoints: tripMeetingPoints, loading: loadingMeetingPoints } = useMeetingPointsForTrip(formData.trip_id || null)

  const selectedTrip = trips.find(t => t.id === formData.trip_id)

  useEffect(() => {
    if (initialData) {
      setFormData({
        trip_id: initialData.trip_id || '',
        sales_id: initialData.sales_id || '',
        full_name: initialData.full_name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        id_card_number: initialData.id_card_number || '',
        address: initialData.address || '',
        participant_count: initialData.participant_count || '',
        package_price: initialData.package_price || '',
        dp_amount: initialData.dp_amount || '',
        dp_transfer_date: initialData.dp_transfer_date || '',
        additional_requests: initialData.additional_requests || '',
        meeting_point_details: initialData.meeting_point_details || '',
        status: initialData.status || 'pending'
      })
      setProofOfTransferUrl(initialData.proof_of_transfer_url || null)
    } else {
      setFormData({
        trip_id: '',
        sales_id: '',
        full_name: '',
        email: '',
        phone: '',
        id_card_number: '',
        address: '',
        participant_count: '' as number | '',
        package_price: '' as number | '',
        dp_amount: '' as number | '',
        dp_transfer_date: '',
        additional_requests: '',
        meeting_point_details: '',
        status: 'pending'
      })
      setProofOfTransferUrl(null)
      setSelectedTripMeetingPoint('')
    }
  }, [initialData])

  useEffect(() => {
    if (formData.trip_id && tripMeetingPoints.length > 0 && !editingParticipant) {
      const primaryMeetingPoint = tripMeetingPoints.find((mp: any) => mp.is_primary)
      const meetingPointToUse = primaryMeetingPoint || tripMeetingPoints[0]
      if (meetingPointToUse) {
        setFormData(prev => ({
          ...prev,
          meeting_point_details: meetingPointToUse.name
        }))
      }
    }
  }, [formData.trip_id, tripMeetingPoints, editingParticipant])

  useEffect(() => {
    if (selectedTrip && !editingParticipant) {
      setQuotaWarning(null)

      if (selectedTrip.status === 'cancelled') {
        setQuotaWarning('Trip ini telah dibatalkan dan tidak menerima pendaftaran.')
      } else if (selectedTrip.status === 'completed') {
        setQuotaWarning('Trip ini sudah selesai dan tidak menerima pendaftaran.')
      } else if (selectedTrip.status === 'draft') {
        setQuotaWarning('Trip ini masih dalam status draft. Pendaftaran akan aktif setelah trip dibuka.')
      } else if (selectedTrip.status === 'open' && !selectedTrip.can_accept_registrations) {
        setQuotaWarning('Pendaftaran untuk trip ini sudah ditutup (kuota penuh).')
      } else if (selectedTrip.available_quota !== null && selectedTrip.available_quota !== undefined && selectedTrip.available_quota <= 5 && selectedTrip.available_quota > 0) {
        setQuotaWarning(`Hanya tersisa ${selectedTrip.available_quota} orang untuk trip ini!`)
      }
    }
  }, [formData.trip_id, selectedTrip, editingParticipant])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      sales_id: formData.sales_id === '' ? null : formData.sales_id,
      trip_id: formData.trip_id === '' ? null : formData.trip_id,
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
          {quotaWarning && (
            <Alert className={selectedTrip?.status === 'cancelled' || selectedTrip?.status === 'completed' || (selectedTrip?.status === 'open' && !selectedTrip?.can_accept_registrations) ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}>
              <AlertCircle className={selectedTrip?.status === 'cancelled' || selectedTrip?.status === 'completed' || (selectedTrip?.status === 'open' && !selectedTrip?.can_accept_registrations) ? 'h-4 w-4 text-red-600' : 'h-4 w-4 text-orange-600'} />
              <AlertDescription className={selectedTrip?.status === 'cancelled' || selectedTrip?.status === 'completed' || (selectedTrip?.status === 'open' && !selectedTrip?.can_accept_registrations) ? 'text-red-900' : 'text-orange-900'}>
                {quotaWarning}
              </AlertDescription>
            </Alert>
          )}

          {selectedTrip && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">Info Trip:</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  selectedTrip.status === 'open' ? 'bg-green-100 text-green-800' :
                  selectedTrip.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                  selectedTrip.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {selectedTrip.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-blue-700">Terdaftar:</span>
                  <span className="ml-2 font-semibold text-blue-900">
                    {((selectedTrip.confirmed_participant_count || 0) + (selectedTrip.pending_participant_count || 0))} dari {selectedTrip.quota || '-'} orang
                  </span>
                </div>
                {selectedTrip.available_quota !== null && selectedTrip.available_quota !== undefined && (
                  <div>
                    <span className="text-blue-700">Sisa Kuota:</span>
                    <span className="ml-2 font-semibold text-blue-900">
                      {selectedTrip.available_quota} orang
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-green-700">Confirmed:</span>
                  <span className="ml-2 font-semibold text-green-800">
                    {selectedTrip.confirmed_participant_count || 0} orang
                  </span>
                </div>
                {selectedTrip.pending_participant_count > 0 && (
                  <div>
                    <span className="text-orange-700">Pending:</span>
                    <span className="ml-2 font-semibold text-orange-800">
                      {selectedTrip.pending_participant_count} orang
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

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
                  {trips.map(trip => {
                    const totalRegistered = (trip.confirmed_participant_count || 0) + (trip.pending_participant_count || 0)
                    return (
                      <SelectItem key={trip.id} value={trip.id}>
                        {trip.name} - {formatShortDate(trip.departure_date)}
                        {trip.quota && (
                          <span className="ml-2 text-xs text-gray-500">
                            ({totalRegistered}/{trip.quota} orang, sisa {trip.available_quota || 0})
                          </span>
                        )}
                      </SelectItem>
                    )
                  })}
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
              <Label htmlFor="id_card_number">No. KTP/Identitas</Label>
              <Input
                id="id_card_number"
                value={formData.id_card_number}
                onChange={(e) => setFormData(prev => ({ ...prev, id_card_number: e.target.value }))}
                placeholder="Masukkan nomor identitas"
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

            <div className="space-y-2">
              <Label htmlFor="status">Status Peserta</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                  <SelectItem value="cancelled">Dibatalkan</SelectItem>
                </SelectContent>
              </Select>
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

            {!formData.trip_id ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Pilih trip terlebih dahulu untuk melihat meeting point yang tersedia.
                </AlertDescription>
              </Alert>
            ) : loadingMeetingPoints ? (
              <div className="animate-pulse h-12 bg-gray-200 rounded-lg"></div>
            ) : tripMeetingPoints.length === 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Trip ini belum memiliki meeting point. Silakan assign meeting point pada Trip Form terlebih dahulu.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="meeting_point_details">
                  Pilih Titik Kumpul <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.meeting_point_details}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, meeting_point_details: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih meeting point" />
                  </SelectTrigger>
                  <SelectContent>
                    {tripMeetingPoints.map((mp: any) => {
                      const primaryMeetingPoint = tripMeetingPoints.find((p: any) => p.is_primary)
                      const isPrimary = primaryMeetingPoint?.id === mp.id

                      return (
                        <SelectItem key={mp.id} value={mp.name}>
                          <div className="flex items-center space-x-2">
                            <MapPin className="h-3 w-3" />
                            <span>{mp.name}</span>
                            {isPrimary && (
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  Meeting point yang ditandai dengan ⭐ adalah meeting point utama trip ini.
                </p>
              </div>
            )}
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