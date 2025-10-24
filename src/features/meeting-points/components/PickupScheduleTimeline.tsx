import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react'
import { usePickupSchedules, useDeletePickupSchedule } from '@/hooks/usePickupSchedules'

interface PickupScheduleTimelineProps {
  tripId: string
  onEdit: (schedule: any) => void
  onRefresh: () => void
}

export function PickupScheduleTimeline({
  tripId,
  onEdit,
  onRefresh
}: PickupScheduleTimelineProps) {
  const { schedules, loading } = usePickupSchedules(tripId)
  const { deleteSchedule, loading: deleting } = useDeletePickupSchedule()

  const handleDelete = async (scheduleId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal penjemputan ini?')) {
      return
    }

    const { error } = await deleteSchedule(scheduleId)
    if (!error) {
      onRefresh()
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge className="bg-blue-100 text-blue-800">
            <Clock className="h-3 w-3 mr-1" />
            Terjadwal
          </Badge>
        )
      case 'in_progress':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Clock className="h-3 w-3 mr-1" />
            Berlangsung
          </Badge>
        )
      case 'completed':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Selesai
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Dibatalkan
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-'
    return timeString.substring(0, 5)
  }

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-gray-500">
          <Clock className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium mb-2">Belum ada jadwal penjemputan</h3>
          <p className="text-sm">
            Klik "Atur Jadwal Penjemputan" pada meeting point untuk membuat jadwal
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-blue-600" />
          <span>Timeline Penjemputan</span>
          <Badge variant="outline">{schedules.length} jadwal</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {schedules.map((schedule, index) => (
            <div
              key={schedule.id}
              className="relative border rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              {index < schedules.length - 1 && (
                <div className="absolute left-6 top-full h-4 w-0.5 bg-gray-300" />
              )}

              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {schedule.meeting_point_name}
                      </h4>
                      {getStatusBadge(schedule.status)}
                    </div>

                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">
                          {formatTime(schedule.pickup_time)}
                        </span>
                        <span className="text-gray-400">•</span>
                        <span>{schedule.estimated_duration} menit</span>
                      </div>

                      {schedule.notes && (
                        <div className="text-xs text-gray-500 mt-2 pl-6">
                          {schedule.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(schedule)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(schedule.id)}
                    disabled={deleting}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
