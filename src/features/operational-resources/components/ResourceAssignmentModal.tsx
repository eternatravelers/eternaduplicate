import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, Users, Bus, UserCheck, Calendar, AlertCircle } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'

interface ResourceAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  trips: any[]
  tourLeaders: any[]
  buses: any[]
  drivers: any[]
  onAssign: (tripId: string, assignments: any) => Promise<void>
  assigning: boolean
}

export function ResourceAssignmentModal({
  isOpen,
  onClose,
  trips,
  tourLeaders,
  buses,
  drivers,
  onAssign,
  assigning
}: ResourceAssignmentModalProps) {
  const [selectedTripId, setSelectedTripId] = useState('')
  const [selectedTourLeaders, setSelectedTourLeaders] = useState<string[]>([])
  const [selectedBuses, setSelectedBuses] = useState<string[]>([])
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  const selectedTrip = trips.find(trip => trip.id === selectedTripId)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTripId('')
      setSelectedTourLeaders([])
      setSelectedBuses([])
      setSelectedDrivers([])
      setError(null)
    }
  }, [isOpen])

  // Load existing assignments when trip is selected
  useEffect(() => {
    if (selectedTrip) {
      setSelectedTourLeaders(selectedTrip.tour_leaders?.map((tl: any) => tl.id) || [])
      setSelectedBuses(selectedTrip.buses?.map((bus: any) => bus.id) || [])
      setSelectedDrivers(selectedTrip.drivers?.map((driver: any) => driver.id) || [])
    }
  }, [selectedTrip])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedTripId) {
      setError('Pilih trip terlebih dahulu')
      return
    }

    try {
      setError(null)
      await onAssign(selectedTripId, {
        tour_leader_ids: selectedTourLeaders,
        bus_ids: selectedBuses,
        driver_ids: selectedDrivers
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const toggleSelection = (id: string, currentList: string[], setter: (list: string[]) => void) => {
    if (currentList.includes(id)) {
      setter(currentList.filter(item => item !== id))
    } else {
      setter([...currentList, id])
    }
  }

  const getAvailableResources = (resourceType: 'tourLeaders' | 'buses' | 'drivers') => {
    const resources = resourceType === 'tourLeaders' ? tourLeaders : 
                    resourceType === 'buses' ? buses : drivers
    
    return resources.filter((resource: any) => resource.status === 'active')
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Assignment Sumber Daya ke Trip</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Trip Selection */}
          <div className="space-y-2">
            <Label htmlFor="trip_select">Pilih Trip</Label>
            <Select value={selectedTripId} onValueChange={setSelectedTripId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih trip untuk assignment..." />
              </SelectTrigger>
              <SelectContent>
                {trips.filter(trip => trip.status === 'active').map(trip => (
                  <SelectItem key={trip.id} value={trip.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{trip.name}</span>
                      <Badge variant="outline" className="ml-2">
                        {formatShortDate(trip.departure_date)}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Trip Info */}
          {selectedTrip && (
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-blue-800 flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{selectedTrip.name}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Keberangkatan:</span>
                    <div className="font-medium">{formatShortDate(selectedTrip.departure_date)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Kepulangan:</span>
                    <div className="font-medium">{formatShortDate(selectedTrip.return_date)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Quota:</span>
                    <div className="font-medium">{selectedTrip.quota} orang</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Meeting Point:</span>
                    <div className="font-medium">{selectedTrip.meeting_point}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {selectedTripId && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Tour Leaders Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-purple-700">
                    <UserCheck className="h-4 w-4" />
                    <span>Tour Leaders</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {getAvailableResources('tourLeaders').map((tourLeader: any) => (
                      <div
                        key={tourLeader.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedTourLeaders.includes(tourLeader.id)
                            ? 'bg-purple-50 border-purple-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleSelection(tourLeader.id, selectedTourLeaders, setSelectedTourLeaders)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{tourLeader.name}</div>
                            <div className="text-xs text-gray-500">
                              {tourLeader.experience_years} tahun pengalaman
                            </div>
                            {tourLeader.specialization && (
                              <div className="text-xs text-purple-600">{tourLeader.specialization}</div>
                            )}
                          </div>
                          {selectedTourLeaders.includes(tourLeader.id) && (
                            <div className="w-4 h-4 bg-purple-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedTourLeaders.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-gray-600">
                        {selectedTourLeaders.length} tour leader dipilih
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Buses Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-700">
                    <Bus className="h-4 w-4" />
                    <span>Kendaraan</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {getAvailableResources('buses').map((bus: any) => (
                      <div
                        key={bus.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedBuses.includes(bus.id)
                            ? 'bg-blue-50 border-blue-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleSelection(bus.id, selectedBuses, setSelectedBuses)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{bus.plate_number}</div>
                            <div className="text-xs text-gray-500">
                              {bus.model || 'N/A'} - {bus.capacity || 0} kursi
                            </div>
                          </div>
                          {selectedBuses.includes(bus.id) && (
                            <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedBuses.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-gray-600">
                        {selectedBuses.length} kendaraan dipilih
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Drivers Assignment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-700">
                    <UserCheck className="h-4 w-4" />
                    <span>Driver</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {getAvailableResources('drivers').map((driver: any) => (
                      <div
                        key={driver.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedDrivers.includes(driver.id)
                            ? 'bg-green-50 border-green-200'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => toggleSelection(driver.id, selectedDrivers, setSelectedDrivers)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{driver.name}</div>
                            <div className="text-xs text-gray-500">
                              SIM: {driver.license_number || 'N/A'}
                            </div>
                            {driver.phone && (
                              <div className="text-xs text-green-600">{driver.phone}</div>
                            )}
                          </div>
                          {selectedDrivers.includes(driver.id) && (
                            <div className="w-4 h-4 bg-green-600 rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {selectedDrivers.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-xs text-gray-600">
                        {selectedDrivers.length} driver dipilih
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={!selectedTripId || assigning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {assigning ? 'Menyimpan Assignment...' : 'Simpan Assignment'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}