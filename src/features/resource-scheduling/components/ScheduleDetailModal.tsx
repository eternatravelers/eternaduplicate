import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Bus, UserCheck, Users, MapPin, Clock, Calendar, FileText, Route, ClipboardList } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'
import { useBusRouteStops } from '@/hooks/useBusRouteStops'
import { useBusPassengerAssignments } from '@/hooks/useBusPassengerAssignments'
import { BusRouteStopsManager } from './BusRouteStopsManager'
import { SeatAssignmentModal } from './SeatAssignmentModal'
import { BusManifestView } from './BusManifestView'

interface ScheduleDetailModalProps {
  isOpen: boolean
  onClose: () => void
  schedule: any
}

export function ScheduleDetailModal({
  isOpen,
  onClose,
  schedule
}: ScheduleDetailModalProps) {
  const [showRouteManager, setShowRouteManager] = useState(false)
  const [showSeatAssignment, setShowSeatAssignment] = useState(false)
  const [showManifest, setShowManifest] = useState(false)

  const isBus = schedule?.resource_type === 'bus'

  const { stops, refetch: refetchStops } = useBusRouteStops(isBus && isOpen ? schedule?.id : null)
  const { assignments, refetch: refetchAssignments } = useBusPassengerAssignments(isBus && isOpen ? schedule?.id : null)

  if (!schedule) return null

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'bus': return <Bus className="h-5 w-5 text-blue-600" />
      case 'driver': return <UserCheck className="h-5 w-5 text-green-600" />
      case 'tour_leader': return <Users className="h-5 w-5 text-orange-600" />
      default: return null
    }
  }

  const getResourceLabel = (type: string) => {
    switch (type) {
      case 'bus': return 'Bus'
      case 'driver': return 'Driver'
      case 'tour_leader': return 'Tour Leader'
      default: return type
    }
  }

  const getResourceName = () => {
    if (schedule.resource_type === 'bus') {
      return schedule.buses?.plate_number || 'N/A'
    } else if (schedule.resource_type === 'driver') {
      return schedule.drivers?.name || 'N/A'
    } else if (schedule.resource_type === 'tour_leader') {
      return schedule.tour_leaders?.name || 'N/A'
    }
    return 'N/A'
  }

  const getResourceDetails = () => {
    if (schedule.resource_type === 'bus' && schedule.buses) {
      return (
        <div className="text-sm text-gray-600 mt-1">
          <div>Model: {schedule.buses.model || '-'}</div>
          <div>Kapasitas: {schedule.buses.capacity || '-'} kursi</div>
        </div>
      )
    } else if (schedule.resource_type === 'driver' && schedule.drivers) {
      return (
        <div className="text-sm text-gray-600 mt-1">
          <div>No. SIM: {schedule.drivers.license_number || '-'}</div>
        </div>
      )
    } else if (schedule.resource_type === 'tour_leader' && schedule.tour_leaders) {
      return (
        <div className="text-sm text-gray-600 mt-1">
          <div>Pengalaman: {schedule.tour_leaders.experience_years || '-'} tahun</div>
        </div>
      )
    }
    return null
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              {getResourceIcon(schedule.resource_type)}
              <span>Detail Jadwal Resource</span>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            <div>
              <Label className="text-gray-500 text-sm">Status</Label>
              <div className="mt-1">
                <Badge className={getStatusColor(schedule.status)}>
                  {schedule.status}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500 text-sm">Tipe Resource</Label>
                <div className="mt-1 flex items-center space-x-2">
                  {getResourceIcon(schedule.resource_type)}
                  <span className="font-medium">{getResourceLabel(schedule.resource_type)}</span>
                </div>
              </div>
              <div>
                <Label className="text-gray-500 text-sm">Nama Resource</Label>
                <div className="mt-1 font-medium">{getResourceName()}</div>
                {getResourceDetails()}
              </div>
            </div>

            <div>
              <Label className="text-gray-500 text-sm flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>Trip</span>
              </Label>
              <div className="mt-1 font-medium">{schedule.trips?.name || 'N/A'}</div>
            </div>

            {schedule.meeting_point_name && (
              <div>
                <Label className="text-gray-500 text-sm flex items-center space-x-1">
                  <MapPin className="h-4 w-4" />
                  <span>Meeting Point</span>
                </Label>
                <div className="mt-1 font-medium">{schedule.meeting_point_name}</div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-500 text-sm flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Waktu Penjemputan</span>
                </Label>
                <div className="mt-1">
                  <div className="font-medium">
                    {format(new Date(schedule.pickup_datetime), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                  </div>
                  <div className="text-sm text-gray-600">
                    Jam {format(new Date(schedule.pickup_datetime), 'HH:mm', { locale: idLocale })} WIB
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-gray-500 text-sm flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>Waktu Kepulangan</span>
                </Label>
                <div className="mt-1">
                  <div className="font-medium">
                    {format(new Date(schedule.return_datetime), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
                  </div>
                  <div className="text-sm text-gray-600">
                    Jam {format(new Date(schedule.return_datetime), 'HH:mm', { locale: idLocale })} WIB
                  </div>
                </div>
              </div>
            </div>

            {schedule.resource_type === 'bus' && (
              <div>
                <Label className="text-gray-500 text-sm flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Kapasitas Terisi</span>
                </Label>
                <div className="mt-1">
                  <div className="font-medium">
                    {assignments.length} / {schedule.buses?.capacity || 0} kursi
                  </div>
                  <div className="text-sm text-gray-600">
                    {schedule.buses?.capacity
                      ? `${Math.round((assignments.length / schedule.buses.capacity) * 100)}% terisi`
                      : '-'
                    }
                  </div>
                </div>
              </div>
            )}

            {schedule.notes && (
              <div>
                <Label className="text-gray-500 text-sm flex items-center space-x-1">
                  <FileText className="h-4 w-4" />
                  <span>Catatan</span>
                </Label>
                <div className="mt-1 p-3 bg-gray-50 rounded-lg border">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{schedule.notes}</p>
                </div>
              </div>
            )}

            {/* Bus-specific: Route Summary */}
            {isBus && stops.length > 0 && (
              <div>
                <Label className="text-gray-500 text-sm flex items-center space-x-1">
                  <Route className="h-4 w-4" />
                  <span>Rute Bus ({stops.length} stop)</span>
                </Label>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {stops.map((stop, i) => (
                    <div key={stop.id} className="flex items-center gap-1">
                      <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 text-xs">
                        <span className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                          {stop.stop_order}
                        </span>
                        <span className="text-blue-800 font-medium">{stop.meeting_point_name}</span>
                        {stop.arrival_time && <span className="text-blue-500">{stop.arrival_time}</span>}
                      </div>
                      {i < stops.length - 1 && <span className="text-gray-300 text-xs">&rarr;</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bus Action Buttons */}
            {isBus && (
              <div className="border-t pt-4">
                <Label className="text-gray-500 text-sm mb-3 block">Manajemen Bus</Label>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRouteManager(true)}
                    className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                  >
                    <Route className="h-4 w-4" />
                    {stops.length > 0 ? `Edit Rute (${stops.length} stop)` : 'Setup Rute'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSeatAssignment(true)}
                    className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Users className="h-4 w-4" />
                    {assignments.length > 0 ? `Edit Penumpang (${assignments.length})` : 'Assign Penumpang'}
                  </Button>
                  {assignments.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowManifest(true)}
                      className="gap-2 text-gray-600 border-gray-200 hover:bg-gray-50"
                    >
                      <ClipboardList className="h-4 w-4" />
                      Lihat Manifest
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t text-xs text-gray-500">
              <div>
                <div>Dibuat:</div>
                <div>{format(new Date(schedule.created_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}</div>
              </div>
              <div>
                <div>Terakhir diubah:</div>
                <div>{format(new Date(schedule.updated_at), 'dd MMM yyyy HH:mm', { locale: idLocale })}</div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isBus && (
        <>
          <BusRouteStopsManager
            isOpen={showRouteManager}
            onClose={() => setShowRouteManager(false)}
            resourceScheduleId={schedule.id}
            busPlateNumber={schedule.buses?.plate_number}
            tripName={schedule.trips?.name}
            onSaved={() => refetchStops()}
          />

          <SeatAssignmentModal
            isOpen={showSeatAssignment}
            onClose={() => setShowSeatAssignment(false)}
            resourceScheduleId={schedule.id}
            tripId={schedule.trip_id}
            busPlateNumber={schedule.buses?.plate_number}
            busCapacity={schedule.buses?.capacity}
            tripName={schedule.trips?.name}
            onSaved={() => refetchAssignments()}
          />

          <BusManifestView
            isOpen={showManifest}
            onClose={() => setShowManifest(false)}
            resourceScheduleId={schedule.id}
            tripId={schedule.trip_id}
            busPlateNumber={schedule.buses?.plate_number}
            busModel={schedule.buses?.model}
            busCapacity={schedule.buses?.capacity}
            tripName={schedule.trips?.name}
            pickupDatetime={schedule.pickup_datetime}
          />
        </>
      )}
    </>
  )
}
