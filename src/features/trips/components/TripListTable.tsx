import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Edit, Trash2, Copy, Users, MapPin, AlertTriangle, Settings, CheckCircle2 } from 'lucide-react'
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
      open: 'bg-green-100 text-green-800',
      confirmed: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-orange-100 text-orange-800',
      completed: 'bg-purple-100 text-purple-800',
      cancelled: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    }
    return statusColors[status as keyof typeof statusColors] || statusColors.draft
  }

  const getQuotaBadgeColor = (confirmed: number, quota: number) => {
    if (!quota) return 'bg-gray-100 text-gray-700'
    const percentage = (confirmed / quota) * 100
    if (percentage >= 80) return 'bg-green-100 text-green-700'
    if (percentage >= 50) return 'bg-orange-100 text-orange-700'
    if (percentage > 0) return 'bg-yellow-100 text-yellow-700'
    return 'bg-gray-100 text-gray-700'
  }

  const getReadinessBadgeColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-700 border-green-300'
    if (score >= 50) return 'bg-orange-100 text-orange-700 border-orange-300'
    return 'bg-red-100 text-red-700 border-red-300'
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
              <TableHead>Status</TableHead>
              <TableHead>Quota Peserta</TableHead>
              <TableHead>Kesiapan</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Meeting Points</TableHead>
              <TableHead>Transport</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trips.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell className="font-medium">
                  <div>{trip.name}</div>
                  <div className="text-xs text-gray-500 mt-1">{trip.trip_type}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {trip.trip_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-medium">{formatDate(trip.departure_date)}</div>
                    <div className="text-xs text-gray-500">s/d {formatDate(trip.return_date)}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={getStatusBadge(trip.status)}>
                    {trip.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Badge className={getQuotaBadgeColor(trip.confirmed_participant_count || 0, trip.quota || 0)}>
                      {trip.confirmed_participant_count || 0}/{trip.quota || '-'}
                    </Badge>
                    {trip.pending_participant_count > 0 && (
                      <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
                        +{trip.pending_participant_count} pending
                      </Badge>
                    )}
                  </div>
                  {trip.available_quota !== null && trip.available_quota !== undefined && (
                    <div className="text-xs text-gray-500 mt-1">
                      Sisa: {trip.available_quota} seat
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getReadinessBadgeColor(trip.readiness_score || 0)}>
                    {trip.readiness_score || 0}%
                  </Badge>
                  {!trip.can_accept_registrations && trip.status === 'open' && (
                    <div className="text-xs text-red-600 mt-1">Pendaftaran ditutup</div>
                  )}
                </TableCell>
                <TableCell>{formatCurrency(trip.price || 0)}</TableCell>
                <TableCell>
                  {trip.meeting_point_ids && trip.meeting_point_ids.length > 0 ? (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {trip.meeting_point_ids.length} Points
                        </Badge>
                      </div>
                      {(() => {
                        const totalMeetingPoints = trip.meeting_point_ids.length
                        const assignedCount = trip.meeting_point_assignment_count || 0
                        const percentage = totalMeetingPoints > 0 ? Math.round((assignedCount / totalMeetingPoints) * 100) : 0

                        return (
                          <div className="text-xs text-gray-600">
                            {assignedCount}/{totalMeetingPoints} assigned ({percentage}%)
                          </div>
                        )
                      })()}
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <span className="text-xs text-gray-500">Belum ada</span>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    {trip.buses && trip.buses.length > 0 ? (
                      <div className="flex items-center space-x-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium">{trip.buses.length} Bus</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-gray-500">No bus</span>
                      </div>
                    )}
                    {trip.drivers && trip.drivers.length > 0 ? (
                      <div className="flex items-center space-x-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium">{trip.drivers.length} Driver</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-gray-500">No driver</span>
                      </div>
                    )}
                    {trip.tour_leaders && trip.tour_leaders.length > 0 ? (
                      <div className="flex items-center space-x-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        <span className="text-xs font-medium">{trip.tour_leaders.length} TL</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                        <span className="text-xs text-gray-500">No TL</span>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => onEdit(trip)}
                      title="Manage Trip Operations"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Settings className="w-4 h-4 mr-1" />
                      Manage
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