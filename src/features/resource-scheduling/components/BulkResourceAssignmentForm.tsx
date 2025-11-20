import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SimpleMultiSelect } from '@/components/ui/simple-multi-select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Bus, UserCheck, Users, AlertTriangle, CheckCircle2, Loader2, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface BulkResourceAssignmentFormProps {
  trips: Array<{ id: string; name: string; departure_date: string; return_date: string }>
  buses: Array<{ id: string; bus_number: string; capacity: number }>
  drivers: Array<{ id: string; name: string }>
  tourLeaders: Array<{ id: string; name: string }>
  onSave: () => void
  onCancel: () => void
}

export function BulkResourceAssignmentForm({
  trips,
  buses,
  drivers,
  tourLeaders,
  onSave,
  onCancel
}: BulkResourceAssignmentFormProps) {
  const [selectedTripId, setSelectedTripId] = useState('')
  const [selectedBuses, setSelectedBuses] = useState<string[]>([])
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([])
  const [selectedTourLeaders, setSelectedTourLeaders] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [checkingConflicts, setCheckingConflicts] = useState(false)
  const [conflicts, setConflicts] = useState<any[]>([])

  const selectedTrip = trips.find(t => t.id === selectedTripId)

  useEffect(() => {
    if (selectedTripId && (selectedBuses.length > 0 || selectedDrivers.length > 0 || selectedTourLeaders.length > 0)) {
      checkConflicts()
    } else {
      setConflicts([])
    }
  }, [selectedTripId, selectedBuses, selectedDrivers, selectedTourLeaders])

  const checkConflicts = async () => {
    if (!selectedTrip) return

    try {
      setCheckingConflicts(true)
      const allResources = [
        ...selectedBuses.map(id => ({ type: 'bus', id, name: buses.find(b => b.id === id)?.bus_number || 'Unknown' })),
        ...selectedDrivers.map(id => ({ type: 'driver', id, name: drivers.find(d => d.id === id)?.name || 'Unknown' })),
        ...selectedTourLeaders.map(id => ({ type: 'tour_leader', id, name: tourLeaders.find(tl => tl.id === id)?.name || 'Unknown' }))
      ]

      const conflictResults = []

      for (const resource of allResources) {
        const { data: existingSchedules, error } = await supabase
          .from('resource_schedules')
          .select('id, trip_id, pickup_datetime, return_datetime, status')
          .eq('resource_type', resource.type)
          .eq('resource_id', resource.id)
          .in('status', ['scheduled', 'confirmed', 'in_progress'])
          .neq('trip_id', selectedTripId)

        if (error || !existingSchedules) continue

        const pickupTime = new Date(selectedTrip.departure_date).getTime()
        const returnTime = new Date(selectedTrip.return_date).getTime()

        const resourceConflicts = existingSchedules.filter(schedule => {
          const schedulePickup = new Date(schedule.pickup_datetime).getTime()
          const scheduleReturn = new Date(schedule.return_datetime).getTime()
          return (pickupTime < scheduleReturn && returnTime > schedulePickup)
        })

        if (resourceConflicts.length > 0) {
          const tripIds = resourceConflicts.map(c => c.trip_id)
          const { data: conflictTrips } = await supabase
            .from('trips')
            .select('id, name')
            .in('id', tripIds)

          conflictResults.push({
            resourceType: resource.type,
            resourceId: resource.id,
            resourceName: resource.name,
            conflicts: resourceConflicts.map(conflict => {
              const trip = conflictTrips?.find(t => t.id === conflict.trip_id)
              return {
                trip_name: trip?.name || 'Unknown Trip',
                pickup_datetime: conflict.pickup_datetime,
                return_datetime: conflict.return_datetime
              }
            })
          })
        }
      }

      setConflicts(conflictResults)
    } catch (err) {
      console.error('Error checking conflicts:', err)
    } finally {
      setCheckingConflicts(false)
    }
  }

  const handleSave = async () => {
    if (!selectedTripId || !selectedTrip) {
      alert('Pilih trip terlebih dahulu')
      return
    }

    if (selectedBuses.length === 0 && selectedDrivers.length === 0 && selectedTourLeaders.length === 0) {
      alert('Pilih minimal satu resource')
      return
    }

    if (conflicts.length > 0) {
      alert('Ada konflik jadwal. Silakan hapus resource yang konflik terlebih dahulu.')
      return
    }

    try {
      setSaving(true)

      const schedules = [
        ...selectedBuses.map(busId => ({
          trip_id: selectedTripId,
          resource_type: 'bus',
          resource_id: busId,
          pickup_datetime: selectedTrip.departure_date,
          return_datetime: selectedTrip.return_date,
          status: 'scheduled',
          participant_count: 0
        })),
        ...selectedDrivers.map(driverId => ({
          trip_id: selectedTripId,
          resource_type: 'driver',
          resource_id: driverId,
          pickup_datetime: selectedTrip.departure_date,
          return_datetime: selectedTrip.return_date,
          status: 'scheduled',
          participant_count: 0
        })),
        ...selectedTourLeaders.map(tlId => ({
          trip_id: selectedTripId,
          resource_type: 'tour_leader',
          resource_id: tlId,
          pickup_datetime: selectedTrip.departure_date,
          return_datetime: selectedTrip.return_date,
          status: 'scheduled',
          participant_count: 0
        }))
      ]

      const { error } = await supabase
        .from('resource_schedules')
        .insert(schedules)

      if (error) throw error

      onSave()

      // Reset form
      setSelectedTripId('')
      setSelectedBuses([])
      setSelectedDrivers([])
      setSelectedTourLeaders([])
    } catch (err) {
      console.error('Error saving schedules:', err)
      alert('Gagal menyimpan: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const busOptions = buses.map(b => ({
    value: b.id,
    label: `${b.bus_number} (${b.capacity} seats)`
  }))

  const driverOptions = drivers.map(d => ({
    value: d.id,
    label: d.name
  }))

  const tourLeaderOptions = tourLeaders.map(tl => ({
    value: tl.id,
    label: tl.name
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bulk Resource Assignment</h3>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} disabled={saving}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={saving || conflicts.length > 0 || !selectedTripId}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Simpan Semua
              </>
            )}
          </Button>
        </div>
      </div>

      <Alert>
        <AlertDescription className="text-sm">
          <strong>Cara cepat:</strong> Pilih 1 trip, lalu pilih multiple resources sekaligus. Jadwal akan dibuat otomatis berdasarkan tanggal trip.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Trip</Label>
          <Select value={selectedTripId} onValueChange={setSelectedTripId}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih trip..." />
            </SelectTrigger>
            <SelectContent>
              {trips.map(trip => (
                <SelectItem key={trip.id} value={trip.id}>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span>{trip.name}</span>
                    <span className="text-xs text-gray-500">
                      ({new Date(trip.departure_date).toLocaleDateString()})
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTrip && (
            <div className="text-xs text-gray-600 mt-1">
              📅 {new Date(selectedTrip.departure_date).toLocaleDateString()} - {new Date(selectedTrip.return_date).toLocaleDateString()}
            </div>
          )}
        </div>

        {selectedTripId && (
          <>
            {conflicts.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Konflik Terdeteksi!</div>
                  <div className="space-y-2 text-sm">
                    {conflicts.map((conflict, idx) => (
                      <div key={idx} className="border-l-2 border-red-400 pl-3">
                        <div className="font-medium">{conflict.resourceName}</div>
                        {conflict.conflicts.map((c: any, i: number) => (
                          <div key={i} className="text-xs text-red-700">
                            • Sudah dijadwalkan untuk "{c.trip_name}"
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Bus className="h-5 w-5 text-blue-600" />
                  <Label>Buses</Label>
                </div>
                <SimpleMultiSelect
                  options={busOptions}
                  selected={selectedBuses}
                  onChange={setSelectedBuses}
                  placeholder="Pilih bus..."
                />
                {selectedBuses.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedBuses.map(busId => {
                      const bus = buses.find(b => b.id === busId)
                      return bus ? (
                        <Badge key={busId} variant="secondary">
                          {bus.bus_number} ({bus.capacity} seats)
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <Label>Drivers</Label>
                </div>
                <SimpleMultiSelect
                  options={driverOptions}
                  selected={selectedDrivers}
                  onChange={setSelectedDrivers}
                  placeholder="Pilih driver..."
                />
                {selectedDrivers.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedDrivers.map(driverId => {
                      const driver = drivers.find(d => d.id === driverId)
                      return driver ? (
                        <Badge key={driverId} variant="secondary">
                          {driver.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  <Label>Tour Leaders</Label>
                </div>
                <SimpleMultiSelect
                  options={tourLeaderOptions}
                  selected={selectedTourLeaders}
                  onChange={setSelectedTourLeaders}
                  placeholder="Pilih tour leader..."
                />
                {selectedTourLeaders.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedTourLeaders.map(tlId => {
                      const tl = tourLeaders.find(t => t.id === tlId)
                      return tl ? (
                        <Badge key={tlId} variant="secondary">
                          {tl.name}
                        </Badge>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            </div>

            {checkingConflicts && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Memeriksa konflik jadwal...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
