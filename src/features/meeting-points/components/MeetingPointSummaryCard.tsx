import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Bus, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import type { MeetingPointSummary } from '@/hooks/useMeetingPointSummary'

interface MeetingPointSummaryCardProps {
  summary: MeetingPointSummary
  onSchedulePickup: (meetingPointName: string) => void
  onAssignTransport: (meetingPointName: string) => void
  onViewParticipants: (meetingPointName: string) => void
}

export function MeetingPointSummaryCard({
  summary,
  onSchedulePickup,
  onAssignTransport,
  onViewParticipants
}: MeetingPointSummaryCardProps) {
  const getStatusColor = () => {
    if (summary.has_pickup_schedule && summary.has_transportation_assigned) {
      return 'bg-green-50 border-green-200'
    }
    if (summary.has_pickup_schedule || summary.has_transportation_assigned) {
      return 'bg-yellow-50 border-yellow-200'
    }
    return 'bg-gray-50 border-gray-200'
  }

  const getStatusIcon = () => {
    if (summary.has_pickup_schedule && summary.has_transportation_assigned) {
      return <CheckCircle2 className="h-5 w-5 text-green-600" />
    }
    return <AlertCircle className="h-5 w-5 text-orange-600" />
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow ${getStatusColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">{summary.meeting_point_name}</CardTitle>
          </div>
          {getStatusIcon()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-600">Total Peserta</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {summary.participant_count}
            </div>
            <div className="text-xs text-gray-500">
              dari {summary.registration_count} registrasi
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Bus className="h-4 w-4 text-gray-500" />
              <span className="text-xs text-gray-600">Status</span>
            </div>
            <div className="space-y-1 mt-1">
              <Badge
                variant={summary.has_pickup_schedule ? 'default' : 'outline'}
                className={`text-xs ${summary.has_pickup_schedule ? 'bg-green-100 text-green-800' : ''}`}
              >
                <Clock className="h-3 w-3 mr-1" />
                {summary.has_pickup_schedule ? 'Terjadwal' : 'Belum dijadwalkan'}
              </Badge>
              <Badge
                variant={summary.has_transportation_assigned ? 'default' : 'outline'}
                className={`text-xs ${summary.has_transportation_assigned ? 'bg-blue-100 text-blue-800' : ''}`}
              >
                <Bus className="h-3 w-3 mr-1" />
                {summary.has_transportation_assigned ? 'Bus assigned' : 'Belum ada bus'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex flex-col space-y-2 pt-2 border-t">
          <Button
            size="sm"
            variant="outline"
            className="w-full justify-start"
            onClick={() => onViewParticipants(summary.meeting_point_name)}
          >
            <Users className="h-4 w-4 mr-2" />
            Lihat Daftar Peserta
          </Button>

          {!summary.has_pickup_schedule && (
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start text-orange-600 hover:text-orange-700"
              onClick={() => onSchedulePickup(summary.meeting_point_name)}
            >
              <Clock className="h-4 w-4 mr-2" />
              Atur Jadwal Penjemputan
            </Button>
          )}

          {!summary.has_transportation_assigned && (
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start text-blue-600 hover:text-blue-700"
              onClick={() => onAssignTransport(summary.meeting_point_name)}
            >
              <Bus className="h-4 w-4 mr-2" />
              Assign Bus & Driver
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
