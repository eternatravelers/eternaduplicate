import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, MapPin, Edit2, Trash2, Bus, UserCheck, Users } from 'lucide-react'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface ResourceScheduleTimelineProps {
  schedules: any[]
  onEdit: (schedule: any) => void
  onDelete: (scheduleId: string) => void
  resourceType?: string
  groupBy?: 'date' | 'resource' | 'trip'
}

export function ResourceScheduleTimeline({
  schedules,
  onEdit,
  onDelete,
  resourceType,
  groupBy = 'date'
}: ResourceScheduleTimelineProps) {

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-300'
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-300'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'bus': return <Bus className="h-4 w-4" />
      case 'driver': return <UserCheck className="h-4 w-4" />
      case 'tour_leader': return <Users className="h-4 w-4" />
      default: return null
    }
  }

  const getResourceLabel = (type: string) => {
    switch (type) {
      case 'bus': return 'Bus'
      case 'driver': return 'Driver'
      case 'tour_leader': return 'Tour Leader'
      default: return type
    }
  }

  const getResourceName = (schedule: any) => {
    if (schedule.resource_type === 'bus') {
      return schedule.buses?.plate_number || 'N/A'
    } else if (schedule.resource_type === 'driver') {
      return schedule.drivers?.name || 'N/A'
    } else if (schedule.resource_type === 'tour_leader') {
      return schedule.tour_leaders?.name || 'N/A'
    }
    return 'N/A'
  }

  const groupSchedules = () => {
    if (groupBy === 'date') {
      const grouped = schedules.reduce((acc, schedule) => {
        const date = format(new Date(schedule.pickup_datetime), 'yyyy-MM-dd')
        if (!acc[date]) acc[date] = []
        acc[date].push(schedule)
        return acc
      }, {} as Record<string, any[]>)
      return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))
    } else if (groupBy === 'resource') {
      const grouped = schedules.reduce((acc, schedule) => {
        const key = `${schedule.resource_type}-${schedule.resource_id}`
        if (!acc[key]) acc[key] = []
        acc[key].push(schedule)
        return acc
      }, {} as Record<string, any[]>)
      return Object.entries(grouped)
    } else {
      const grouped = schedules.reduce((acc, schedule) => {
        const tripName = schedule.trips?.name || 'N/A'
        if (!acc[tripName]) acc[tripName] = []
        acc[tripName].push(schedule)
        return acc
      }, {} as Record<string, any[]>)
      return Object.entries(grouped)
    }
  }

  const groupedSchedules = groupSchedules()

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Belum ada jadwal resource</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {groupedSchedules.map(([groupKey, groupSchedules]) => (
        <Card key={groupKey}>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">
              {groupBy === 'date' && format(new Date(groupKey), 'EEEE, dd MMMM yyyy', { locale: idLocale })}
              {groupBy === 'resource' && getResourceName(groupSchedules[0])}
              {groupBy === 'trip' && groupKey}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupSchedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {getResourceIcon(schedule.resource_type)}
                          <span className="font-semibold">
                            {getResourceLabel(schedule.resource_type)}:
                          </span>
                          <span>{getResourceName(schedule)}</span>
                        </div>
                        <Badge className={getStatusColor(schedule.status)}>
                          {schedule.status}
                        </Badge>
                      </div>

                      <div className="text-sm space-y-1">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="font-medium">Trip:</span>
                          <span>{schedule.trips?.name || 'N/A'}</span>
                        </div>

                        {schedule.meeting_point_name && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span className="font-medium">Meeting Point:</span>
                            <span>{schedule.meeting_point_name}</span>
                          </div>
                        )}

                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Penjemputan:</span>
                          <span>
                            {format(new Date(schedule.pickup_datetime), 'HH:mm', { locale: idLocale })}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">Kepulangan:</span>
                          <span>
                            {format(new Date(schedule.return_datetime), 'dd MMM HH:mm', { locale: idLocale })}
                          </span>
                        </div>

                        {schedule.resource_type === 'bus' && schedule.capacity_allocated > 0 && (
                          <div className="flex items-center space-x-2 text-gray-600">
                            <Users className="h-4 w-4" />
                            <span className="font-medium">Kapasitas Terisi:</span>
                            <span>{schedule.capacity_allocated} / {schedule.buses?.capacity || 0} kursi</span>
                          </div>
                        )}

                        {schedule.notes && (
                          <div className="text-sm text-gray-500 mt-2 italic">
                            {schedule.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(schedule)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onDelete(schedule.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
