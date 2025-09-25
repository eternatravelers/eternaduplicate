import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, Users, MapPin, DollarSign } from 'lucide-react'
import { TripFormModal } from '../components/TripFormModal'
import { TripListTable } from '../components/TripListTable'
import { TripTypeManagerModal } from '../components/TripTypeManagerModal'
import { TripParticipantsModal } from '../components/TripParticipantsModal'
import { useTrips, useCreateTrip, useUpdateTrip, useDeleteTrip } from '@/hooks/useTrips'
import { useTourLeaders } from '@/hooks/useTourLeaders'
import { useDestinations } from '@/hooks/useDestinations'
import { useCostPlans } from '@/hooks/useCostPlans'
import { useTripTypes, useCreateTripType, useDeleteTripType } from '@/hooks/useTripTypes'
import { useBuses } from '@/hooks/useBuses'
import { useDrivers } from '@/hooks/useDrivers'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export function TripsPage() {
  const { trips, loading, refetch } = useTrips()
  const { tourLeaders } = useTourLeaders()
  const { destinations } = useDestinations()
  const { costPlans } = useCostPlans()
  const { tripTypes, refetch: refetchTripTypes } = useTripTypes()
  const { buses } = useBuses()
  const { drivers } = useDrivers()
  const { createTrip, loading: creating } = useCreateTrip()
  const { updateTrip, loading: updating } = useUpdateTrip()
  const { deleteTrip, loading: deleting } = useDeleteTrip()
  const { createTripType, loading: creatingTripType } = useCreateTripType()
  const { deleteTripType, loading: deletingTripType } = useDeleteTripType()
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false)
  const [isAddTripTypeModalOpen, setIsAddTripTypeModalOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<any>(null)
  const { isSuperAdmin } = useAuth()

  const handleSubmit = async (formData: any) => {
    try {
      if (selectedTrip && !isDuplicateModalOpen) {
        await updateTrip(selectedTrip.id, formData)
        setIsEditModalOpen(false)
      } else {
        await createTrip(formData)
        if (isDuplicateModalOpen) {
          setIsDuplicateModalOpen(false)
        } else {
          setIsCreateModalOpen(false)
        }
      }
      setSelectedTrip(null)
      refetch()
    } catch (error) {
      console.error('Error saving trip:', error)
    }
  }

  const handleEdit = (trip: any) => {
    setSelectedTrip(trip)
    setIsEditModalOpen(true)
  }

  const handleDuplicate = (trip: any) => {
    const originalDeparture = new Date(trip.departure_date)
    const originalReturn = new Date(trip.return_date)
    const newDeparture = new Date(originalDeparture)
    const newReturn = new Date(originalReturn)
    
    newDeparture.setMonth(newDeparture.getMonth() + 1)
    newReturn.setMonth(newReturn.getMonth() + 1)
    
    const duplicateData = {
      ...trip,
      name: `${trip.name} (Copy)`,
      departure_date: newDeparture.toISOString().split('T')[0],
      return_date: newReturn.toISOString().split('T')[0],
      tour_leader_ids: trip.tour_leaders?.map((tl: any) => tl.id) || [],
      bus_ids: trip.buses?.map((bus: any) => bus.id) || [],
      driver_ids: trip.drivers?.map((driver: any) => driver.id) || [],
      status: 'active'
    }
    
    setSelectedTrip(duplicateData)
    setIsDuplicateModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteTrip(id)
      refetch()
    } catch (error) {
      console.error('Error deleting trip:', error)
    }
  }

  const handleAddTripType = async (name: string) => {
    try {
      const { error } = await createTripType(name)
      if (!error) {
        refetchTripTypes()
      }
    } catch (error) {
      console.error('Error adding trip type:', error)
    }
  }

  const handleDeleteTripType = async (id: string, name: string) => {
    try {
      const { error } = await deleteTripType(id)
      if (!error) {
        refetchTripTypes()
      }
    } catch (error) {
      console.error('Error deleting trip type:', error)
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trip Management</h1>
          <p className="text-gray-600 mt-1">Manage your travel packages and itineraries</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add New Trip
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Trips</p>
                <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Trips</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trips.filter(trip => trip.status === 'active').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trips.filter(trip => trip.status === 'completed').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(trips.reduce((sum, trip) => sum + (trip.price || 0), 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TripListTable
        trips={trips}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        isSuperAdmin={isSuperAdmin}
        deleting={deleting}
      />

      <TripFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleSubmit}
        tourLeaders={tourLeaders}
        destinations={destinations}
        costPlans={costPlans}
        tripTypes={tripTypes}
        buses={buses}
        drivers={drivers}
        creating={creating}
        updating={updating}
        onAddTripType={() => setIsAddTripTypeModalOpen(true)}
        title="Create New Trip"
      />

      <TripFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        initialData={selectedTrip}
        onSubmit={handleSubmit}
        tourLeaders={tourLeaders}
        destinations={destinations}
        costPlans={costPlans}
        tripTypes={tripTypes}
        buses={buses}
        drivers={drivers}
        creating={creating}
        updating={updating}
        onAddTripType={() => setIsAddTripTypeModalOpen(true)}
        title="Edit Trip"
      />

      <TripFormModal
        isOpen={isDuplicateModalOpen}
        onClose={() => setIsDuplicateModalOpen(false)}
        initialData={selectedTrip}
        onSubmit={handleSubmit}
        tourLeaders={tourLeaders}
        destinations={destinations}
        costPlans={costPlans}
        tripTypes={tripTypes}
        buses={buses}
        drivers={drivers}
        creating={creating}
        updating={updating}
        onAddTripType={() => setIsAddTripTypeModalOpen(true)}
        title="Duplicate Trip"
      />

      <TripTypeManagerModal
        isOpen={isAddTripTypeModalOpen}
        onClose={() => setIsAddTripTypeModalOpen(false)}
        tripTypes={tripTypes}
        onAddTripType={handleAddTripType}
        onDeleteTripType={handleDeleteTripType}
        creatingTripType={creatingTripType}
        deletingTripType={deletingTripType}
      />

      <TripParticipantsModal
        isOpen={showParticipantsModal}
        onClose={() => {
          setShowParticipantsModal(false)
          setSelectedTripForParticipants(null)
        }}
        trip={selectedTripForParticipants}
      />
      <TripParticipantsModal
        isOpen={showParticipantsModal}
        onClose={() => {
          setShowParticipantsModal(false)
          setSelectedTripForParticipants(null)
        }}
        trip={selectedTripForParticipants}
      />
    </div>
  )
}