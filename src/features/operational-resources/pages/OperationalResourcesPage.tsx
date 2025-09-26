import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Bus, UserCheck, Settings, AlertCircle, Users } from 'lucide-react'
import { ResourceAssignmentModal } from '../components/ResourceAssignmentModal'
import { BusForm } from '../components/BusForm'
import { BusTable } from '../components/BusTable'
import { DriverForm } from '../components/DriverForm'
import { DriverTable } from '../components/DriverTable'
import { TourLeaderForm } from '../components/TourLeaderForm'
import { TourLeaderTable } from '../components/TourLeaderTable'
import { useBuses, useCreateBus, useUpdateBus, useDeleteBus } from '@/hooks/useBuses'
import { useDrivers, useCreateDriver, useUpdateDriver, useDeleteDriver } from '@/hooks/useDrivers'
import { useTourLeaders, useCreateTourLeader, useUpdateTourLeader, useDeleteTourLeader } from '@/hooks/useTourLeaders'
import { useTrips, useUpdateTrip } from '@/hooks/useTrips'

export function OperationalResourcesPage() {
  const [activeTab, setActiveTab] = useState('tour-leaders')
  const [showBusForm, setShowBusForm] = useState(false)
  const [showDriverForm, setShowDriverForm] = useState(false)
  const [showTourLeaderForm, setShowTourLeaderForm] = useState(false)
  const [editingBus, setEditingBus] = useState<string | null>(null)
  const [editingDriver, setEditingDriver] = useState<string | null>(null)
  const [editingTourLeader, setEditingTourLeader] = useState<string | null>(null)
  const [busSearchTerm, setBusSearchTerm] = useState('')
  const [driverSearchTerm, setDriverSearchTerm] = useState('')
  const [tourLeaderSearchTerm, setTourLeaderSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)

  // Bus hooks
  const { buses, loading: busesLoading, refetch: refetchBuses } = useBuses()
  const { createBus, loading: creatingBus } = useCreateBus()
  const { updateBus, loading: updatingBus } = useUpdateBus()
  const { deleteBus, loading: deletingBus } = useDeleteBus()

  // Driver hooks
  const { drivers, loading: driversLoading, refetch: refetchDrivers } = useDrivers()
  const { createDriver, loading: creatingDriver } = useCreateDriver()
  const { updateDriver, loading: updatingDriver } = useUpdateDriver()
  const { deleteDriver, loading: deletingDriver } = useDeleteDriver()

  // Tour Leader hooks
  const { tourLeaders, loading: tourLeadersLoading, refetch: refetchTourLeaders } = useTourLeaders()
  const { createTourLeader, loading: creatingTourLeader } = useCreateTourLeader()
  const { updateTourLeader, loading: updatingTourLeader } = useUpdateTourLeader()
  const { deleteTourLeader, loading: deletingTourLeader } = useDeleteTourLeader()

  // Trip hooks for assignment
  const { trips } = useTrips()
  const { updateTrip, loading: updatingTrip } = useUpdateTrip()

  // Bus handlers
  const handleBusSubmit = async (formData: any) => {
    try {
      setError(null)
      const { data, error } = editingBus 
        ? await updateBus(editingBus, formData)
        : await createBus(formData)

      if (error) {
        setError(error)
        return
      }

      if (data) {
        setShowBusForm(false)
        setEditingBus(null)
        refetchBuses()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleBusEdit = (bus: any) => {
    setEditingBus(bus.id)
    setShowBusForm(true)
  }

  const handleBusDelete = async (id: string) => {
    try {
      setError(null)
      const { error } = await deleteBus(id)
      if (error) {
        setError(error)
        return
      }
      refetchBuses()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleBusAddNew = () => {
    setEditingBus(null)
    setShowBusForm(true)
  }

  const handleBusCancel = () => {
    setShowBusForm(false)
    setEditingBus(null)
    setError(null)
  }

  // Tour Leader handlers
  const handleTourLeaderSubmit = async (formData: any) => {
    try {
      setError(null)
      const { data, error } = editingTourLeader 
        ? await updateTourLeader(editingTourLeader, formData)
        : await createTourLeader(formData)

      if (error) {
        setError(error)
        return
      }

      if (data) {
        setShowTourLeaderForm(false)
        setEditingTourLeader(null)
        refetchTourLeaders()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleTourLeaderEdit = (tourLeader: any) => {
    setEditingTourLeader(tourLeader.id)
    setShowTourLeaderForm(true)
  }

  const handleTourLeaderDelete = async (id: string) => {
    try {
      setError(null)
      const { error } = await deleteTourLeader(id)
      if (error) {
        setError(error)
        return
      }
      refetchTourLeaders()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleTourLeaderAddNew = () => {
    setEditingTourLeader(null)
    setShowTourLeaderForm(true)
  }

  const handleTourLeaderCancel = () => {
    setShowTourLeaderForm(false)
    setEditingTourLeader(null)
    setError(null)
  }

  // Driver handlers
  const handleDriverSubmit = async (formData: any) => {
    try {
      setError(null)
      const { data, error } = editingDriver 
        ? await updateDriver(editingDriver, formData)
        : await createDriver(formData)

      if (error) {
        setError(error)
        return
      }

      if (data) {
        setShowDriverForm(false)
        setEditingDriver(null)
        refetchDrivers()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleDriverEdit = (driver: any) => {
    setEditingDriver(driver.id)
    setShowDriverForm(true)
  }

  const handleDriverDelete = async (id: string) => {
    try {
      setError(null)
      const { error } = await deleteDriver(id)
      if (error) {
        setError(error)
        return
      }
      refetchDrivers()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleDriverAddNew = () => {
    setEditingDriver(null)
    setShowDriverForm(true)
  }

  const handleDriverCancel = () => {
    setShowDriverForm(false)
    setEditingDriver(null)
    setError(null)
  }

  // Assignment handlers
  const handleResourceAssignment = async (tripId: string, assignments: any) => {
    try {
      setError(null)
      const { error } = await updateTrip(tripId, assignments)
      if (error) {
        setError(error)
        return
      }
      // Refresh data after successful assignment
      refetchTourLeaders()
      refetchBuses() 
      refetchDrivers()
      // Close the assignment modal after successful assignment
      setShowAssignmentModal(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  if (busesLoading || driversLoading || tourLeadersLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Sumber Daya Operasional</h1>
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
          <h1 className="text-3xl font-bold">Sumber Daya Operasional</h1>
          <p className="text-gray-600 mt-2">Kelola bus dan driver untuk operasional trip</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Settings className="h-4 w-4" />
          <span>Manajemen Operasional</span>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tour Leader
            </CardTitle>
            <UserCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tourLeaders.length}</div>
            <p className="text-xs text-gray-500">
              Tour leader terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tour Leader Aktif
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tourLeaders.filter(tl => tl.status === 'active').length}
            </div>
            <p className="text-xs text-gray-500">
              Siap memimpin
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Bus
            </CardTitle>
            <Bus className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{buses.length}</div>
            <p className="text-xs text-gray-500">
              Kendaraan tersedia
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Bus Aktif
            </CardTitle>
            <Bus className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {buses.filter(bus => bus.status === 'active').length}
            </div>
            <p className="text-xs text-gray-500">
              Siap operasional
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Driver
            </CardTitle>
            <UserCheck className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{drivers.length}</div>
            <p className="text-xs text-gray-500">
              Driver terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Driver Aktif
            </CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {drivers.filter(driver => driver.status === 'active').length}
            </div>
            <p className="text-xs text-gray-500">
              Siap bertugas
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="grid w-full max-w-lg grid-cols-3">
            <TabsTrigger value="tour-leaders">Manajemen Tour Leader</TabsTrigger>
            <TabsTrigger value="buses">Manajemen Bus</TabsTrigger>
            <TabsTrigger value="drivers">Manajemen Driver</TabsTrigger>
          </TabsList>
          
          <div className="flex space-x-2">
            <Button 
              onClick={() => setShowAssignmentModal(true)}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <Users className="h-4 w-4 mr-2" />
              Assignment ke Trip
            </Button>
            <Button 
              onClick={
                activeTab === 'tour-leaders' ? handleTourLeaderAddNew :
                activeTab === 'buses' ? handleBusAddNew : 
                handleDriverAddNew
              }
              className={
                activeTab === 'tour-leaders' ? 'bg-purple-600 hover:bg-purple-700' :
                activeTab === 'buses' ? 'bg-blue-600 hover:bg-blue-700' : 
                'bg-green-600 hover:bg-green-700'
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              {activeTab === 'tour-leaders' ? 'Tambah Tour Leader' : 
               activeTab === 'buses' ? 'Tambah Bus' : 
               'Tambah Driver'}
            </Button>
          </div>
        </div>

        <TabsContent value="tour-leaders" className="space-y-6">
          {showTourLeaderForm && (
            <TourLeaderForm
              initialData={editingTourLeader ? tourLeaders.find(tl => tl.id === editingTourLeader) : undefined}
              onSubmit={handleTourLeaderSubmit}
              onCancel={handleTourLeaderCancel}
              creating={creatingTourLeader}
              updating={updatingTourLeader}
              editingTourLeader={editingTourLeader}
            />
          )}

          <TourLeaderTable
            tourLeaders={tourLeaders}
            searchTerm={tourLeaderSearchTerm}
            setSearchTerm={setTourLeaderSearchTerm}
            onEdit={handleTourLeaderEdit}
            onDelete={handleTourLeaderDelete}
            deleting={deletingTourLeader}
          />
        </TabsContent>

        <TabsContent value="buses" className="space-y-6">
          {showBusForm && (
            <BusForm
              initialData={editingBus ? buses.find(b => b.id === editingBus) : undefined}
              onSubmit={handleBusSubmit}
              onCancel={handleBusCancel}
              creating={creatingBus}
              updating={updatingBus}
              editingBus={editingBus}
            />
          )}

          <BusTable
            buses={buses}
            searchTerm={busSearchTerm}
            setSearchTerm={setBusSearchTerm}
            onEdit={handleBusEdit}
            onDelete={handleBusDelete}
            deleting={deletingBus}
          />
        </TabsContent>

        <TabsContent value="drivers" className="space-y-6">
          {showDriverForm && (
            <DriverForm
              initialData={editingDriver ? drivers.find(d => d.id === editingDriver) : undefined}
              onSubmit={handleDriverSubmit}
              onCancel={handleDriverCancel}
              creating={creatingDriver}
              updating={updatingDriver}
              editingDriver={editingDriver}
            />
          )}

          <DriverTable
            drivers={drivers}
            searchTerm={driverSearchTerm}
            setSearchTerm={setDriverSearchTerm}
            onEdit={handleDriverEdit}
            onDelete={handleDriverDelete}
            deleting={deletingDriver}
          />
        </TabsContent>
      </Tabs>

      <ResourceAssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => setShowAssignmentModal(false)}
        trips={trips}
        tourLeaders={tourLeaders}
        buses={buses}
        drivers={drivers}
        onAssign={handleResourceAssignment}
        assigning={updatingTrip}
      />
    </div>
  )
}