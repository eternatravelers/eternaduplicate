import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Calendar, Filter, Bus, UserCheck, Users, AlertCircle, Clock, CheckCircle2, Zap } from 'lucide-react'
import { useResourceSchedules, useCreateResourceSchedule, useUpdateResourceSchedule, useDeleteResourceSchedule } from '@/hooks/useResourceSchedules'
import { useTrips } from '@/hooks/useTrips'
import { useBuses } from '@/hooks/useBuses'
import { useDrivers } from '@/hooks/useDrivers'
import { useTourLeaders } from '@/hooks/useTourLeaders'
import { useMeetingPoints } from '@/hooks/useMeetingPoints'
import { ResourceScheduleForm } from '../components/ResourceScheduleForm'
import { ResourceScheduleTimeline } from '../components/ResourceScheduleTimeline'
import { BulkResourceAssignmentForm } from '../components/BulkResourceAssignmentForm'
import { addDays, startOfWeek, endOfWeek, format } from 'date-fns'

export function ResourceSchedulingPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [showBulkForm, setShowBulkForm] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<any>(null)
  const [filters, setFilters] = useState({
    resourceType: '',
    resourceId: '',
    tripId: '',
    status: '',
    startDate: format(startOfWeek(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfWeek(addDays(new Date(), 30)), 'yyyy-MM-dd')
  })
  const [viewMode, setViewMode] = useState<'date' | 'resource' | 'trip'>('date')
  const [error, setError] = useState<string | null>(null)

  const { schedules, loading: schedulesLoading, refetch: refetchSchedules } = useResourceSchedules(filters)
  const { trips } = useTrips()
  const { buses } = useBuses()
  const { drivers } = useDrivers()
  const { tourLeaders } = useTourLeaders()
  const { meetingPoints } = useMeetingPoints()
  const { createSchedule, loading: creating } = useCreateResourceSchedule()
  const { updateSchedule, loading: updating } = useUpdateResourceSchedule()
  const { deleteSchedule, loading: deleting } = useDeleteResourceSchedule()

  const allResources = useMemo(() => ({
    buses,
    drivers,
    tourLeaders
  }), [buses, drivers, tourLeaders])

  const stats = useMemo(() => {
    const activeSchedules = schedules.filter(s => ['scheduled', 'confirmed', 'in_progress'].includes(s.status))
    const busSchedules = activeSchedules.filter(s => s.resource_type === 'bus')
    const driverSchedules = activeSchedules.filter(s => s.resource_type === 'driver')
    const tourLeaderSchedules = activeSchedules.filter(s => s.resource_type === 'tour_leader')

    return {
      total: schedules.length,
      active: activeSchedules.length,
      buses: busSchedules.length,
      drivers: driverSchedules.length,
      tourLeaders: tourLeaderSchedules.length,
      scheduled: schedules.filter(s => s.status === 'scheduled').length,
      confirmed: schedules.filter(s => s.status === 'confirmed').length,
      inProgress: schedules.filter(s => s.status === 'in_progress').length
    }
  }, [schedules])

  const filteredSchedules = useMemo(() => {
    let filtered = schedules

    if (activeTab !== 'all') {
      filtered = filtered.filter(s => s.resource_type === activeTab)
    }

    return filtered
  }, [schedules, activeTab])

  const handleCreateSchedule = async (data: any) => {
    try {
      setError(null)

      // Transform meeting_point_id to meeting_point_name
      const transformedData = { ...data }
      if (data.meeting_point_id) {
        const meetingPoint = meetingPoints.find(mp => mp.id === data.meeting_point_id)
        if (meetingPoint) {
          transformedData.meeting_point_name = meetingPoint.name
        }
      }
      delete transformedData.meeting_point_id

      const { error: createError } = await createSchedule(transformedData)
      if (createError) {
        setError(createError)
        throw new Error(createError)
      }
      refetchSchedules()
      setShowForm(false)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal membuat schedule'
      setError(errorMessage)
      throw err // Re-throw to let form handle it
    }
  }

  const handleUpdateSchedule = async (data: any) => {
    try {
      setError(null)
      if (!editingSchedule?.id) {
        throw new Error('ID schedule tidak ditemukan')
      }

      // Transform meeting_point_id to meeting_point_name
      const transformedData = { ...data }
      if (data.meeting_point_id) {
        const meetingPoint = meetingPoints.find(mp => mp.id === data.meeting_point_id)
        if (meetingPoint) {
          transformedData.meeting_point_name = meetingPoint.name
        }
      }
      delete transformedData.meeting_point_id

      const { error: updateError } = await updateSchedule(editingSchedule.id, transformedData)
      if (updateError) {
        setError(updateError)
        throw new Error(updateError)
      }
      refetchSchedules()
      setShowForm(false)
      setEditingSchedule(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Gagal mengupdate schedule'
      setError(errorMessage)
      throw err // Re-throw to let form handle it
    }
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus jadwal ini?')) return

    try {
      setError(null)
      const { error: deleteError } = await deleteSchedule(scheduleId)
      if (deleteError) {
        setError(deleteError)
        return
      }
      refetchSchedules()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete schedule')
    }
  }

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule)
    setShowForm(true)
  }

  const handleAddNew = () => {
    setEditingSchedule(null)
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingSchedule(null)
  }

  if (schedulesLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Resource Scheduling</h1>
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
          <h1 className="text-3xl font-bold">Resource Scheduling</h1>
          <p className="text-gray-600 mt-2">
            Manajemen terpusat untuk jadwal bus, driver, dan tour leader
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowBulkForm(true)} className="bg-green-600 hover:bg-green-700">
            <Zap className="h-4 w-4 mr-2" />
            Quick Assign
          </Button>
          <Button onClick={handleAddNew} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Tambah Manual
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Jadwal
            </CardTitle>
            <Calendar className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-gray-500">{stats.active} aktif</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Bus Schedule
            </CardTitle>
            <Bus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.buses}</div>
            <p className="text-xs text-gray-500">Jadwal bus</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Driver Schedule
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.drivers}</div>
            <p className="text-xs text-gray-500">Jadwal driver</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tour Leader
            </CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.tourLeaders}</div>
            <p className="text-xs text-gray-500">Jadwal TL</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Scheduled
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.scheduled}</div>
            <p className="text-xs text-gray-500">Terjadwal</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Confirmed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
            <p className="text-xs text-gray-500">Terkonfirmasi</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-blue-600" />
            <span>Filter & Pencarian</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Tanggal Mulai</Label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Tanggal Akhir</Label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Trip</Label>
              <Select value={filters.tripId || 'all'} onValueChange={(value) => setFilters({ ...filters, tripId: value === 'all' ? '' : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua trip" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua trip</SelectItem>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>{trip.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={filters.status || 'all'} onValueChange={(value) => setFilters({ ...filters, status: value === 'all' ? '' : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Semua status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tampilan</Label>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Per Tanggal</SelectItem>
                  <SelectItem value="resource">Per Resource</SelectItem>
                  <SelectItem value="trip">Per Trip</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="all">
            Semua ({stats.total})
          </TabsTrigger>
          <TabsTrigger value="bus">
            <Bus className="h-4 w-4 mr-2" />
            Bus ({stats.buses})
          </TabsTrigger>
          <TabsTrigger value="driver">
            <UserCheck className="h-4 w-4 mr-2" />
            Driver ({stats.drivers})
          </TabsTrigger>
          <TabsTrigger value="tour_leader">
            <Users className="h-4 w-4 mr-2" />
            Tour Leader ({stats.tourLeaders})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <ResourceScheduleTimeline
            schedules={filteredSchedules}
            onEdit={handleEdit}
            onDelete={handleDeleteSchedule}
            resourceType={activeTab !== 'all' ? activeTab : undefined}
            groupBy={viewMode}
          />
        </TabsContent>
      </Tabs>

      <ResourceScheduleForm
        isOpen={showForm}
        onClose={handleCloseForm}
        onSubmit={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}
        initialData={editingSchedule}
        trips={trips}
        resources={allResources}
        meetingPoints={meetingPoints}
      />

      {showBulkForm && (
        <Card className="fixed inset-4 z-50 overflow-auto">
          <CardHeader className="border-b">
            <CardTitle>Quick Assignment - Assign Multiple Resources</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <BulkResourceAssignmentForm
              trips={trips}
              buses={buses}
              drivers={drivers}
              tourLeaders={tourLeaders}
              onSave={() => {
                setShowBulkForm(false)
                refetchSchedules()
              }}
              onCancel={() => setShowBulkForm(false)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
