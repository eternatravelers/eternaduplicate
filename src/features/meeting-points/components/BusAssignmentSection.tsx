import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card } from '@/components/ui/card'
import { Bus, Plus, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import {
  useAssignBusToMeetingPoint,
  useRemoveBusFromMeetingPoint,
  useGetMeetingPointBuses
} from '@/hooks/useMeetingPointBusesDrivers'

interface BusAssignmentSectionProps {
  assignmentId: string
  participantCount: number
  availableBuses: any[]
  onBusesChange?: () => void
}

export function BusAssignmentSection({
  assignmentId,
  participantCount,
  availableBuses,
  onBusesChange
}: BusAssignmentSectionProps) {
  const [selectedBusId, setSelectedBusId] = useState<string>('')
  const [assignedBuses, setAssignedBuses] = useState<any[]>([])
  const [totalCapacity, setTotalCapacity] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const { fetchBuses } = useGetMeetingPointBuses()
  const { assignBus, loading: assigning } = useAssignBusToMeetingPoint()
  const { removeBus, loading: removing } = useRemoveBusFromMeetingPoint()

  useEffect(() => {
    if (assignmentId) {
      loadAssignedBuses()
    }
  }, [assignmentId])

  const loadAssignedBuses = async () => {
    const buses = await fetchBuses(assignmentId)
    setAssignedBuses(buses)
    const capacity = buses.reduce((sum, b) => sum + (b.assigned_capacity || 0), 0)
    setTotalCapacity(capacity)
  }

  const handleAddBus = async () => {
    if (!selectedBusId) {
      setError('Silakan pilih bus terlebih dahulu')
      return
    }

    const selectedBus = availableBuses.find(b => b.id === selectedBusId)
    if (!selectedBus) {
      setError('Bus tidak ditemukan')
      return
    }

    const { error: assignError } = await assignBus(assignmentId, selectedBusId, selectedBus.capacity)
    if (assignError) {
      setError(assignError)
    } else {
      setSelectedBusId('')
      setError(null)
      await loadAssignedBuses()
      onBusesChange?.()
    }
  }

  const handleRemoveBus = async (busAssignmentId: string, capacity: number) => {
    const { error: removeError } = await removeBus(busAssignmentId, assignmentId, capacity)
    if (removeError) {
      setError(removeError)
    } else {
      await loadAssignedBuses()
      onBusesChange?.()
    }
  }

  const isCapacitySufficient = totalCapacity >= participantCount
  const availableBusOptions = availableBuses.filter(
    b => !assignedBuses.some(ab => ab.buses?.id === b.id)
  )

  if (!assignmentId) {
    return (
      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
        Simpan assignment terlebih dahulu untuk mengelola bus
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="flex items-center space-x-2">
          <Bus className="h-4 w-4 text-blue-600" />
          <span>Bus yang Ditugaskan</span>
        </Label>
        <div className="text-sm text-gray-600">
          Total Kapasitas: {totalCapacity} kursi / Kebutuhan: {participantCount} kursi
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        </div>
      )}

      {assignedBuses.length > 0 ? (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {assignedBuses.map((busAssign) => (
            <Card key={busAssign.id} className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm text-gray-900">
                    {busAssign.buses?.bus_number} - {busAssign.buses?.type}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    Plat: {busAssign.buses?.plate_number} • Kapasitas: {busAssign.assigned_capacity} kursi
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveBus(busAssign.id, busAssign.assigned_capacity)}
                  disabled={removing}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600">
          Belum ada bus yang di-assign
        </div>
      )}

      {availableBusOptions.length > 0 && (
        <div className="p-3 border-t pt-4 space-y-2">
          <Label htmlFor="bus-select" className="text-sm">Tambah Bus Lagi</Label>
          <div className="flex space-x-2">
            <Select value={selectedBusId} onValueChange={setSelectedBusId}>
              <SelectTrigger id="bus-select" className="flex-1">
                <SelectValue placeholder="Pilih bus..." />
              </SelectTrigger>
              <SelectContent>
                {availableBusOptions.map(bus => (
                  <SelectItem key={bus.id} value={bus.id}>
                    {bus.bus_number} - {bus.type} ({bus.capacity} kursi)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleAddBus}
              disabled={assigning || !selectedBusId}
              className="bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className={`p-3 rounded-lg border ${
        isCapacitySufficient
          ? 'bg-green-50 border-green-200'
          : 'bg-orange-50 border-orange-200'
      }`}>
        <div className="flex items-center space-x-2">
          {isCapacitySufficient ? (
            <>
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div className="text-sm text-green-900">
                Kapasitas cukup untuk {participantCount} peserta
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div className="text-sm text-orange-900">
                Kurang {participantCount - totalCapacity} kursi
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
