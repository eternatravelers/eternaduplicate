import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MapPin, Activity, Calendar, Users } from 'lucide-react'
import { useTrips } from '@/hooks/useTrips'

export function OperationsPage() {
  const [activeTab, setActiveTab] = useState('monitoring')
  const { trips, loading: tripsLoading } = useTrips()

  // Filter trips for monitoring
  const activeTrips = trips.filter(trip => {
    const today = new Date()
    const departureDate = new Date(trip.departure_date)
    const returnDate = new Date(trip.return_date)
    
    return trip.status === 'active' && (
      departureDate >= today || 
      (departureDate <= today && returnDate >= today)
    )
  })

  const upcomingTrips = activeTrips.filter(trip => {
    const today = new Date()
    const departureDate = new Date(trip.departure_date)
    return departureDate > today
  })

  const ongoingTrips = activeTrips.filter(trip => {
    const today = new Date()
    const departureDate = new Date(trip.departure_date)
    const returnDate = new Date(trip.return_date)
    return departureDate <= today && returnDate >= today
  })

  if (tripsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Operasional Management</h1>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Operasional Management</h1>
          <p className="text-gray-600 mt-2">Monitor dan kelola operasional trip secara real-time</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>Real-time monitoring</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Trip Aktif
            </CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTrips.length}</div>
            <p className="text-xs text-gray-500">
              Total trip aktif
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sedang Berjalan
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{ongoingTrips.length}</div>
            <p className="text-xs text-gray-500">
              Trip berlangsung
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Akan Berangkat
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{upcomingTrips.length}</div>
            <p className="text-xs text-gray-500">
              Trip mendatang
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Peserta
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTrips.reduce((sum, trip) => sum + (trip.participant_count || 0), 0)}
            </div>
            <p className="text-xs text-gray-500">
              Peserta aktif
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring">Trip Monitoring</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="documents">Dokumen</TabsTrigger>
          <TabsTrigger value="emergency">Kontak Darurat</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6">
          {/* Trip monitoring components will be implemented later */}
          <div className="text-center py-8 text-gray-500">
            Trip monitoring components coming soon...
          </div>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          {/* Checklist components will be implemented later */}
          <div className="text-center py-8 text-gray-500">
            Checklist components coming soon...
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          {/* Document management components will be implemented later */}
          <div className="text-center py-8 text-gray-500">
            Document management components coming soon...
          </div>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
          {/* Emergency contacts components will be implemented later */}
          <div className="text-center py-8 text-gray-500">
            Emergency contacts components coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}