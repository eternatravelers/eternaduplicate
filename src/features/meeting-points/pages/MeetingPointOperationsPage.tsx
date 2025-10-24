import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { MapPin, Clock, Bus, FileText, Users, AlertCircle, Download } from 'lucide-react'
import { useTrips } from '@/hooks/useTrips'
import { useMeetingPointSummary } from '@/hooks/useMeetingPointSummary'
import { MeetingPointSummaryCard } from '../components/MeetingPointSummaryCard'
import { MeetingPointParticipantsModal } from '../components/MeetingPointParticipantsModal'
import { PickupScheduleForm } from '../components/PickupScheduleForm'
import { PickupScheduleTimeline } from '../components/PickupScheduleTimeline'
import { TransportationAssignmentModal } from '../components/TransportationAssignmentModal'
import { MeetingPointReport } from '../components/MeetingPointReport'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function MeetingPointOperationsPage() {
  const [selectedTripId, setSelectedTripId] = useState<string>('')
  const [activeTab, setActiveTab] = useState('summary')
  const [showParticipantsModal, setShowParticipantsModal] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [selectedMeetingPoint, setSelectedMeetingPoint] = useState<string>('')
  const [selectedParticipantCount, setSelectedParticipantCount] = useState(0)
  const [editingSchedule, setEditingSchedule] = useState<any>(null)
  const [editingAssignment, setEditingAssignment] = useState<any>(null)

  const { trips, loading: tripsLoading } = useTrips()
  const { summary, loading: summaryLoading, refetch: refetchSummary } = useMeetingPointSummary(selectedTripId)

  const selectedTrip = trips.find(t => t.id === selectedTripId)

  const activeTrips = trips.filter(trip => trip.status === 'active')

  const handleViewParticipants = (meetingPointName: string) => {
    setSelectedMeetingPoint(meetingPointName)
    setShowParticipantsModal(true)
  }

  const handleSchedulePickup = (meetingPointName: string) => {
    setSelectedMeetingPoint(meetingPointName)
    setEditingSchedule(null)
    setShowScheduleForm(true)
  }

  const handleAssignTransport = (meetingPointName: string, participantCount: number) => {
    setSelectedMeetingPoint(meetingPointName)
    setSelectedParticipantCount(participantCount)
    setEditingAssignment(null)
    setShowAssignmentModal(true)
  }

  const handleEditSchedule = (schedule: any) => {
    setSelectedMeetingPoint(schedule.meeting_point_name)
    setEditingSchedule(schedule)
    setShowScheduleForm(true)
  }

  const handleScheduleSuccess = () => {
    refetchSummary()
  }

  const handleAssignmentSuccess = () => {
    refetchSummary()
  }

  const totalParticipants = summary.reduce((sum, s) => sum + s.participant_count, 0)
  const totalMeetingPoints = summary.length
  const scheduledMeetingPoints = summary.filter(s => s.has_pickup_schedule).length
  const assignedMeetingPoints = summary.filter(s => s.has_transportation_assigned).length

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
      ) : summary.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Belum ada peserta yang terdaftar untuk trip ini. Silakan tambahkan peserta terlebih dahulu.
          </AlertDescription>
        </Alert>
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
                {summary.map((item) => (
                  <MeetingPointSummaryCard
                    key={item.meeting_point_name}
                    summary={item}
                    onSchedulePickup={handleSchedulePickup}
                    onAssignTransport={(mp) =>
                      handleAssignTransport(mp, item.participant_count)
                    }
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

      <TransportationAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => {
          setShowAssignmentModal(false)
          setEditingAssignment(null)
        }}
        tripId={selectedTripId}
        meetingPointName={selectedMeetingPoint}
        participantCount={selectedParticipantCount}
        initialData={editingAssignment}
        onSuccess={handleAssignmentSuccess}
      />
    </div>
  )
}
