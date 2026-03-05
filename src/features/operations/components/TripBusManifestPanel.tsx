import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bus, Users, MapPin, Clock, Route, Printer, ChevronDown, ChevronUp, CircleUser as UserCircle, Briefcase, CreditCard } from 'lucide-react'
import { useResourceSchedules } from '@/hooks/useResourceSchedules'
import { useBusPassengerAssignments } from '@/hooks/useBusPassengerAssignments'
import { useBusRouteStops } from '@/hooks/useBusRouteStops'

interface TripBusManifestPanelProps {
  tripId: string
  tripName: string
}

export function TripBusManifestPanel({ tripId, tripName }: TripBusManifestPanelProps) {
  const { schedules: busSchedules, loading: busLoading } = useResourceSchedules({ tripId, resourceType: 'bus' })
  const { schedules: driverSchedules, loading: driverLoading } = useResourceSchedules({ tripId, resourceType: 'driver' })
  const { schedules: leaderSchedules, loading: leaderLoading } = useResourceSchedules({ tripId, resourceType: 'tour_leader' })
  const [expandedBus, setExpandedBus] = useState<string | null>(null)

  const loading = busLoading || driverLoading || leaderLoading

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="h-20 bg-gray-100 rounded-lg" />
        {[1, 2].map(i => <div key={i} className="h-24 bg-gray-100 rounded-lg" />)}
      </div>
    )
  }

  if (busSchedules.length === 0 && driverSchedules.length === 0 && leaderSchedules.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <Bus className="h-14 w-14 mx-auto mb-3 opacity-30" />
        <div className="text-base font-medium">Belum ada resource yang dijadwalkan</div>
        <div className="text-sm mt-1">Assign bus, driver, dan tour leader di halaman Resource Scheduling</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Manifest trip <span className="font-medium text-gray-700">{tripName}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.print()}
          className="gap-2 text-xs"
        >
          <Printer className="h-3.5 w-3.5" />
          Cetak Semua
        </Button>
      </div>

      {/* Crew Summary */}
      {(driverSchedules.length > 0 || leaderSchedules.length > 0) && (
        <Card className="border border-gray-200">
          <div className="p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Crew Trip
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {driverSchedules.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserCircle className="h-4 w-4 text-amber-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">
                      {s.drivers?.name || '-'}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-xs px-1.5 py-0">
                        Driver
                      </Badge>
                      {s.drivers?.license_number && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <CreditCard className="h-3 w-3" />
                          {s.drivers.license_number}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {leaderSchedules.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Briefcase className="h-4 w-4 text-teal-700" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-800 truncate">
                      {s.tour_leaders?.name || '-'}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge className="bg-teal-100 text-teal-700 border-teal-200 text-xs px-1.5 py-0">
                        Tour Leader
                      </Badge>
                      {s.tour_leaders?.experience_years != null && (
                        <span className="text-xs text-gray-500">
                          {s.tour_leaders.experience_years} thn pengalaman
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Bus Cards */}
      {busSchedules.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {busSchedules.length} Bus Dijadwalkan
          </div>
          {busSchedules.map(schedule => (
            <BusManifestCard
              key={schedule.id}
              schedule={schedule}
              drivers={driverSchedules}
              tourLeaders={leaderSchedules}
              isExpanded={expandedBus === schedule.id}
              onToggle={() => setExpandedBus(expandedBus === schedule.id ? null : schedule.id)}
            />
          ))}
        </div>
      )}

      {busSchedules.length === 0 && (driverSchedules.length > 0 || leaderSchedules.length > 0) && (
        <div className="text-center py-8 text-gray-400 text-sm">
          <Bus className="h-10 w-10 mx-auto mb-2 opacity-30" />
          Belum ada bus yang dijadwalkan
        </div>
      )}
    </div>
  )
}

interface BusManifestCardProps {
  schedule: any
  drivers: any[]
  tourLeaders: any[]
  isExpanded: boolean
  onToggle: () => void
}

function BusManifestCard({ schedule, drivers, tourLeaders, isExpanded, onToggle }: BusManifestCardProps) {
  const { assignments, loading: assignmentsLoading } = useBusPassengerAssignments(isExpanded ? schedule.id : null)
  const { stops, loading: stopsLoading } = useBusRouteStops(isExpanded ? schedule.id : null)

  const groupedByStop = stops.reduce((acc, stop) => {
    const stopPassengers = assignments.filter(a => a.boarding_stop_id === stop.id)
    if (stopPassengers.length > 0) {
      acc[stop.id] = { stop, passengers: stopPassengers }
    }
    return acc
  }, {} as Record<string, { stop: any; passengers: typeof assignments }>)

  const unassignedToStop = assignments.filter(a => !a.boarding_stop_id)

  const plateNumber = schedule.buses?.plate_number || '-'
  const busModel = schedule.buses?.model || ''
  const capacity = schedule.buses?.capacity

  return (
    <Card className="border border-gray-200 overflow-hidden">
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Bus className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-900 flex items-center gap-2">
              {plateNumber}
              {busModel && <span className="text-sm font-normal text-gray-500">{busModel}</span>}
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {schedule.pickup_datetime && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {new Date(schedule.pickup_datetime).toLocaleString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </div>
              )}
              {schedule.meeting_point_name && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3 w-3" />
                  {schedule.meeting_point_name}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-700">
              {isExpanded ? assignments.length : schedule.participant_count || 0}
              {capacity ? `/${capacity}` : ''} kursi
            </div>
            <div className="text-xs text-gray-400">penumpang</div>
          </div>
          {isExpanded
            ? <ChevronUp className="h-4 w-4 text-gray-400" />
            : <ChevronDown className="h-4 w-4 text-gray-400" />
          }
        </div>
      </div>

      {isExpanded && (
        <div className="border-t bg-gray-50/50">
          {assignmentsLoading || stopsLoading ? (
            <div className="p-4 animate-pulse space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-8 bg-gray-200 rounded" />)}
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Crew for this trip */}
              {(drivers.length > 0 || tourLeaders.length > 0) && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 self-center">Crew:</span>
                  {drivers.map(d => (
                    <div key={d.id} className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                      <UserCircle className="h-3 w-3 text-amber-600" />
                      <span className="text-xs font-medium text-amber-800">{d.drivers?.name || '-'}</span>
                      <Badge className="bg-amber-100 text-amber-600 border-0 text-xs px-1 py-0 h-4">Driver</Badge>
                    </div>
                  ))}
                  {tourLeaders.map(l => (
                    <div key={l.id} className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 rounded-full px-2.5 py-1">
                      <Briefcase className="h-3 w-3 text-teal-600" />
                      <span className="text-xs font-medium text-teal-800">{l.tour_leaders?.name || '-'}</span>
                      <Badge className="bg-teal-100 text-teal-600 border-0 text-xs px-1 py-0 h-4">Guide</Badge>
                    </div>
                  ))}
                </div>
              )}

              {assignments.length === 0 ? (
                <div className="py-6 text-center text-gray-400 text-sm">
                  <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  Belum ada penumpang yang di-assign ke bus ini
                </div>
              ) : (
                <>
                  {/* Route Summary */}
                  {stops.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Route className="h-4 w-4 text-blue-500 flex-shrink-0" />
                      {stops.map((stop, i) => (
                        <div key={stop.id} className="flex items-center gap-1">
                          <div className="flex items-center gap-1 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5 text-xs">
                            <span className="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                              {stop.stop_order}
                            </span>
                            <span className="font-medium text-blue-800">{stop.meeting_point_name}</span>
                            {stop.arrival_time && (
                              <span className="text-blue-500">{stop.arrival_time}</span>
                            )}
                          </div>
                          {i < stops.length - 1 && <span className="text-gray-300 text-xs">&rarr;</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Passengers by stop */}
                  {stops.length > 0 && Object.values(groupedByStop).map(({ stop, passengers }) => (
                    <div key={stop.id}>
                      <div className="flex items-center gap-2 mb-2">
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

                  {/* Unassigned to stop */}
                  {unassignedToStop.length > 0 && (
                    <div>
                      {stops.length > 0 && (
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="text-xs text-gray-600">Stop tidak ditentukan</Badge>
                          <Badge variant="outline" className="text-xs">{unassignedToStop.length} pax</Badge>
                        </div>
                      )}
                      {stops.length === 0 && (
                        <div className="text-sm font-medium text-gray-700 mb-2">Daftar Penumpang</div>
                      )}
                      <ManifestTable passengers={unassignedToStop} />
                    </div>
                  )}

                  <div className="text-right pt-1">
                    <div className="text-xs text-gray-400">
                      Total: {assignments.length} kursi • {new Set(assignments.map(a => a.participant_id)).size} pendaftar
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}

function ManifestTable({ passengers }: { passengers: any[] }) {
  const slotIndexMap: Record<string, number> = {}
  const slotCountMap: Record<string, number> = {}
  passengers.forEach(p => {
    slotCountMap[p.participant_id] = (slotCountMap[p.participant_id] || 0) + 1
  })

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 w-8">No</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Nama Pendaftar</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600 w-16">Kursi</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">No. HP</th>
            <th className="text-left px-3 py-2 text-xs font-semibold text-gray-600">Catatan</th>
          </tr>
        </thead>
        <tbody>
          {passengers.map((p, index) => {
            slotIndexMap[p.participant_id] = (slotIndexMap[p.participant_id] || 0) + 1
            const slotIndex = slotIndexMap[p.participant_id]
            const totalSlots = slotCountMap[p.participant_id]
            const isMulti = totalSlots > 1
            return (
              <tr key={p.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                <td className="px-3 py-2 text-gray-400 text-xs">{index + 1}</td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-gray-800">{p.participants?.full_name || '-'}</span>
                    {isMulti && (
                      <Badge variant="outline" className="text-xs px-1 py-0 border-amber-300 text-amber-700 bg-amber-50">
                        {slotIndex}/{totalSlots}
                      </Badge>
                    )}
                  </div>
                </td>
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
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
