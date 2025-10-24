import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Bus, User, MapPin, Users, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useCreateMeetingPointAssignment, useUpdateMeetingPointAssignment } from '@/hooks/useMeetingPointAssignments'
import { useTrips } from '@/hooks/useTrips'
import type { MeetingPointSummary } from '@/hooks/useMeetingPointSummary'

interface TransportationAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  meetingPointName: string
  participantCount: number
  initialData?: any
  onSuccess: () => void
}

export function TransportationAssignmentModal({
  isOpen,
  onClose,
  tripId,
  meetingPointName,
  participantCount,
  initialData,
  onSuccess
}: TransportationAssignmentModalProps) {
  const [formData, setFormData] = useState({
    bus_id: '',
    driver_id: '',
    assignment_status: 'pending'
  })

  const { trips } = useTrips()
  const selectedTripData = trips.find(t => t.id === tripId)

  const assignedBus = selectedTripData?.buses
  const assignedDriver = selectedTripData?.drivers

  const { createAssignment, loading: creating } = useCreateMeetingPointAssignment()
  const { updateAssignment, loading: updating } = useUpdateMeetingPointAssignment()

  useEffect(() => {
    if (initialData) {
      setFormData({
        bus_id: initialData.bus_id || assignedBus?.id || '',
        driver_id: initialData.driver_id || assignedDriver?.id || '',
        assignment_status: initialData.assignment_status || 'pending'
      })
    } else if (assignedBus) {
      setFormData({
        bus_id: assignedBus.id,
        driver_id: assignedDriver?.id || '',
        assignment_status: 'pending'
      })
    }
  }, [initialData, isOpen, assignedBus, assignedDriver])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!assignedBus) {
      alert('Trip ini belum memiliki bus yang di-assign. Silakan assign bus di halaman Manajemen Perjalanan terlebih dahulu.')
      return
    }

    if (participantCount === 0) {
      alert('Tidak dapat assign transportasi untuk meeting point tanpa peserta')
      return
    }

    const assignmentData = {
      trip_id: tripId,
      meeting_point_name: meetingPointName,
      bus_id: assignedBus.id,
      driver_id: assignedDriver?.id || null,
      capacity_used: participantCount,
      capacity_available: assignedBus.capacity,
      assignment_status: formData.assignment_status,
      pickup_schedule_id: null
    }

    const { error } = initialData
      ? await updateAssignment(initialData.id, assignmentData)
      : await createAssignment(assignmentData)

    if (!error) {
      onSuccess()
      onClose()
    }
  }

  const isCapacitySufficient = assignedBus
    ? assignedBus.capacity >= participantCount
    : false

  const isLoading = creating || updating

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bus className="h-5 w-5 text-blue-600" />
            <span>
              {initialData ? 'Edit Assignment Transportasi' : 'Assign Bus & Driver'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Meeting Point
                </span>
              </div>
              <Badge className="bg-blue-100 text-blue-800">
                <Users className="h-3 w-3 mr-1" />
                {participantCount} peserta
              </Badge>
            </div>
            <div className="text-sm text-blue-700 font-semibold">
              {meetingPointName}
            </div>
          </div>

          {!assignedBus ? (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-900">
                    Belum ada bus yang di-assign
                  </p>
                  <p className="text-xs text-orange-700">
                    Silakan assign bus di halaman <strong>Manajemen Perjalanan</strong> terlebih dahulu sebelum melakukan assignment meeting point.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="mt-2"
                    onClick={() => window.location.href = '/trips'}
                  >
                    Buka Manajemen Perjalanan
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Bus dari Trip</Label>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-blue-900">
                      {assignedBus.bus_number} - {assignedBus.type}
                    </div>
                    <div className="text-xs text-blue-700 mt-1">
                      {assignedBus.plate_number} • Kapasitas: {assignedBus.capacity} kursi
                    </div>
                  </div>
                  {isCapacitySufficient ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                  )}
                </div>
                <div className="mt-2 text-xs text-blue-700">
                  {isCapacitySufficient
                    ? `✓ Cukup untuk ${participantCount} peserta (Sisa: ${assignedBus.capacity - participantCount} kursi)`
                    : `⚠ Tidak cukup! Kurang ${participantCount - assignedBus.capacity} kursi`}
                </div>
              </div>
            </div>
          )}

          {assignedDriver ? (
            <div className="space-y-2">
              <Label>Driver dari Trip</Label>
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="font-medium text-green-900">{assignedDriver.name}</div>
                    <div className="text-xs text-green-700 mt-0.5">
                      {assignedDriver.phone} • {assignedDriver.license_type}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="flex items-center space-x-2 text-gray-600">
                <User className="h-4 w-4" />
                <span className="text-sm">Driver belum di-assign di trip ini</span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="assignment_status">Status Assignment</Label>
            <Select
              value={formData.assignment_status}
              onValueChange={(value) =>
                setFormData({ ...formData, assignment_status: value })
              }
            >
              <SelectTrigger id="assignment_status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                <SelectItem value="in_transit">Dalam Perjalanan</SelectItem>
                <SelectItem value="arrived">Sudah Tiba</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
              </SelectContent>
            </Select>
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
              disabled={isLoading || !isCapacitySufficient}
            >
              <Bus className="h-4 w-4 mr-2" />
              {isLoading ? 'Menyimpan...' : 'Assign Transportasi'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
