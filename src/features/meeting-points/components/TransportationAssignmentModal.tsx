import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Bus, MapPin, Users, AlertTriangle, AlertCircle } from 'lucide-react'
import { useCreateMeetingPointAssignment, useUpdateMeetingPointAssignment, useMeetingPointAssignments } from '@/hooks/useMeetingPointAssignments'
import { useTrips } from '@/hooks/useTrips'
import { BusAssignmentSection } from './BusAssignmentSection'
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
    assignment_status: 'pending'
  })
  const [submitError, setSubmitError] = useState<string | null>(null)

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
        assignment_status: initialData.assignment_status || 'pending'
      })
    } else if (isOpen) {
      setFormData({
        assignment_status: 'pending'
      })
      setSubmitError(null)
    }
  }, [initialData, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)

    if (participantCount === 0) {
      setSubmitError('Tidak dapat assign transportasi untuk meeting point tanpa peserta')
      return
    }

    const assignmentData = {
      trip_id: tripId,
      meeting_point_name: meetingPointName,
      capacity_used: participantCount,
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
            <BusAssignmentSection
              assignmentId={existingAssignment?.id || initialData?.id || ''}
              participantCount={participantCount}
              availableBuses={assignedBuses}
              onBusesChange={() => {}}
            />
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
              disabled={isLoading}
            >
              <Bus className="h-4 w-4 mr-2" />
              {isLoading ? 'Menyimpan...' : 'Simpan Assignment'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
