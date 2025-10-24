import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, MapPin, Save } from 'lucide-react'
import { useCreatePickupSchedule, useUpdatePickupSchedule } from '@/hooks/usePickupSchedules'

interface PickupScheduleFormProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  meetingPointName: string
  initialData?: any
  onSuccess: () => void
}

export function PickupScheduleForm({
  isOpen,
  onClose,
  tripId,
  meetingPointName,
  initialData,
  onSuccess
}: PickupScheduleFormProps) {
  const [formData, setFormData] = useState({
    pickup_time: '',
    estimated_duration: 30,
    notes: '',
    status: 'scheduled'
  })

  const { createSchedule, loading: creating } = useCreatePickupSchedule()
  const { updateSchedule, loading: updating } = useUpdatePickupSchedule()

  useEffect(() => {
    if (initialData) {
      setFormData({
        pickup_time: initialData.pickup_time || '',
        estimated_duration: initialData.estimated_duration || 30,
        notes: initialData.notes || '',
        status: initialData.status || 'scheduled'
      })
    } else {
      setFormData({
        pickup_time: '',
        estimated_duration: 30,
        notes: '',
        status: 'scheduled'
      })
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const scheduleData = {
      trip_id: tripId,
      meeting_point_name: meetingPointName,
      pickup_time: formData.pickup_time || null,
      estimated_duration: formData.estimated_duration,
      notes: formData.notes || null,
      status: formData.status
    }

    const { error } = initialData
      ? await updateSchedule(initialData.id, scheduleData)
      : await createSchedule(scheduleData)

    if (!error) {
      onSuccess()
      onClose()
    }
  }

  const isLoading = creating || updating

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span>
              {initialData ? 'Edit Jadwal Penjemputan' : 'Atur Jadwal Penjemputan'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">
                Meeting Point
              </span>
            </div>
            <div className="text-sm text-blue-700 font-semibold">
              {meetingPointName}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pickup_time">Waktu Penjemputan</Label>
            <Input
              id="pickup_time"
              type="time"
              value={formData.pickup_time}
              onChange={(e) =>
                setFormData({ ...formData, pickup_time: e.target.value })
              }
              required
            />
            <p className="text-xs text-gray-500">
              Waktu yang direncanakan untuk penjemputan peserta
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="estimated_duration">
              Estimasi Durasi (menit)
            </Label>
            <Input
              id="estimated_duration"
              type="number"
              min="5"
              max="180"
              value={formData.estimated_duration}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  estimated_duration: parseInt(e.target.value) || 30
                })
              }
              required
            />
            <p className="text-xs text-gray-500">
              Perkiraan waktu yang dibutuhkan untuk proses penjemputan
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduled">Terjadwal</SelectItem>
                <SelectItem value="in_progress">Sedang Berlangsung</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Catatan khusus untuk penjemputan di meeting point ini..."
              rows={3}
            />
          </div>

          <div className="flex space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isLoading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isLoading}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Menyimpan...' : 'Simpan Jadwal'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
