import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Bus, MapPin, Clock, Users, Printer, Route } from 'lucide-react'
import { useBusPassengerAssignments } from '@/hooks/useBusPassengerAssignments'
import { useBusRouteStops } from '@/hooks/useBusRouteStops'

interface BusManifestViewProps {
  isOpen: boolean
  onClose: () => void
  resourceScheduleId: string
  busPlateNumber?: string
  busModel?: string
  busCapacity?: number
  tripName?: string
  pickupDatetime?: string
}

export function BusManifestView({
  isOpen,
  onClose,
  resourceScheduleId,
  busPlateNumber,
  busModel,
  busCapacity,
  tripName,
  pickupDatetime
}: BusManifestViewProps) {
  const { assignments, loading: assignmentsLoading } = useBusPassengerAssignments(resourceScheduleId)
  const { stops, loading: stopsLoading } = useBusRouteStops(resourceScheduleId)

  const handlePrint = () => {
    window.print()
  }

  const groupedByStop = stops.reduce((acc, stop) => {
    const stopAssignments = assignments.filter(a => a.boarding_stop_id === stop.id)
    if (stopAssignments.length > 0) {
      acc[stop.id] = { stop, passengers: stopAssignments }
    }
    return acc
  }, {} as Record<string, { stop: any; passengers: typeof assignments }>)

  const unassignedToStop = assignments.filter(a => !a.boarding_stop_id)

  const loading = assignmentsLoading || stopsLoading

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-gray-600" />
            <span>Manifest Penumpang Bus</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2 print:mt-0" id="manifest-content">
          {/* Header Info */}
          <div className="border rounded-lg p-4 bg-gray-50 print:border print:p-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Bus className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="text-xs text-gray-500">Bus</div>
                    <div className="font-semibold text-gray-800">{busPlateNumber || '-'}</div>
                    {busModel && <div className="text-xs text-gray-500">{busModel}</div>}
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <div>
                    <div className="text-xs text-gray-500">Trip</div>
                    <div className="font-semibold text-gray-800">{tripName || '-'}</div>
                  </div>
                </div>
              </div>
              {pickupDatetime && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <div>
                    <div className="text-xs text-gray-500">Berangkat</div>
                    <div className="font-semibold text-gray-800">
                      {new Date(pickupDatetime).toLocaleString('id-ID', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-xs text-gray-500">Kapasitas Terisi</div>
                  <div className="font-semibold text-gray-800">
                    {assignments.length}{busCapacity ? `/${busCapacity}` : ''} penumpang
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Route Summary */}
          {stops.length > 0 && (
            <div className="border rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Route className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-sm text-gray-700">Rute Perjalanan</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {stops.map((stop, i) => (
                  <div key={stop.id} className="flex items-center gap-1">
                    <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-3 py-1 text-xs">
                      <span className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                        {stop.stop_order}
                      </span>
                      <span className="font-medium text-blue-800">{stop.meeting_point_name}</span>
                      {stop.arrival_time && (
                        <span className="text-blue-500">{stop.arrival_time}</span>
                      )}
                    </div>
                    {i < stops.length - 1 && (
                      <span className="text-gray-300">&rarr;</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manifest Table */}
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-10 bg-gray-100 rounded" />)}
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Users className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <div className="text-sm">Belum ada penumpang yang di-assign ke bus ini</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Grouped by stop */}
              {stops.length > 0 && Object.values(groupedByStop).map(({ stop, passengers }) => (
                <div key={stop.id}>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs">
                      Stop {stop.stop_order}: {stop.meeting_point_name}
                    </Badge>
                    {stop.arrival_time && (
                      <span className="text-xs text-gray-500">Tiba: {stop.arrival_time}</span>
                    )}
                    <Badge variant="outline" className="text-xs">{passengers.length} pax</Badge>
                  </div>
                  <ManifestTable passengers={passengers} />
                </div>
              ))}

              {/* Passengers without stop assignment */}
              {unassignedToStop.length > 0 && (
                <div>
                  {stops.length > 0 && (
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs text-gray-600">Stop tidak ditentukan</Badge>
                      <Badge variant="outline" className="text-xs">{unassignedToStop.length} pax</Badge>
                    </div>
                  )}
                  {stops.length === 0 && (
                    <div className="text-sm font-semibold text-gray-700 mb-2">Daftar Penumpang</div>
                  )}
                  <ManifestTable passengers={unassignedToStop} />
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t print:hidden">
            <Button onClick={handlePrint} variant="outline" className="gap-2">
              <Printer className="h-4 w-4" />
              Cetak Manifest
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ManifestTable({ passengers }: { passengers: any[] }) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 w-8">No</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Nama Peserta</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 w-16">Kursi</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">No. HP</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Catatan</th>
          </tr>
        </thead>
        <tbody>
          {passengers.map((p, index) => (
            <tr key={p.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
              <td className="px-3 py-2 text-gray-500 text-xs">{index + 1}</td>
              <td className="px-3 py-2 font-medium text-gray-800">{p.participants?.full_name || '-'}</td>
              <td className="px-3 py-2">
                {p.seat_number ? (
                  <Badge variant="outline" className="text-xs font-mono">{p.seat_number}</Badge>
                ) : (
                  <span className="text-gray-300 text-xs">-</span>
                )}
              </td>
              <td className="px-3 py-2 text-gray-600 text-xs">{p.participants?.phone || '-'}</td>
              <td className="px-3 py-2 text-gray-500 text-xs">{p.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
