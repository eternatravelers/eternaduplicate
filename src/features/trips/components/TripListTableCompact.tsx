import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { Activity, Users, MoreVertical, Edit, Copy, Bus, Trash2, MapPin, CheckCircle2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

interface TripListTableCompactProps {
  trips: any[]
  onEdit: (trip: any) => void
  onDuplicate: (trip: any) => void
  onDelete: (id: string) => void
  onViewParticipants: (trip: any) => void
  onViewResources?: (trip: any) => void
  onViewReadiness?: (trip: any) => void
  onNavigateToResourceScheduling?: (tripId: string) => void
  isAdmin: boolean
  deleting: boolean
}

export function TripListTableCompact({
  trips,
  onEdit,
  onDuplicate,
  onDelete,
  onViewParticipants,
  onViewResources,
  onViewReadiness,
  onNavigateToResourceScheduling,
  isAdmin,
  deleting
}: TripListTableCompactProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [tripToDelete, setTripToDelete] = React.useState<string | null>(null)

  const getStatusBadge = (status: string, departureDate?: string) => {
    if (departureDate) {
      const departure = new Date(departureDate)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      departure.setHours(0, 0, 0, 0)
      if (departure < today && !['completed', 'cancelled'].includes(status)) {
        return { color: 'bg-gray-100 text-gray-800', label: 'Selesai' }
      }
    }
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active' },
      open: { color: 'bg-green-100 text-green-800', label: 'Open' },
      confirmed: { color: 'bg-blue-100 text-blue-800', label: 'Confirmed' },
      ongoing: { color: 'bg-orange-100 text-orange-800', label: 'Ongoing' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Selesai' },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled' },
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft' }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
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

  const formatDateRange = (departure: string, returnDate: string) => {
    try {
      const depDate = new Date(departure)
      const retDate = new Date(returnDate)
      const depFormatted = format(depDate, 'dd MMM')
      const retFormatted = format(retDate, 'dd MMM yyyy')
      return `${depFormatted} - ${retFormatted}`
    } catch {
      return 'Invalid date'
    }
  }

  const handleDeleteClick = (tripId: string) => {
    setTripToDelete(tripId)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (tripToDelete) {
      onDelete(tripToDelete)
      setDeleteDialogOpen(false)
      setTripToDelete(null)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Trips ({trips.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%]">Trip Info</TableHead>
                <TableHead>Status & Progress</TableHead>
                <TableHead>Resources</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => {
                const statusConfig = getStatusBadge(trip.status, trip.departure_date)
                const quotaPercentage = trip.quota
                  ? Math.round((trip.confirmed_participant_count || 0) / trip.quota * 100)
                  : 0

                return (
                  <TableRow key={trip.id}>
                    {/* Trip Info */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-semibold text-gray-900">{trip.name}</div>
                        <div className="text-xs text-gray-500">{trip.trip_type}</div>
                        <div className="text-xs text-gray-600">
                          {formatDateRange(trip.departure_date, trip.return_date)}
                        </div>
                      </div>
                    </TableCell>

                    {/* Status & Progress */}
                    <TableCell>
                      <div className="space-y-2">
                        <Badge className={statusConfig.color}>
                          {statusConfig.label}
                        </Badge>

                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3 text-gray-400" />
                          <Badge
                            variant="outline"
                            className={getQuotaBadgeColor(trip.confirmed_participant_count || 0, trip.quota || 0)}
                          >
                            {trip.confirmed_participant_count || 0}/{trip.quota || '-'}
                          </Badge>
                          <span className="text-xs text-gray-500">({quotaPercentage}%)</span>
                        </div>

                        <div
                          className="flex items-center gap-2 cursor-pointer hover:opacity-80"
                          onClick={() => onViewReadiness && onViewReadiness(trip)}
                        >
                          <CheckCircle2 className="h-3 w-3 text-gray-400" />
                          <Badge
                            variant="outline"
                            className={getReadinessBadgeColor(trip.readiness_score || 0)}
                          >
                            {trip.readiness_score || 0}% Ready
                          </Badge>
                        </div>
                      </div>
                    </TableCell>

                    {/* Resources */}
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs">
                          <MapPin className="h-3 w-3 text-blue-600" />
                          <span className="text-gray-600">
                            {trip.meeting_point_ids?.length || 0} Meeting Point{trip.meeting_point_ids?.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Bus className="h-3 w-3 text-green-600" />
                          <span className="text-gray-600">
                            {trip.buses?.length || 0} Bus{trip.buses?.length !== 1 ? 'es' : ''} •{' '}
                            {trip.drivers?.length || 0} Driver{trip.drivers?.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {trip.readiness_score >= 80 && (
                          <div className="text-xs text-green-600 font-medium">✓ Ready to Go</div>
                        )}
                      </div>
                    </TableCell>

                    {/* Price */}
                    <TableCell className="text-right">
                      <div className="font-semibold text-gray-900">
                        {formatCurrency(trip.price || 0)}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        {/* Primary Action - Readiness */}
                        {onViewReadiness && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onViewReadiness(trip)}
                            title="Status Kesiapan"
                            className="text-orange-600 hover:text-orange-700"
                          >
                            <Activity className="w-4 h-4" />
                          </Button>
                        )}

                        {/* Secondary Action - Participants */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewParticipants(trip)}
                          title="View Participants"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Users className="w-4 h-4" />
                        </Button>

                        {/* More Actions Dropdown */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onEdit(trip)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Trip
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDuplicate(trip)}>
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate Trip
                            </DropdownMenuItem>
                            {onViewResources && (
                              <DropdownMenuItem onClick={() => onViewResources(trip)}>
                                <Bus className="mr-2 h-4 w-4" />
                                View Resources
                              </DropdownMenuItem>
                            )}
                            {isAdmin && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteClick(trip.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete Trip
                                </DropdownMenuItem>
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {trips.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-5xl mb-3">📭</div>
              <div className="text-lg font-semibold text-gray-600">No trips found</div>
              <div className="text-sm text-gray-500 mt-1">
                Try adjusting your filters or create a new trip
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
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
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
