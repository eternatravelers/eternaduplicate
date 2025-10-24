import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Bus, User, MapPin, Users, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useCreateMeetingPointAssignment, useUpdateMeetingPointAssignment } from '@/hooks/useMeetingPointAssignments'
import { useBuses } from '@/hooks/useBuses'
import { useDrivers } from '@/hooks/useDrivers'
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

  const { buses, loading: loadingBuses } = useBuses()
  const { drivers, loading: loadingDrivers } = useDrivers()
  const { createAssignment, loading: creating } = useCreateMeetingPointAssignment()
  const { updateAssignment, loading: updating } = useUpdateMeetingPointAssignment()

  const selectedBus = buses.find(b => b.id === formData.bus_id)
  const availableBuses = buses.filter(b => b.status === 'active')

  useEffect(() => {
    if (initialData) {
      setFormData({
        bus_id: initialData.bus_id || '',
        driver_id: initialData.driver_id || '',
        assignment_status: initialData.assignment_status || 'pending'
      })
    } else {
      setFormData({
        bus_id: '',
        driver_id: '',
        assignment_status: 'pending'
      })
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.bus_id) {
      alert('Pilih bus terlebih dahulu')
      return
    }

    if (participantCount === 0) {
      alert('Tidak dapat assign transportasi untuk meeting point tanpa peserta')
      return
    }

    const assignmentData = {
      trip_id: tripId,
      meeting_point_name: meetingPointName,
      bus_id: formData.bus_id || null,
      driver_id: formData.driver_id || null,
      capacity_used: participantCount,
      capacity_available: selectedBus?.capacity || 0,
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

  const isCapacitySufficient = selectedBus
    ? selectedBus.capacity >= participantCount
    : false

  const isLoading = creating || updating || loadingBuses || loadingDrivers

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

          <div className="space-y-2">
            <Label htmlFor="bus_id">Pilih Bus *</Label>
            <Select
              value={formData.bus_id}
              onValueChange={(value) =>
                setFormData({ ...formData, bus_id: value })
              }
            >
              <SelectTrigger id="bus_id">
                <SelectValue placeholder="Pilih bus..." />
              </SelectTrigger>
              <SelectContent>
                {availableBuses.map((bus) => {
                  const isSufficient = bus.capacity >= participantCount
                  return (
                    <SelectItem key={bus.id} value={bus.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {bus.bus_number} - {bus.type || 'Bus'}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          (Kapasitas: {bus.capacity})
                        </span>
                        {!isSufficient && (
                          <AlertTriangle className="h-3 w-3 text-orange-500 ml-1" />
                        )}
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>

            {selectedBus && (
              <div
                className={`p-3 rounded-lg border text-sm ${
                  isCapacitySufficient
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-orange-50 border-orange-200 text-orange-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {isCapacitySufficient ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertTriangle className="h-4 w-4" />
                  )}
                  <div>
                    <div className="font-medium">
                      Kapasitas Bus: {selectedBus.capacity} kursi
                    </div>
                    <div className="text-xs mt-1">
                      {isCapacitySufficient
                        ? `Cukup untuk ${participantCount} peserta (Sisa: ${
                            selectedBus.capacity - participantCount
                          } kursi)`
                        : `Tidak cukup! Kurang ${
                            participantCount - selectedBus.capacity
                          } kursi`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="driver_id">Pilih Driver (Opsional)</Label>
            <Select
              value={formData.driver_id}
              onValueChange={(value) =>
                setFormData({ ...formData, driver_id: value })
              }
            >
              <SelectTrigger id="driver_id">
                <SelectValue placeholder="Pilih driver..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Belum ditentukan</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    <div className="flex items-center space-x-2">
                      <User className="h-3 w-3" />
                      <span>{driver.name}</span>
                      {driver.phone && (
                        <span className="text-xs text-gray-500">
                          ({driver.phone})
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
