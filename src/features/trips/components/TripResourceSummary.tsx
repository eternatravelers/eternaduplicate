import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Bus, UserCheck, Users, Calendar, ExternalLink } from 'lucide-react'
import { useTripResourceSummary } from '@/hooks/useResourceSchedules'

interface TripResourceSummaryProps {
  tripId: string
  compact?: boolean
  onNavigateToScheduling?: () => void
}

export function TripResourceSummary({ tripId, compact = false, onNavigateToScheduling }: TripResourceSummaryProps) {
  const { summary, loading } = useTripResourceSummary(tripId)

  if (loading) {
    return <div className="text-xs text-gray-400">Loading...</div>
  }

  if (!summary || summary.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Not scheduled yet</span>
        {onNavigateToScheduling && (
          <Button
            size="sm"
            variant="outline"
            onClick={onNavigateToScheduling}
            className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 border-blue-200"
            title="Assign resources via Resource Scheduling"
          >
            <Calendar className="h-3 w-3 mr-1" />
            Schedule
          </Button>
        )}
      </div>
    )
  }

  const busData = summary.find(s => s.resource_type === 'bus')
  const driverData = summary.find(s => s.resource_type === 'driver')
  const tourLeaderData = summary.find(s => s.resource_type === 'tour_leader')

  if (compact) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {busData && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Bus className="h-3 w-3 text-blue-600" />
            <span className="text-xs font-medium">{busData.resource_count} Bus</span>
          </Badge>
        )}
        {driverData && (
          <Badge variant="outline" className="flex items-center gap-1">
            <UserCheck className="h-3 w-3 text-green-600" />
            <span className="text-xs font-medium">{driverData.resource_count} Driver</span>
          </Badge>
        )}
        {tourLeaderData && (
          <Badge variant="outline" className="flex items-center gap-1">
            <Users className="h-3 w-3 text-orange-600" />
            <span className="text-xs font-medium">{tourLeaderData.resource_count} TL</span>
          </Badge>
        )}
        {onNavigateToScheduling && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onNavigateToScheduling}
            className="h-6 px-2"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Assigned Resources</h4>
        {onNavigateToScheduling && (
          <Button
            size="sm"
            variant="outline"
            onClick={onNavigateToScheduling}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Manage Schedule
          </Button>
        )}
      </div>

      <div className="grid gap-3">
        {busData && (
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Bus className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm">Buses</span>
              </div>
              <Badge variant="secondary">{busData.resource_count} assigned</Badge>
            </div>
            {busData.total_capacity > 0 && (
              <p className="text-xs text-gray-600">
                Total Capacity: {busData.total_capacity} participants
              </p>
            )}
          </div>
        )}

        {driverData && (
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Drivers</span>
              </div>
              <Badge variant="secondary">{driverData.resource_count} assigned</Badge>
            </div>
          </div>
        )}

        {tourLeaderData && (
          <div className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-600" />
                <span className="font-medium text-sm">Tour Leaders</span>
              </div>
              <Badge variant="secondary">{tourLeaderData.resource_count} assigned</Badge>
            </div>
          </div>
        )}
      </div>

      {!busData && !driverData && !tourLeaderData && (
        <div className="text-center py-4 text-gray-500 text-sm">
          No resources assigned to this trip yet.
        </div>
      )}
    </div>
  )
}
