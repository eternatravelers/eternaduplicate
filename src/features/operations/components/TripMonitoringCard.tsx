import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { MapPin, Users, Calendar, Clock, Phone, Navigation } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'

interface TripMonitoringCardProps {
  trip: any
  onViewDetails: (trip: any) => void
}

export function TripMonitoringCard({ trip, onViewDetails }: TripMonitoringCardProps) {
  const today = new Date()
  const departureDate = new Date(trip.departure_date)
  const returnDate = new Date(trip.return_date)
  
  // Calculate trip status
  const isUpcoming = departureDate > today
  const isOngoing = departureDate <= today && returnDate >= today
  const isCompleted = returnDate < today
  
  // Calculate days until departure or days remaining
  const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  const daysRemaining = Math.ceil((returnDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  // Calculate progress for ongoing trips
  const totalDays = Math.ceil((returnDate.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24))
  const daysPassed = Math.ceil((today.getTime() - departureDate.getTime()) / (1000 * 60 * 60 * 24))
  const progressPercentage = isOngoing ? Math.min((daysPassed / totalDays) * 100, 100) : 0
  
  // Calculate participant fill rate
  const fillRate = trip.quota > 0 ? (trip.participant_count / trip.quota) * 100 : 0

  const getStatusBadge = () => {
    if (isCompleted) {
      return <Badge className="bg-gray-100 text-gray-800">Selesai</Badge>
    } else if (isOngoing) {
      return <Badge className="bg-green-100 text-green-800">Sedang Berjalan</Badge>
    } else if (isUpcoming) {
      if (daysUntilDeparture <= 3) {
        return <Badge className="bg-orange-100 text-orange-800">Segera Berangkat</Badge>
      } else if (daysUntilDeparture <= 7) {
        return <Badge className="bg-yellow-100 text-yellow-800">Minggu Depan</Badge>
      } else {
        return <Badge className="bg-blue-100 text-blue-800">Akan Datang</Badge>
      }
    }
    return <Badge variant="outline">Unknown</Badge>
  }

  const getUrgencyColor = () => {
    if (isOngoing) return 'border-green-200 bg-green-50'
    if (isUpcoming && daysUntilDeparture <= 3) return 'border-orange-200 bg-orange-50'
    if (isUpcoming && daysUntilDeparture <= 7) return 'border-yellow-200 bg-yellow-50'
    return 'border-gray-200'
  }

  return (
    <Card className={`hover:shadow-lg transition-shadow ${getUrgencyColor()}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
              {trip.name}
            </CardTitle>
            <div className="flex flex-wrap gap-1 mb-2">
              {trip.destinations?.slice(0, 2).map((dest: any) => (
                <Badge key={dest.id} variant="outline" className="text-xs">
                  {dest.name}
                </Badge>
              ))}
              {trip.destinations?.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{trip.destinations.length - 2} lainnya
                </Badge>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trip Dates */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-blue-600" />
            <div>
              <div className="font-medium">Berangkat</div>
              <div className="text-gray-600">{formatShortDate(trip.departure_date)}</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-purple-600" />
            <div>
              <div className="font-medium">Kembali</div>
              <div className="text-gray-600">{formatShortDate(trip.return_date)}</div>
            </div>
          </div>
        </div>

        {/* Countdown or Progress */}
        {isUpcoming && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Countdown Keberangkatan</span>
              <Clock className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-700">
              {daysUntilDeparture} hari lagi
            </div>
          </div>
        )}

        {isOngoing && (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800">Progress Trip</span>
              <Clock className="h-4 w-4 text-green-600" />
            </div>
            <Progress value={progressPercentage} className="mb-2" />
            <div className="text-sm text-green-700">
              Hari ke-{daysPassed} dari {totalDays} hari ({daysRemaining} hari tersisa)
            </div>
          </div>
        )}

        {/* Participant Info */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Peserta</span>
          </div>
          <div className="text-right">
            <div className="font-bold">{trip.participant_count}/{trip.quota}</div>
            <div className="text-xs text-gray-500">{fillRate.toFixed(0)}% terisi</div>
          </div>
        </div>

        {/* Meeting Point */}
        <div className="flex items-start space-x-2 p-3 bg-gray-50 rounded-lg">
          <Navigation className="h-4 w-4 text-orange-600 mt-0.5" />
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-900 mb-1">Titik Kumpul</div>
            <div className="text-sm text-gray-600">{trip.meeting_point}</div>
          </div>
        </div>

        {/* Tour Leaders */}
        {trip.tour_leaders && trip.tour_leaders.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-900">Tour Leaders</div>
            {trip.tour_leaders.map((leader: any) => (
              <div key={leader.id} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                <span className="text-sm font-medium">{leader.name}</span>
                {leader.phone && (
                  <Button size="sm" variant="ghost" className="h-6 text-xs">
                    <Phone className="h-3 w-3 mr-1" />
                    {leader.phone}
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <Button 
          onClick={() => onViewDetails(trip)}
          className="w-full"
          variant={isOngoing ? "default" : "outline"}
        >
          {isOngoing ? 'Monitor Trip' : 'Lihat Detail'}
        </Button>
      </CardContent>
    </Card>
  )
}