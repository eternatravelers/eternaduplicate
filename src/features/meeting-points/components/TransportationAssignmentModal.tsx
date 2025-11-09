import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Bus, User, MapPin, Users, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react'
import { useCreateMeetingPointAssignment, useUpdateMeetingPointAssignment, useMeetingPointAssignments } from '@/hooks/useMeetingPointAssignments'
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
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [selectedBus, setSelectedBus] = useState<any>(null)
  const [selectedDriver, setSelectedDriver] = useState<any>(null)

  const { trips } = useTrips()
  const { assignments } = useMeetingPointAssignments(tripId)
  const selectedTripData = trips.find(t => t.id === tripId)

  // Get all buses and drivers from the trip
  const assignedBuses = selectedTripData?.buses || []
  const assignedDrivers = selectedTripData?.drivers || []

  // Check if this meeting point already has an assignment
  const existingAssignment = assignments.find(
    a => a.meeting_point_name === meetingPointName
  )

  const { createAssignment, loading: creating, error: createError } = useCreateMeetingPointAssignment()
  const { updateAssignment, loading: updating, error: updateError } = useUpdateMeetingPointAssignment()

  useEffect(() => {
    if (initialData) {
      setFormData({
        bus_id: initialData.bus_id || '',
        driver_id: initialData.driver_id || '',
        assignment_status: initialData.assignment_status || 'pending'
      })
      if (initialData.bus_id && assignedBuses.length > 0) {
        const bus = assignedBuses.find(b => b.id === initialData.bus_id)
        setSelectedBus(bus || assignedBuses[0])
      } else if (assignedBuses.length > 0) {
        setSelectedBus(assignedBuses[0])
      }
      if (initialData.driver_id && assignedDrivers.length > 0) {
        const driver = assignedDrivers.find(d => d.id === initialData.driver_id)
        setSelectedDriver(driver || null)
      }
    } else if (isOpen) {
      // For new assignments, default to first bus and driver
      if (assignedBuses.length > 0) {
        setSelectedBus(assignedBuses[0])
        setFormData(prev => ({ ...prev, bus_id: assignedBuses[0].id }))
      }
      if (assignedDrivers.length > 0) {
        setSelectedDriver(assignedDrivers[0])
        setFormData(prev => ({ ...prev, driver_id: assignedDrivers[0].id }))
      }
      setSubmitError(null)
    }
  }, [initialData, isOpen, assignedBuses, assignedDrivers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    // Validation checks
    if (!selectedBus) {
      setSubmitError('Silakan pilih bus terlebih dahulu')
      return
    }

    if (!formData.bus_id) {
      setSubmitError('Bus ID tidak valid')
      return
    }

    if (participantCount === 0) {
      setSubmitError('Tidak dapat assign transportasi untuk meeting point tanpa peserta')
      return
    }

    if (selectedBus.capacity < participantCount) {
      setSubmitError(`Kapasitas bus tidak cukup. Bus memiliki ${selectedBus.capacity} kursi, tetapi dibutuhkan ${participantCount} kursi.`)
      return
    }

    const assignmentData = {
      trip_id: tripId,
      meeting_point_name: meetingPointName,
      bus_id: formData.bus_id,
      driver_id: formData.driver_id || null,
      capacity_used: participantCount,
      capacity_available: selectedBus.capacity,
      assignment_status: formData.assignment_status,
      pickup_schedule_id: null
    }

    const { error } = initialData
      ? await updateAssignment(initialData.id, assignmentData)
      : await createAssignment(assignmentData)

    if (!error) {
      onSuccess()
      onClose()
      setSubmitError(null)
    } else {
      setSubmitError(error)
    }
  }

  const isCapacitySufficient = selectedBus
    ? selectedBus.capacity >= participantCount
    : false

  const isLoading = creating || updating
  const displayError = submitError || createError || updateError

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
          {displayError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-red-700">{displayError}</p>
              </div>
            </div>
          )}

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
            {existingAssignment && (
              <div className="mt-2 text-xs text-blue-700 bg-blue-100 p-1.5 rounded">
                Sudah ada assignment untuk meeting point ini
              </div>
            )}
          </div>

          {assignedBuses.length === 0 ? (
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
              <Label htmlFor="bus_select">Pilih Bus</Label>
              <Select
                value={formData.bus_id}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, bus_id: value }))
                  const bus = assignedBuses.find(b => b.id === value)
                  setSelectedBus(bus)
                }}
              >
                <SelectTrigger id="bus_select">
                  <SelectValue placeholder="Pilih bus..." />
                </SelectTrigger>
                <SelectContent>
                  {assignedBuses.map(bus => (
                    <SelectItem key={bus.id} value={bus.id}>
                      {bus.bus_number} - {bus.type} ({bus.capacity} kursi)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedBus && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-blue-900 text-sm">
                        {selectedBus.bus_number} - {selectedBus.type}
                      </div>
                      <div className="text-xs text-blue-700 mt-1">
                        {selectedBus.plate_number} • Kapasitas: {selectedBus.capacity} kursi
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
                      ? `✓ Cukup untuk ${participantCount} peserta (Sisa: ${selectedBus.capacity - participantCount} kursi)`
                      : `⚠ Tidak cukup! Kurang ${participantCount - selectedBus.capacity} kursi`}
                  </div>
                </div>
              )}
            </div>
          )}

          {assignedDrivers.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="driver_select">Pilih Driver (Opsional)</Label>
              <Select
                value={formData.driver_id}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, driver_id: value }))
                  const driver = assignedDrivers.find(d => d.id === value)
                  setSelectedDriver(driver || null)
                }}
              >
                <SelectTrigger id="driver_select">
                  <SelectValue placeholder="Tidak ada driver..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Tidak pilih driver</SelectItem>
                  {assignedDrivers.map(driver => (
                    <SelectItem key={driver.id} value={driver.id}>
                      {driver.name} ({driver.license_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedDriver && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium text-green-900 text-sm">{selectedDriver.name}</div>
                      <div className="text-xs text-green-700 mt-0.5">
                        {selectedDriver.phone} • {selectedDriver.license_type}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
