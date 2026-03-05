import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle2, Clock, AlertTriangle } from 'lucide-react'
import { useCheckResourceConflict, useResourceSchedules } from '@/hooks/useResourceSchedules'
import { Badge } from '@/components/ui/badge'
import { TimePicker } from '@/components/ui/time-picker'

interface ResourceScheduleFormProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  initialData?: any
  trips: any[]
  resources: {
    buses: any[]
    drivers: any[]
    tourLeaders: any[]
  }
  meetingPoints: any[]
}

export function ResourceScheduleForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  trips,
  resources,
  meetingPoints
}: ResourceScheduleFormProps) {
  const [formData, setFormData] = useState({
    resource_type: initialData?.resource_type || '',
    resource_id: initialData?.resource_id || '',
    trip_id: initialData?.trip_id || '',
    meeting_point_id: initialData?.meeting_point_id || '',
    pickup_datetime: initialData?.pickup_datetime || '',
    return_datetime: initialData?.return_datetime || '',
    status: initialData?.status || 'scheduled',
    participant_count: initialData?.participant_count || 0,
    notes: initialData?.notes || '',
    linked_bus_schedule_id: initialData?.linked_bus_schedule_id || ''
  })

  const [validationError, setValidationError] = useState<string | null>(null)
  const [conflictInfo, setConflictInfo] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)

  const { checkConflict, checking } = useCheckResourceConflict()

  const isCrewType = formData.resource_type === 'driver' || formData.resource_type === 'tour_leader'
  const { schedules: tripBusSchedules } = useResourceSchedules(
    isCrewType && formData.trip_id
      ? { tripId: formData.trip_id, resourceType: 'bus' }
      : undefined
  )

  const selectedTrip = trips.find(t => t.id === formData.trip_id)
  const availableResources = formData.resource_type === 'bus' ? resources.buses :
    formData.resource_type === 'driver' ? resources.drivers :
    formData.resource_type === 'tour_leader' ? resources.tourLeaders : []

  useEffect(() => {
    if (initialData) {
      const formatDatetime = (dt: string) => {
        if (!dt) return ''

        // Parse the datetime string and convert to local timezone
        const date = new Date(dt)

        // Format as YYYY-MM-DDTHH:mm:ss in local timezone
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const hours = String(date.getHours()).padStart(2, '0')
        const minutes = String(date.getMinutes()).padStart(2, '0')

        return `${year}-${month}-${day}T${hours}:${minutes}:00`
      }

      setFormData({
        resource_type: initialData.resource_type || '',
        resource_id: initialData.resource_id || '',
        trip_id: initialData.trip_id || '',
        meeting_point_id: initialData.meeting_point_id || '',
        pickup_datetime: formatDatetime(initialData.pickup_datetime),
        return_datetime: formatDatetime(initialData.return_datetime),
        status: initialData.status || 'scheduled',
        participant_count: initialData.participant_count || 0,
        notes: initialData.notes || '',
        linked_bus_schedule_id: initialData.linked_bus_schedule_id || ''
      })
    }
  }, [initialData])

  useEffect(() => {
    const checkForConflicts = async () => {
      if (formData.resource_type && formData.resource_id &&
          formData.pickup_datetime && formData.return_datetime) {

        const result = await checkConflict(
          formData.resource_type,
          formData.resource_id,
          formData.pickup_datetime,
          formData.return_datetime,
          initialData?.id
        )

        if (result.hasConflict) {
          setConflictInfo(result)
        } else {
          setConflictInfo(null)
        }
      }
    }

    const debounceTimer = setTimeout(checkForConflicts, 500)
    return () => clearTimeout(debounceTimer)
  }, [formData.resource_type, formData.resource_id, formData.pickup_datetime, formData.return_datetime])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setValidationError(null)

    if (!formData.resource_type || !formData.resource_id || !formData.trip_id) {
      setValidationError('Lengkapi semua field yang wajib diisi')
      return
    }

    if (!formData.pickup_datetime || !formData.return_datetime) {
      setValidationError('Tentukan waktu penjemputan dan kepulangan')
      return
    }

    if (new Date(formData.return_datetime) <= new Date(formData.pickup_datetime)) {
      setValidationError('Waktu kepulangan harus setelah waktu penjemputan')
      return
    }

    if (conflictInfo?.hasConflict) {
      setValidationError('Tidak dapat menyimpan: terdapat konflik jadwal. Pilih resource atau waktu yang berbeda.')
      return
    }

    try {
      setSubmitting(true)

      // Convert local datetime to UTC by creating a proper ISO string with timezone
      const convertToUTC = (localDateTimeString: string) => {
        // Parse as local time
        const localDate = new Date(localDateTimeString)
        // Return ISO string which will be in UTC
        return localDate.toISOString()
      }

      // Prepare data with UTC timestamps
      const dataToSubmit = {
        ...formData,
        pickup_datetime: convertToUTC(formData.pickup_datetime),
        return_datetime: convertToUTC(formData.return_datetime),
        linked_bus_schedule_id: formData.linked_bus_schedule_id || null
      }

      await onSubmit(dataToSubmit)
      // Only close and reset if successful
      onClose()
      setFormData({
        resource_type: '',
        resource_id: '',
        trip_id: '',
        meeting_point_id: '',
        pickup_datetime: '',
        return_datetime: '',
        status: 'scheduled',
        participant_count: 0,
        notes: '',
        linked_bus_schedule_id: ''
      })
      setConflictInfo(null)
      setValidationError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan'
      setValidationError(errorMessage)
      console.error('Submit error:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleTripSelect = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId)
    if (trip) {
      setFormData(prev => ({
        ...prev,
        trip_id: tripId,
        linked_bus_schedule_id: '',
        pickup_datetime: prev.pickup_datetime || `${trip.departure_date}T06:00:00`,
        return_datetime: prev.return_datetime || `${trip.return_date}T18:00:00`
      }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Edit Jadwal Resource' : 'Tambah Jadwal Resource Baru'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {validationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {conflictInfo?.hasConflict && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-semibold mb-2">Konflik Jadwal Terdeteksi!</div>
                <div className="text-sm space-y-1">
                  {conflictInfo.conflicts.map((conflict: any, index: number) => (
                    <div key={index} className="bg-red-50 p-2 rounded">
                      Trip: <strong>{conflict.trip_name}</strong><br />
                      Waktu: {new Date(conflict.pickup_datetime).toLocaleString('id-ID')} - {new Date(conflict.return_datetime).toLocaleString('id-ID')}
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="resource_type">Tipe Resource *</Label>
              <Select
                value={formData.resource_type}
                onValueChange={(value) => setFormData({ ...formData, resource_type: value, resource_id: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tipe resource" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bus">Bus</SelectItem>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="tour_leader">Tour Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="resource_id">Pilih Resource *</Label>
              <Select
                value={formData.resource_id}
                onValueChange={(value) => setFormData({ ...formData, resource_id: value })}
                disabled={!formData.resource_type}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih resource" />
                </SelectTrigger>
                <SelectContent>
                  {availableResources
                    .filter((r: any) => r.status === 'active')
                    .map((resource: any) => (
                      <SelectItem key={resource.id} value={resource.id}>
                        {formData.resource_type === 'bus' ? resource.plate_number :
                         formData.resource_type === 'driver' ? resource.name :
                         resource.name}
                        {formData.resource_type === 'bus' && ` (${resource.capacity} kursi)`}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trip_id">Trip *</Label>
            <Select
              value={formData.trip_id}
              onValueChange={handleTripSelect}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih trip" />
              </SelectTrigger>
              <SelectContent>
                {trips.filter(t => ['active', 'open', 'confirmed'].includes(t.status)).map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.name} - {new Date(trip.departure_date).toLocaleDateString('id-ID')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTrip && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                <div className="text-sm">
                  <strong>{selectedTrip.name}</strong><br />
                  Keberangkatan: {new Date(selectedTrip.departure_date).toLocaleDateString('id-ID')}<br />
                  Kepulangan: {new Date(selectedTrip.return_date).toLocaleDateString('id-ID')}<br />
                  Kuota: {selectedTrip.quota} orang
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isCrewType && formData.trip_id && tripBusSchedules.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="linked_bus_schedule_id">
                Assign ke Bus
                {tripBusSchedules.length > 1 && (
                  <span className="ml-2 text-xs font-normal text-blue-600">
                    {tripBusSchedules.length} bus tersedia dalam trip ini
                  </span>
                )}
              </Label>
              <Select
                value={formData.linked_bus_schedule_id || 'none'}
                onValueChange={(value) => setFormData({ ...formData, linked_bus_schedule_id: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih bus (opsional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tidak spesifik (crew trip umum)</SelectItem>
                  {tripBusSchedules.map((bs) => (
                    <SelectItem key={bs.id} value={bs.id}>
                      {bs.buses?.plate_number || 'Bus'}
                      {bs.buses?.model ? ` - ${bs.buses.model}` : ''}
                      {bs.buses?.capacity ? ` (${bs.buses.capacity} kursi)` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Jika tidak dipilih, crew akan ditampilkan sebagai crew trip umum dan muncul di semua bus.
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="meeting_point_id">Meeting Point (Opsional)</Label>
            <Select
              value={formData.meeting_point_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, meeting_point_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih meeting point (opsional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tidak ada meeting point spesifik</SelectItem>
                {meetingPoints.map((mp) => (
                  <SelectItem key={mp.id} value={mp.id}>
                    {mp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Waktu Penjemputan *</Label>
              <Input
                type="date"
                value={formData.pickup_datetime?.substring(0, 10) || ''}
                onChange={(e) => {
                  const date = e.target.value
                  const currentTime = formData.pickup_datetime?.substring(11, 16) || '06:00'

                  // Create date in local timezone and format as ISO string WITHOUT timezone conversion
                  const localDateTime = `${date}T${currentTime}:00`
                  setFormData({ ...formData, pickup_datetime: localDateTime })
                }}
                required
              />
              <TimePicker
                label="Jam Penjemputan"
                value={formData.pickup_datetime?.substring(11, 16) || '06:00'}
                onChange={(time) => {
                  const today = new Date()
                  const year = today.getFullYear()
                  const month = String(today.getMonth() + 1).padStart(2, '0')
                  const day = String(today.getDate()).padStart(2, '0')
                  const date = formData.pickup_datetime?.substring(0, 10) || `${year}-${month}-${day}`

                  // Create date in local timezone
                  const localDateTime = `${date}T${time}:00`
                  setFormData({ ...formData, pickup_datetime: localDateTime })
                }}
              />
            </div>

            <div className="space-y-2">
              <Label>Waktu Kepulangan *</Label>
              <Input
                type="date"
                value={formData.return_datetime?.substring(0, 10) || ''}
                onChange={(e) => {
                  const date = e.target.value
                  const currentTime = formData.return_datetime?.substring(11, 16) || '18:00'

                  // Create date in local timezone
                  const localDateTime = `${date}T${currentTime}:00`
                  setFormData({ ...formData, return_datetime: localDateTime })
                }}
                required
              />
              <TimePicker
                label="Jam Kepulangan"
                value={formData.return_datetime?.substring(11, 16) || '18:00'}
                onChange={(time) => {
                  const today = new Date()
                  const year = today.getFullYear()
                  const month = String(today.getMonth() + 1).padStart(2, '0')
                  const day = String(today.getDate()).padStart(2, '0')
                  const date = formData.return_datetime?.substring(0, 10) || `${year}-${month}-${day}`

                  // Create date in local timezone
                  const localDateTime = `${date}T${time}:00`
                  setFormData({ ...formData, return_datetime: localDateTime })
                }}
              />
            </div>
          </div>

          {checking && (
            <div className="flex items-center space-x-2 text-blue-600">
              <Clock className="h-4 w-4 animate-spin" />
              <span className="text-sm">Memeriksa konflik jadwal...</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.resource_type === 'bus' && (
              <div className="space-y-2">
                <Label htmlFor="participant_count">Kapasitas Terisi</Label>
                <Input
                  id="participant_count"
                  type="number"
                  min="0"
                  value={formData.participant_count}
                  onChange={(e) => setFormData({ ...formData, participant_count: parseInt(e.target.value) || 0 })}
                  placeholder="Jumlah kursi terisi"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Catatan tambahan..."
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={submitting || checking || conflictInfo?.hasConflict}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {submitting ? 'Menyimpan...' : initialData ? 'Update Jadwal' : 'Simpan Jadwal'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
