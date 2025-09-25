import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { MapPin, Activity, Calendar, Users, Monitor, CheckSquare, FileText, Phone } from 'lucide-react'
import { useTrips } from '@/hooks/useTrips'
import { TripMonitoringCard } from '../components/TripMonitoringCard'
import { ChecklistManager } from '../components/ChecklistManager'
import { DocumentManager } from '../components/DocumentManager'
import { EmergencyContactsManager } from '../components/EmergencyContactsManager'
import { formatShortDate } from '@/lib/utils'

export function OperationsPage() {
  const [activeTab, setActiveTab] = useState('monitoring')
  const [selectedTrip, setSelectedTrip] = useState<any>(null)
  const [showTripDetails, setShowTripDetails] = useState(false)
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

  const handleViewTripDetails = (trip: any) => {
    setSelectedTrip(trip)
    setShowTripDetails(true)
  }

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
          {activeTrips.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Monitor className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Tidak ada trip aktif</h3>
              <p className="text-sm mb-4">
                Belum ada trip yang perlu dimonitor saat ini
              </p>
              <Button 
                variant="outline"
                onClick={() => window.location.hash = '#trips'}
              >
                Buat Trip Baru
              </Button>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeTrips.map((trip) => (
                <TripMonitoringCard
                  key={trip.id}
                  trip={trip}
                  onViewDetails={handleViewTripDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          {selectedTrip ? (
            <ChecklistManager
              tripId={selectedTrip.id}
              tripName={selectedTrip.name}
            />
          ) : (
            <div className="text-center py-12 text-gray-500">
              <CheckSquare className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Pilih Trip untuk Checklist</h3>
              <p className="text-sm mb-4">
                Pilih trip dari tab "Trip Monitoring" untuk melihat checklist operasional
              </p>
              <Button 
                variant="outline"
                onClick={() => setActiveTab('monitoring')}
              >
                Lihat Trip Monitoring
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <DocumentManager
            tripId={selectedTrip?.id}
            tripName={selectedTrip?.name}
          />
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
          <EmergencyContactsManager />
        </TabsContent>
      </Tabs>

      {/* Trip Details Modal */}
      <Dialog open={showTripDetails} onOpenChange={setShowTripDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Monitor className="h-5 w-5" />
              <span>Detail Trip - {selectedTrip?.name}</span>
            </DialogTitle>
          </DialogHeader>
          {selectedTrip && (
            <div className="mt-4">
              <ChecklistManager
                tripId={selectedTrip.id}
                tripName={selectedTrip.name}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}