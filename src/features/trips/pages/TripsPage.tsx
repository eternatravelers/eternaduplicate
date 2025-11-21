import React, { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, Users, MapPin, DollarSign } from 'lucide-react'
import { TripFormModal } from '../components/TripFormModal'
import { TripListTableCompact } from '../components/TripListTableCompact'
import { TripFilters, TripFilterState } from '../components/TripFilters'
import { TripTypeManagerModal } from '../components/TripTypeManagerModal'
import { TripResourcesModal } from '../components/TripResourcesModal'
import { useTrips, useCreateTrip, useUpdateTrip, useDeleteTrip } from '@/hooks/useTrips'
import { useTourLeaders } from '@/hooks/useTourLeaders'
import { useDestinations } from '@/hooks/useDestinations'
import { useCostPlans } from '@/hooks/useCostPlans'
import { useTripTypes, useCreateTripType, useDeleteTripType } from '@/hooks/useTripTypes'
import { useBuses } from '@/hooks/useBuses'
import { useDrivers } from '@/hooks/useDrivers'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface TripsPageProps {
  onViewTripParticipants?: (trip: {id: string, name: string}) => void
  onViewTripReadiness?: (tripId: string) => void
  onNavigateToResourceScheduling?: (tripId: string) => void
}

export function TripsPage({ onViewTripParticipants, onViewTripReadiness, onNavigateToResourceScheduling }: TripsPageProps = {}) {
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
  const [isResourcesModalOpen, setIsResourcesModalOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<any>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const { isSuperAdmin } = useAuth()

  const [filters, setFilters] = useState<TripFilterState>({
    search: '',
    statuses: [],
    dateFrom: '',
    dateTo: '',
    readinessLevel: 'all',
    quotaStatus: 'all',
    sortBy: 'date-asc'
  })

  // Refetch trips when component mounts or becomes visible
  useEffect(() => {
    refetch()
  }, [])

  const handleSubmit = async (formData: any) => {
    try {
      setSubmitError(null)
      if (selectedTrip && !isDuplicateModalOpen) {
        const { error } = await updateTrip(selectedTrip.id, formData)
        if (error) {
          setSubmitError(error)
          return
        }
        setIsEditModalOpen(false)
      } else {
        const { error } = await createTrip(formData)
        if (error) {
          setSubmitError(error)
          return
        }
        if (isDuplicateModalOpen) {
          setIsDuplicateModalOpen(false)
        } else {
          setIsCreateModalOpen(false)
        }
      }
      setSelectedTrip(null)
      setSubmitError(null)
      refetch()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan saat menyimpan trip'
      setSubmitError(errorMessage)
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

  const handleViewParticipants = (trip: any) => {
    if (onViewTripParticipants) {
      onViewTripParticipants({ id: trip.id, name: trip.name })
    }
  }

  const handleViewResources = (trip: any) => {
    setSelectedTrip(trip)
    setIsResourcesModalOpen(true)
  }

  const handleViewReadiness = (trip: any) => {
    if (onViewTripReadiness) {
      onViewTripReadiness(trip.id)
    }
  }

  // Filter and sort trips
  const filteredAndSortedTrips = useMemo(() => {
    let filtered = [...trips]

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(trip =>
        trip.name.toLowerCase().includes(searchLower) ||
        trip.trip_type?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(trip => filters.statuses.includes(trip.status))
    }

    // Date range filter
    if (filters.dateFrom) {
      filtered = filtered.filter(trip => new Date(trip.departure_date) >= new Date(filters.dateFrom))
    }
    if (filters.dateTo) {
      filtered = filtered.filter(trip => new Date(trip.departure_date) <= new Date(filters.dateTo))
    }

    // Readiness level filter
    if (filters.readinessLevel !== 'all') {
      filtered = filtered.filter(trip => {
        const score = trip.readiness_score || 0
        switch (filters.readinessLevel) {
          case 'ready':
            return score >= 80
          case 'needs-attention':
            return score >= 50 && score < 80
          case 'not-ready':
            return score < 50
          default:
            return true
        }
      })
    }

    // Quota status filter
    if (filters.quotaStatus !== 'all') {
      filtered = filtered.filter(trip => {
        if (!trip.quota) return filters.quotaStatus === 'all'
        const percentage = (trip.confirmed_participant_count || 0) / trip.quota * 100
        switch (filters.quotaStatus) {
          case 'available':
            return percentage < 100
          case 'almost-full':
            return percentage >= 80 && percentage < 100
          case 'full':
            return percentage >= 100
          default:
            return true
        }
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-asc':
          return new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime()
        case 'date-desc':
          return new Date(b.departure_date).getTime() - new Date(a.departure_date).getTime()
        case 'name-asc':
          return a.name.localeCompare(b.name)
        case 'name-desc':
          return b.name.localeCompare(a.name)
        case 'readiness-desc':
          return (b.readiness_score || 0) - (a.readiness_score || 0)
        case 'participants-desc':
          return (b.confirmed_participant_count || 0) - (a.confirmed_participant_count || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [trips, filters])

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0
    if (filters.statuses.length > 0) count++
    if (filters.dateFrom || filters.dateTo) count++
    if (filters.readinessLevel !== 'all') count++
    if (filters.quotaStatus !== 'all') count++
    return count
  }, [filters])

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
                <p className="text-sm font-medium text-gray-600">Open Trips</p>
                <p className="text-2xl font-bold text-gray-900">
                  {trips.filter(trip => ['open', 'confirmed'].includes(trip.status)).length}
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
                <p className="text-sm font-medium text-gray-600">Filtered Results</p>
                <p className="text-2xl font-bold text-gray-900">{filteredAndSortedTrips.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <TripFilters
        filters={filters}
        onFiltersChange={setFilters}
        activeFiltersCount={activeFiltersCount}
      />

      <TripListTableCompact
        trips={filteredAndSortedTrips}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onViewParticipants={handleViewParticipants}
        onViewResources={handleViewResources}
        onViewReadiness={handleViewReadiness}
        onNavigateToResourceScheduling={onNavigateToResourceScheduling}
        isSuperAdmin={isSuperAdmin}
        deleting={deleting}
      />

      <TripFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          setSubmitError(null)
        }}
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
        error={submitError}
      />

      <TripFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSubmitError(null)
        }}
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
        error={submitError}
      />

      <TripFormModal
        isOpen={isDuplicateModalOpen}
        onClose={() => {
          setIsDuplicateModalOpen(false)
          setSubmitError(null)
        }}
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
        error={submitError}
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

      <TripResourcesModal
        isOpen={isResourcesModalOpen}
        onClose={() => setIsResourcesModalOpen(false)}
        trip={selectedTrip}
      />

    </div>
  )
}