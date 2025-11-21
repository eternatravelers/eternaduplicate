import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Users, MapPin, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'

interface TimelineViewProps {
  trips: any[]
  onSelectTrip: (tripId: string) => void
}

export function TimelineView({ trips, onSelectTrip }: TimelineViewProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Group trips by time periods
  const ongoing = trips.filter(trip => {
    const departure = new Date(trip.departure_date)
    const returnDate = new Date(trip.return_date)
    return departure <= today && returnDate >= today
  })

  const thisWeek = trips.filter(trip => {
    const departure = new Date(trip.departure_date)
    const daysUntil = Math.ceil((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil > 0 && daysUntil <= 7
  })

  const nextWeek = trips.filter(trip => {
    const departure = new Date(trip.departure_date)
    const daysUntil = Math.ceil((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil > 7 && daysUntil <= 14
  })

  const upcoming = trips.filter(trip => {
    const departure = new Date(trip.departure_date)
    const daysUntil = Math.ceil((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil > 14
  })

  const renderTripCard = (trip: any, showDaysUntil: boolean = true) => {
    const departure = new Date(trip.departure_date)
    const daysUntil = Math.ceil((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    const readinessScore = 85 // Placeholder - would come from readiness data

    return (
      <Card
        key={trip.id}
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => onSelectTrip(trip.id)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">{trip.name}</h4>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-3 w-3" />
                  <span>{formatShortDate(trip.departure_date)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="h-3 w-3" />
                  <span>{trip.participant_count || 0} peserta</span>
                </div>
              </div>
            </div>
            {readinessScore >= 90 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : readinessScore >= 70 ? (
              <Clock className="h-5 w-5 text-yellow-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <Badge
              className={
                readinessScore >= 90
                  ? 'bg-green-100 text-green-800'
                  : readinessScore >= 70
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }
            >
              {readinessScore}% siap
            </Badge>
            {showDaysUntil && daysUntil > 0 && (
              <span className="text-sm text-gray-600">
                {daysUntil} hari lagi
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {/* Ongoing Trips */}
      {ongoing.length > 0 && (
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
              <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Sedang Berlangsung</h3>
              <p className="text-sm text-gray-600">{ongoing.length} trip aktif saat ini</p>
            </div>
          </div>
          <div className="ml-5 pl-5 border-l-2 border-green-300">
            <div className="space-y-3">
              {ongoing.map(trip => renderTripCard(trip, false))}
            </div>
          </div>
        </div>
      )}

      {/* This Week */}
      {thisWeek.length > 0 && (
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-full">
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Minggu Ini</h3>
              <p className="text-sm text-gray-600">{thisWeek.length} trip akan berangkat</p>
            </div>
          </div>
          <div className="ml-5 pl-5 border-l-2 border-orange-300">
            <div className="space-y-3">
              {thisWeek.map(trip => renderTripCard(trip))}
            </div>
          </div>
        </div>
      )}

      {/* Next Week */}
      {nextWeek.length > 0 && (
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
              <Calendar className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Minggu Depan</h3>
              <p className="text-sm text-gray-600">{nextWeek.length} trip dijadwalkan</p>
            </div>
          </div>
          <div className="ml-5 pl-5 border-l-2 border-blue-300">
            <div className="space-y-3">
              {nextWeek.map(trip => renderTripCard(trip))}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div>
          <div className="flex items-center space-x-3 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
              <Calendar className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Akan Datang</h3>
              <p className="text-sm text-gray-600">{upcoming.length} trip lebih dari 2 minggu</p>
            </div>
          </div>
          <div className="ml-5 pl-5 border-l-2 border-gray-300">
            <div className="space-y-3">
              {upcoming.slice(0, 5).map(trip => renderTripCard(trip))}
            </div>
            {upcoming.length > 5 && (
              <div className="mt-3 text-center">
                <Button variant="outline" size="sm">
                  Lihat {upcoming.length - 5} trip lainnya
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {trips.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Calendar className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium mb-2">Belum ada trip terjadwal</h3>
          <p className="text-sm">Trip yang dijadwalkan akan muncul di timeline ini</p>
        </div>
      )}
    </div>
  )
}
