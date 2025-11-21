import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Bus, UserCircle, Briefcase, CheckSquare, MapPin, DollarSign } from 'lucide-react'

interface TripIssue {
  tripId: string
  tripName: string
  issues: Array<{
    type: 'bus' | 'driver' | 'tour_leader' | 'meeting_point' | 'cost_plan' | 'checklist'
    severity: 'high' | 'medium' | 'low'
    message: string
  }>
  readinessScore: number
  daysUntilDeparture: number
}

interface AttentionRequiredSectionProps {
  trips: any[]
  onSelectTrip: (tripId: string) => void
}

export function AttentionRequiredSection({ trips, onSelectTrip }: AttentionRequiredSectionProps) {
  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'bus':
        return <Bus className="h-4 w-4" />
      case 'driver':
        return <UserCircle className="h-4 w-4" />
      case 'tour_leader':
        return <Briefcase className="h-4 w-4" />
      case 'meeting_point':
        return <MapPin className="h-4 w-4" />
      case 'cost_plan':
        return <DollarSign className="h-4 w-4" />
      case 'checklist':
        return <CheckSquare className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Calculate trip issues (this would ideally come from readiness data)
  const tripIssues: TripIssue[] = trips
    .map(trip => {
      const issues: TripIssue['issues'] = []
      const today = new Date()
      const departureDate = new Date(trip.departure_date)
      const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      // Check for missing resources (simplified)
      // In real app, this would use readiness data
      const readinessScore = 75 // Placeholder

      if (readinessScore < 70) {
        issues.push({
          type: 'checklist',
          severity: 'high',
          message: 'Kesiapan trip kurang dari 70%'
        })
      }

      if (daysUntilDeparture <= 3 && readinessScore < 90) {
        issues.push({
          type: 'checklist',
          severity: 'high',
          message: `Berangkat dalam ${daysUntilDeparture} hari, kesiapan ${readinessScore}%`
        })
      }

      return {
        tripId: trip.id,
        tripName: trip.name,
        issues,
        readinessScore,
        daysUntilDeparture
      }
    })
    .filter(trip => trip.issues.length > 0)
    .sort((a, b) => a.daysUntilDeparture - b.daysUntilDeparture)

  if (tripIssues.length === 0) {
    return null
  }

  const totalHighSeverity = tripIssues.reduce(
    (sum, trip) => sum + trip.issues.filter(i => i.severity === 'high').length,
    0
  )
  const totalMediumSeverity = tripIssues.reduce(
    (sum, trip) => sum + trip.issues.filter(i => i.severity === 'medium').length,
    0
  )

  return (
    <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-orange-900">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <span>Butuh Perhatian</span>
            <Badge variant="destructive" className="ml-2">
              {tripIssues.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center space-x-2 text-sm">
            {totalHighSeverity > 0 && (
              <Badge className="bg-red-100 text-red-800 border-red-300">
                {totalHighSeverity} Urgent
              </Badge>
            )}
            {totalMediumSeverity > 0 && (
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                {totalMediumSeverity} Warning
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tripIssues.slice(0, 5).map((trip) => (
            <div
              key={trip.tripId}
              className="p-4 bg-white rounded-lg border border-orange-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 mb-1">{trip.tripName}</h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>Kesiapan: {trip.readinessScore}%</span>
                    <span>•</span>
                    <span>
                      {trip.daysUntilDeparture > 0
                        ? `${trip.daysUntilDeparture} hari lagi`
                        : 'Sedang berlangsung'}
                    </span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelectTrip(trip.tripId)}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  Lihat Detail
                </Button>
              </div>
              <div className="space-y-2">
                {trip.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start space-x-2 p-2 rounded border ${getSeverityColor(issue.severity)}`}
                  >
                    {getIssueIcon(issue.type)}
                    <span className="text-sm flex-1">{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {tripIssues.length > 5 && (
            <div className="text-center text-sm text-gray-600">
              +{tripIssues.length - 5} trip lainnya membutuhkan perhatian
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
