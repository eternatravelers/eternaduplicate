import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MapPin, Calendar, Users } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'

interface AssignedTripsModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  assignedTrips: Array<{
    id: string
    name: string
    departure_date: string
    return_date?: string
    status: string
    quota?: number
    participant_count?: number
  }>
  resourceName: string
  resourceType: 'Tour Leader' | 'Bus' | 'Driver'
}

export function AssignedTripsModal({
  isOpen,
  onClose,
  title,
  assignedTrips,
  resourceName,
  resourceType
}: AssignedTripsModalProps) {
  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    }
    return statusColors[status as keyof typeof statusColors] || statusColors.draft
  }

  const getTripTypeIcon = () => {
    switch (resourceType) {
      case 'Tour Leader':
        return <Users className="h-4 w-4 text-purple-600" />
      case 'Bus':
        return <MapPin className="h-4 w-4 text-blue-600" />
      case 'Driver':
        return <Users className="h-4 w-4 text-green-600" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getTripTypeIcon()}
            <span>Trip Assignment - {resourceName}</span>
            <Badge variant="outline" className="ml-2">
              {assignedTrips.length} trip
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4">
          {assignedTrips.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <MapPin className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Belum ada trip yang di-assign</h3>
              <p className="text-sm">
                {resourceType} ini belum ditugaskan ke trip manapun
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-2">Ringkasan Assignment</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Trip:</span>
                    <div className="font-bold">{assignedTrips.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Trip Aktif:</span>
                    <div className="font-bold text-green-600">
                      {assignedTrips.filter(trip => trip.status === 'active').length}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Trip Selesai:</span>
                    <div className="font-bold text-blue-600">
                      {assignedTrips.filter(trip => trip.status === 'completed').length}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Trip Mendatang:</span>
                    <div className="font-bold text-purple-600">
                      {assignedTrips.filter(trip => {
                        const departureDate = new Date(trip.departure_date)
                        const today = new Date()
                        return trip.status === 'active' && departureDate > today
                      }).length}
                    </div>
                  </div>
                </div>
              </div>

              {/* Trips Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Trip</TableHead>
                    <TableHead>Tanggal Keberangkatan</TableHead>
                    <TableHead>Tanggal Kembali</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Peserta</TableHead>
                    <TableHead>Countdown</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedTrips.map((trip) => {
                    const departureDate = new Date(trip.departure_date)
                    const today = new Date()
                    const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                    
                    return (
                      <TableRow key={trip.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{trip.name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-4 w-4 text-blue-600" />
                            <span>{formatShortDate(trip.departure_date)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {trip.return_date ? (
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-purple-600" />
                              <span>{formatShortDate(trip.return_date)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadge(trip.status)}>
                            {trip.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {trip.quota && trip.participant_count !== undefined ? (
                            <div className="text-center">
                              <div className="font-medium">{trip.participant_count}/{trip.quota}</div>
                              <div className="text-xs text-gray-500">
                                {trip.quota > 0 ? Math.round((trip.participant_count / trip.quota) * 100) : 0}% terisi
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {trip.status === 'active' && daysUntilDeparture >= 0 ? (
                            <div className="text-center">
                              <div className={`font-medium ${
                                daysUntilDeparture <= 3 ? 'text-red-600' : 
                                daysUntilDeparture <= 7 ? 'text-orange-600' : 
                                'text-blue-600'
                              }`}>
                                {daysUntilDeparture === 0 ? 'Hari ini' : 
                                 daysUntilDeparture === 1 ? 'Besok' : 
                                 `${daysUntilDeparture} hari`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {daysUntilDeparture <= 3 ? 'Segera!' : 
                                 daysUntilDeparture <= 7 ? 'Minggu ini' : 
                                 'Akan datang'}
                              </div>
                            </div>
                          ) : trip.status === 'completed' ? (
                            <Badge variant="outline" className="text-gray-500">Selesai</Badge>
                          ) : daysUntilDeparture < 0 ? (
                            <Badge variant="outline" className="text-gray-500">Berlalu</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}