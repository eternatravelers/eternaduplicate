import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Edit, Trash2, Copy, Users, MapPin, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface TripListTableProps {
  trips: any[]
  onEdit: (trip: any) => void
  onDuplicate: (trip: any) => void
  onDelete: (id: string) => void
  onViewParticipants: (trip: any) => void
  isSuperAdmin: boolean
  deleting: boolean
}

export function TripListTable({
  trips,
  onEdit,
  onDuplicate,
  onDelete,
  onViewParticipants,
  isSuperAdmin,
  deleting
}: TripListTableProps) {
  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    }
    return statusColors[status as keyof typeof statusColors] || statusColors.draft
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Trips</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Trip Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Departure</TableHead>
              <TableHead>Return</TableHead>
              <TableHead>Quota</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Cost Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Meeting Points</TableHead>
              <TableHead>Kendaraan</TableHead>
              <TableHead>Driver</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell className="font-medium">{trip.name}</TableCell>
                <TableCell>{trip.trip_type}</TableCell>
                <TableCell>{formatDate(trip.departure_date)}</TableCell>
                <TableCell>{formatDate(trip.return_date)}</TableCell>
                <TableCell>{trip.quota}</TableCell>
                <TableCell>{formatCurrency(trip.price || 0)}</TableCell>
                <TableCell>
                  {trip.cost_plans ? (
                    <div className="text-sm">
                      <div className="font-medium text-green-600">{trip.cost_plans.name}</div>
                      <div className="text-gray-500">
                        {formatCurrency(trip.cost_plans.cost_per_person || 0)}/orang
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadge(trip.status)}>
                    {trip.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {trip.meeting_point_ids && trip.meeting_point_ids.length > 0 ? (
                    <div className="flex items-center space-x-1">
                      <MapPin className="h-4 w-4 text-green-600" />
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        {trip.meeting_point_ids.length} Points
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-gray-500">Belum ada</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {trip.buses && trip.buses.length > 0 ? (
                    <div className="text-sm">
                      {trip.buses.map((bus: any, index: number) => (
                        <div key={bus.id} className={index > 0 ? 'mt-1 pt-1 border-t' : ''}>
                          <div className="font-medium">{bus.plate_number}</div>
                          <div className="text-gray-500">{bus.model || 'N/A'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">Belum ditentukan</span>
                  )}
                </TableCell>
                <TableCell>
                  {trip.drivers && trip.drivers.length > 0 ? (
                    <div className="text-sm">
                      {trip.drivers.map((driver: any, index: number) => (
                        <div key={driver.id} className={index > 0 ? 'mt-1 pt-1 border-t' : ''}>
                          <div className="font-medium">{driver.name}</div>
                          <div className="text-gray-500">{driver.phone || 'N/A'}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-gray-400">Belum ditentukan</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(trip)}
                      title="Edit Trip"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewParticipants(trip)}
                      title="Lihat Peserta"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDuplicate(trip)}
                      title="Duplicate Trip"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    {isSuperAdmin && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" title="Delete Trip">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete this trip? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => onDelete(trip.id)}
                              disabled={deleting}
                            >
                              {deleting ? 'Deleting...' : 'Delete'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}