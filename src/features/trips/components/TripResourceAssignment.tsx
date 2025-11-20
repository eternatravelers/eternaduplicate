import React, { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SimpleMultiSelect } from '@/components/ui/simple-multi-select'
import { Bus, UserCheck, Users, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface TripResourceAssignmentProps {
  tripId: string
  departureDate: string
  returnDate: string
  buses: Array<{ id: string; bus_number: string; capacity: number }>
  drivers: Array<{ id: string; name: string }>
  tourLeaders: Array<{ id: string; name: string }>
  onSave?: () => void
}

interface ConflictInfo {
  resourceType: string
  resourceId: string
  resourceName: string
  conflicts: Array<{
    trip_name: string
    pickup_datetime: string
    return_datetime: string
  }>
}

export function TripResourceAssignment({
  tripId,
  departureDate,
  returnDate,
  buses,
  drivers,
  tourLeaders,
  onSave
}: TripResourceAssignmentProps) {
  const [selectedBuses, setSelectedBuses] = useState<string[]>([])
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([])
  const [selectedTourLeaders, setSelectedTourLeaders] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [conflicts, setConflicts] = useState<ConflictInfo[]>([])
  const [checkingConflicts, setCheckingConflicts] = useState(false)

  useEffect(() => {
    loadCurrentAssignments()
  }, [tripId])

  const loadCurrentAssignments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('resource_schedules')
        .select('resource_type, resource_id')
        .eq('trip_id', tripId)
        .in('status', ['scheduled', 'confirmed', 'in_progress'])

      if (error) throw error

      if (data) {
        setSelectedBuses(data.filter(r => r.resource_type === 'bus').map(r => r.resource_id))
        setSelectedDrivers(data.filter(r => r.resource_type === 'driver').map(r => r.resource_id))
        setSelectedTourLeaders(data.filter(r => r.resource_type === 'tour_leader').map(r => r.resource_id))
      }
    } catch (err) {
      console.error('Error loading assignments:', err)
    } finally {
      setLoading(false)
    }
  }

  const checkConflicts = async () => {
    if (!departureDate || !returnDate) return

    try {
      setCheckingConflicts(true)
      setConflicts([])

      const allResources = [
        ...selectedBuses.map(id => ({ type: 'bus', id, name: buses.find(b => b.id === id)?.bus_number || 'Unknown' })),
        ...selectedDrivers.map(id => ({ type: 'driver', id, name: drivers.find(d => d.id === id)?.name || 'Unknown' })),
        ...selectedTourLeaders.map(id => ({ type: 'tour_leader', id, name: tourLeaders.find(tl => tl.id === id)?.name || 'Unknown' }))
      ]

      const conflictResults: ConflictInfo[] = []

      for (const resource of allResources) {
        // Query existing schedules
        let query = supabase
          .from('resource_schedules')
          .select('id, trip_id, pickup_datetime, return_datetime, status')
          .eq('resource_type', resource.type)
          .eq('resource_id', resource.id)
          .in('status', ['scheduled', 'confirmed', 'in_progress'])
          .neq('trip_id', tripId)

        const { data: existingSchedules, error } = await query

        if (error) {
          console.error('Error checking conflicts:', error)
          continue
        }

        if (!existingSchedules) continue

        // Check for time overlaps
        const pickupTime = new Date(departureDate).getTime()
        const returnTime = new Date(returnDate).getTime()

        const resourceConflicts = existingSchedules.filter(schedule => {
          const schedulePickup = new Date(schedule.pickup_datetime).getTime()
          const scheduleReturn = new Date(schedule.return_datetime).getTime()
          return (pickupTime < scheduleReturn && returnTime > schedulePickup)
        })

        if (resourceConflicts.length > 0) {
          // Fetch trip names
          const tripIds = resourceConflicts.map(c => c.trip_id)
          const { data: trips } = await supabase
            .from('trips')
            .select('id, name')
            .in('id', tripIds)

          conflictResults.push({
            resourceType: resource.type,
            resourceId: resource.id,
            resourceName: resource.name,
            conflicts: resourceConflicts.map(conflict => {
              const trip = trips?.find(t => t.id === conflict.trip_id)
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

  useEffect(() => {
    if (selectedBuses.length > 0 || selectedDrivers.length > 0 || selectedTourLeaders.length > 0) {
      checkConflicts()
    } else {
      setConflicts([])
    }
  }, [selectedBuses, selectedDrivers, selectedTourLeaders, departureDate, returnDate])

  const handleSave = async () => {
    if (!departureDate || !returnDate) {
      alert('Tanggal keberangkatan dan kepulangan harus diisi')
      return
    }

    try {
      setSaving(true)

      // Delete existing schedules for this trip
      await supabase
        .from('resource_schedules')
        .delete()
        .eq('trip_id', tripId)

      // Create new schedules
      const schedules = [
        ...selectedBuses.map(busId => ({
          trip_id: tripId,
          resource_type: 'bus',
          resource_id: busId,
          pickup_datetime: departureDate,
          return_datetime: returnDate,
          status: 'scheduled',
          participant_count: 0
        })),
        ...selectedDrivers.map(driverId => ({
          trip_id: tripId,
          resource_type: 'driver',
          resource_id: driverId,
          pickup_datetime: departureDate,
          return_datetime: returnDate,
          status: 'scheduled',
          participant_count: 0
        })),
        ...selectedTourLeaders.map(tlId => ({
          trip_id: tripId,
          resource_type: 'tour_leader',
          resource_id: tlId,
          pickup_datetime: departureDate,
          return_datetime: returnDate,
          status: 'scheduled',
          participant_count: 0
        }))
      ]

      if (schedules.length > 0) {
        const { error } = await supabase
          .from('resource_schedules')
          .insert(schedules)

        if (error) throw error
      }

      onSave?.()
    } catch (err) {
      console.error('Error saving assignments:', err)
      alert('Gagal menyimpan assignment: ' + (err instanceof Error ? err.message : 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    )
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

  const hasChanges = true // Could track actual changes if needed

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Resource Assignment</h3>
        <Button
          onClick={handleSave}
          disabled={saving || conflicts.length > 0}
          size="sm"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Simpan Resource
            </>
          )}
        </Button>
      </div>

      {conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="font-semibold mb-2">Konflik Terdeteksi!</div>
            <div className="space-y-2 text-sm">
              {conflicts.map((conflict, idx) => (
                <div key={idx} className="border-l-2 border-red-400 pl-3">
                  <div className="font-medium">{conflict.resourceName}</div>
                  {conflict.conflicts.map((c, i) => (
                    <div key={i} className="text-xs text-red-700">
                      • Sudah dijadwalkan untuk "{c.trip_name}"
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-2 text-sm">
              Hapus resource yang konflik atau pilih resource lain.
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

      <Alert>
        <AlertDescription className="text-sm text-gray-600">
          Resource akan dijadwalkan otomatis dari <strong>{departureDate}</strong> sampai <strong>{returnDate}</strong>
        </AlertDescription>
      </Alert>
    </div>
  )
}
