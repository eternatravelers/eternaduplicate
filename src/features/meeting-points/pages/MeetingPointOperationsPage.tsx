import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MapPin, Clock, Bus, FileText, Users, AlertCircle, Download, UserPlus, Info } from 'lucide-react'
import { useTrips } from '@/hooks/useTrips'
import { useMeetingPointSummary } from '@/hooks/useMeetingPointSummary'
import { useMeetingPointAssignments } from '@/hooks/useMeetingPointAssignments'
import { usePickupSchedules } from '@/hooks/usePickupSchedules'
import { MeetingPointSummaryCard } from '../components/MeetingPointSummaryCard'
import { MeetingPointParticipantsModal } from '../components/MeetingPointParticipantsModal'
import { PickupScheduleForm } from '../components/PickupScheduleForm'
import { PickupScheduleTimeline } from '../components/PickupScheduleTimeline'
import { MeetingPointReport } from '../components/MeetingPointReport'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function MeetingPointOperationsPage() {
  const [selectedTripId, setSelectedTripId] = useState<string>('')
  const [activeTab, setActiveTab] = useState('summary')
  const [showParticipantsModal, setShowParticipantsModal] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [selectedMeetingPoint, setSelectedMeetingPoint] = useState<string>('')
  const [editingSchedule, setEditingSchedule] = useState<any>(null)

  const { trips, loading: tripsLoading } = useTrips()
  const { summary, loading: summaryLoading, refetch: refetchSummary } = useMeetingPointSummary(selectedTripId)
  const { assignments } = useMeetingPointAssignments(selectedTripId)
  const { schedules } = usePickupSchedules(selectedTripId)

  const selectedTrip = trips.find(t => t.id === selectedTripId)
  const activeTrips = trips.filter(trip => trip.status === 'active')

  // Enrich summary with assignment and schedule data
  const enrichedSummary = useMemo(() => {
    return summary.map(item => {
      const assignment = assignments.find(a => a.meeting_point_name === item.meeting_point_name)
      const schedule = schedules.find(s => s.meeting_point_name === item.meeting_point_name)

      return {
        ...item,
        bus_number: assignment?.buses?.bus_number,
        bus_capacity: assignment?.buses?.capacity,
        driver_name: assignment?.drivers?.name,
        pickup_time: schedule?.pickup_time
      }
    })
  }, [summary, assignments, schedules])

  const handleViewParticipants = (meetingPointName: string) => {
    setSelectedMeetingPoint(meetingPointName)
    setShowParticipantsModal(true)
  }

  const handleSchedulePickup = (meetingPointName: string) => {
    setSelectedMeetingPoint(meetingPointName)
    setEditingSchedule(null)
    setShowScheduleForm(true)
  }


  const handleEditSchedule = (schedule: any) => {
    setSelectedMeetingPoint(schedule.meeting_point_name)
    setEditingSchedule(schedule)
    setShowScheduleForm(true)
  }

  const handleScheduleSuccess = () => {
    refetchSummary()
  }

  const totalParticipants = enrichedSummary.reduce((sum, s) => sum + s.participant_count, 0)
  const totalMeetingPoints = enrichedSummary.length
  const scheduledMeetingPoints = enrichedSummary.filter(s => s.has_pickup_schedule).length
  const assignedMeetingPoints = enrichedSummary.filter(s => s.has_transportation_assigned).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meeting Point Operations</h1>
          <p className="text-gray-600 mt-2">
            Kelola penjemputan peserta per meeting point
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <MapPin className="h-4 w-4" />
          <span>Rekapitulasi & Penjadwalan</span>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <Label htmlFor="trip-select">Pilih Trip</Label>
            <Select value={selectedTripId} onValueChange={setSelectedTripId}>
              <SelectTrigger id="trip-select">
                <SelectValue placeholder="Pilih trip untuk melihat meeting point..." />
              </SelectTrigger>
              <SelectContent>
                {activeTrips.map((trip) => (
                  <SelectItem key={trip.id} value={trip.id}>
                    {trip.name} - {new Date(trip.departure_date).toLocaleDateString('id-ID')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {!selectedTripId ? (
        <div className="text-center py-12 text-gray-500">
          <MapPin className="h-16 w-16 mx-auto mb-4 opacity-30" />
          <h3 className="text-lg font-medium mb-2">Pilih Trip</h3>
          <p className="text-sm">
            Pilih trip dari dropdown di atas untuk melihat rekapitulasi meeting point
          </p>
        </div>
      ) : summaryLoading ? (
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      ) : enrichedSummary.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="pt-12 pb-12">
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="bg-blue-50 p-6 rounded-full">
                  <MapPin className="h-16 w-16 text-blue-600" />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-gray-900">
                  Belum Ada Meeting Point untuk Trip Ini
                </h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  Trip ini belum memiliki meeting point yang di-assign. Data akan muncul setelah meeting point di-assign ke trip dan peserta terdaftar.
                </p>
              </div>

              <Alert className="max-w-2xl mx-auto bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-sm text-blue-900">
                  <strong>Langkah selanjutnya:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Assign meeting point ke trip di halaman <strong>Trip Management</strong></li>
                    <li>Atau tambahkan meeting point baru di <strong>Master Meeting Points</strong></li>
                    <li>Pastikan peserta sudah memilih meeting point saat pendaftaran</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex justify-center gap-3 pt-4">
                <Button
                  variant="default"
                  size="lg"
                  onClick={() => window.location.href = '/participants'}
                  className="gap-2"
                >
                  <UserPlus className="h-5 w-5" />
                  Tambah Peserta
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => window.location.href = '/trips'}
                >
                  Lihat Semua Trip
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-700">
                      {totalMeetingPoints}
                    </div>
                    <div className="text-sm text-blue-600">Meeting Points</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-8 w-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-700">
                      {totalParticipants}
                    </div>
                    <div className="text-sm text-green-600">Total Peserta</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-700">
                      {scheduledMeetingPoints}
                    </div>
                    <div className="text-sm text-orange-600">Terjadwal</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Bus className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-purple-700">
                      {assignedMeetingPoints}
                    </div>
                    <div className="text-sm text-purple-600">Bus Assigned</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary">
                <MapPin className="h-4 w-4 mr-2" />
                Ringkasan Meeting Point
              </TabsTrigger>
              <TabsTrigger value="schedule">
                <Clock className="h-4 w-4 mr-2" />
                Jadwal Penjemputan
              </TabsTrigger>
              <TabsTrigger value="transport">
                <Bus className="h-4 w-4 mr-2" />
                Transportasi
              </TabsTrigger>
              <TabsTrigger value="report">
                <FileText className="h-4 w-4 mr-2" />
                Laporan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {enrichedSummary.map((item) => (
                  <MeetingPointSummaryCard
                    key={item.meeting_point_name}
                    summary={item}
                    onSchedulePickup={handleSchedulePickup}
                    onViewParticipants={handleViewParticipants}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="schedule" className="space-y-6">
              <PickupScheduleTimeline
                tripId={selectedTripId}
                onEdit={handleEditSchedule}
                onRefresh={refetchSummary}
              />
            </TabsContent>

            <TabsContent value="transport" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Bus className="h-5 w-5 text-blue-600" />
                    <span>Assignment Transportasi</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">
                      Gunakan tombol "Assign Bus & Driver" pada ringkasan meeting point
                      untuk mengalokasikan transportasi
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="report" className="space-y-6">
              <MeetingPointReport tripId={selectedTripId} tripName={selectedTrip?.name || ''} />
            </TabsContent>
          </Tabs>
        </>
      )}

      <MeetingPointParticipantsModal
        isOpen={showParticipantsModal}
        onClose={() => setShowParticipantsModal(false)}
        tripId={selectedTripId}
        meetingPointName={selectedMeetingPoint}
      />

      <PickupScheduleForm
        isOpen={showScheduleForm}
        onClose={() => {
          setShowScheduleForm(false)
          setEditingSchedule(null)
        }}
        tripId={selectedTripId}
        meetingPointName={selectedMeetingPoint}
        initialData={editingSchedule}
        onSuccess={handleScheduleSuccess}
      />
    </div>
  )
}
