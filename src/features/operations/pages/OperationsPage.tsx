import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MapPin, Activity, Calendar, Users, Monitor, CheckSquare, FileText, Phone, Search, Filter, Clock, AlertTriangle } from 'lucide-react'
import { useTrips } from '@/hooks/useTrips'
import { TripMonitoringCard } from '../components/TripMonitoringCard'
import { ChecklistManager } from '../components/ChecklistManager'
import { DocumentManager } from '../components/DocumentManager'
import { EmergencyContactsManager } from '../components/EmergencyContactsManager'
import { AttentionRequiredSection } from '../components/AttentionRequiredSection'
import { TimelineView } from '../components/TimelineView'
import { formatShortDate } from '@/lib/utils'

export function OperationsPage() {
  const [activeTab, setActiveTab] = useState('monitoring')
  const [selectedTrip, setSelectedTrip] = useState<any>(null)
  const [showTripDetails, setShowTripDetails] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [readinessFilter, setReadinessFilter] = useState('all')
  const { trips, loading: tripsLoading } = useTrips()

  // Filter trips for monitoring
  // Include trips that are: open (accepting registrations), confirmed (ready), or ongoing (in progress)
  const activeTrips = trips.filter(trip => {
    const today = new Date()
    const departureDate = new Date(trip.departure_date)
    const returnDate = new Date(trip.return_date)

    // Only show trips that are not cancelled or deleted
    const isActiveStatus = ['open', 'confirmed', 'ongoing'].includes(trip.status)

    // Only show trips that are either upcoming or currently ongoing
    const isRelevantTime = departureDate >= today ||
      (departureDate <= today && returnDate >= today)

    return isActiveStatus && isRelevantTime
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

  const handleSelectTripById = (tripId: string) => {
    const trip = trips.find(t => t.id === tripId)
    if (trip) {
      handleViewTripDetails(trip)
    }
  }

  // Filter trips based on search and filters
  const filteredTrips = activeTrips.filter(trip => {
    const matchesSearch = trip.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'ongoing' && ongoingTrips.includes(trip)) ||
      (statusFilter === 'upcoming' && upcomingTrips.includes(trip))
    // Readiness filter would use actual readiness data
    return matchesSearch && matchesStatus
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

      {/* Attention Required Section */}
      <AttentionRequiredSection
        trips={activeTrips}
        onSelectTrip={handleSelectTripById}
      />

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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="monitoring">
            <Monitor className="h-4 w-4 mr-2" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="timeline">
            <Clock className="h-4 w-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="checklist">
            <CheckSquare className="h-4 w-4 mr-2" />
            Checklist
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-2" />
            Dokumen
          </TabsTrigger>
          <TabsTrigger value="emergency">
            <Phone className="h-4 w-4 mr-2" />
            Emergency
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari trip..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Status</SelectItem>
                      <SelectItem value="ongoing">Sedang Berjalan</SelectItem>
                      <SelectItem value="upcoming">Akan Datang</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={readinessFilter} onValueChange={setReadinessFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Kesiapan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="high">≥90%</SelectItem>
                      <SelectItem value="medium">70-89%</SelectItem>
                      <SelectItem value="low">&lt;70%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {filteredTrips.length === 0 ? (
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
              {filteredTrips.map((trip) => (
                <TripMonitoringCard
                  key={trip.id}
                  trip={trip}
                  onViewDetails={handleViewTripDetails}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <TimelineView
            trips={activeTrips}
            onSelectTrip={handleSelectTripById}
          />
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