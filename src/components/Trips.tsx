import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Plus, Edit, Trash2, MapPin, Calendar, Users, DollarSign, Copy, Settings } from 'lucide-react'
import { SimpleMultiSelect } from '@/components/ui/simple-multi-select'
import { MultiSelect } from '@/components/ui/multi-select'
import { useTrips, useCreateTrip, useUpdateTrip, useDeleteTrip } from '@/hooks/useTrips'
import { useTourLeaders } from '@/hooks/useTourLeaders'
import { useDestinations } from '@/hooks/useDestinations'
import { useCostPlans } from '@/hooks/useCostPlans'
import { useTripTypes, useCreateTripType, useDeleteTripType } from '@/hooks/useTripTypes'
import { useBuses } from '@/hooks/useBuses'
import { useDrivers } from '@/hooks/useDrivers'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export function Trips() {
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
  const [newTripTypeName, setNewTripTypeName] = useState('')
  const { isSuperAdmin } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    trip_type: '',
    departure_date: '',
    return_date: '',
    meeting_point: '',
    quota: '',
    price: '',
    additional_facilities: '',
    tour_leader_ids: [],
    bus_ids: [],
    driver_ids: [],
    pricing_type: 'per_person',
    cost_plan_id: '',
    status: 'active'
  })

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      resetForm()
      refetch()
    } catch (error) {
      console.error('Error saving trip:', error)
    }
  }

  const handleEdit = (trip: any) => {
    setSelectedTrip(trip)
    setFormData({
      name: trip.name || '',
      trip_type: trip.trip_type || '',
      departure_date: trip.departure_date || '',
      return_date: trip.return_date || '',
      meeting_point: trip.meeting_point || '',
      quota: trip.quota || '',
      price: trip.price || '',
      additional_facilities: trip.additional_facilities || '',
      tour_leader_ids: trip.tour_leaders?.map((tl: any) => tl.id) || [],
      bus_ids: trip.buses?.map((bus: any) => bus.id) || [],
      driver_ids: trip.drivers?.map((driver: any) => driver.id) || [],
      pricing_type: trip.pricing_type || 'per_person',
      cost_plan_id: trip.cost_plan_id || '',
      status: trip.status || 'active'
    })
    setIsEditModalOpen(true)
  }

  const handleDuplicate = (trip: any) => {
    setSelectedTrip(trip)
    
    // Generate new dates (add 1 month to original dates)
    const originalDeparture = new Date(trip.departure_date)
    const originalReturn = new Date(trip.return_date)
    const newDeparture = new Date(originalDeparture)
    const newReturn = new Date(originalReturn)
    
    newDeparture.setMonth(newDeparture.getMonth() + 1)
    newReturn.setMonth(newReturn.getMonth() + 1)
    
    setFormData({
      name: `${trip.name} (Copy)`,
      trip_type: trip.trip_type || '',
      departure_date: newDeparture.toISOString().split('T')[0],
      return_date: newReturn.toISOString().split('T')[0],
      meeting_point: trip.meeting_point || '',
      quota: trip.quota || '',
      price: trip.price || '',
      additional_facilities: trip.additional_facilities || '',
      tour_leader_ids: trip.tour_leaders?.map((tl: any) => tl.id) || [],
      bus_ids: [], // Clear buses for new trip
      driver_ids: [], // Clear drivers for new trip
      pricing_type: trip.pricing_type || 'per_person',
      cost_plan_id: trip.cost_plan_id || '',
      status: 'active'
    })
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

  const resetForm = () => {
    setFormData({
      name: '',
      trip_type: '',
      departure_date: '',
      return_date: '',
      meeting_point: '',
      quota: '',
      price: '',
      additional_facilities: '',
      tour_leader_ids: [],
      bus_ids: [],
      driver_ids: [],
      pricing_type: 'per_person',
      cost_plan_id: '',
      status: 'active'
    })
    setSelectedTrip(null)
  }

  const handleAddTripType = async () => {
    if (!newTripTypeName.trim()) return
    
    try {
      const { error } = await createTripType(newTripTypeName.trim())
      if (!error) {
        setIsAddTripTypeModalOpen(false)
        setNewTripTypeName('')
        refetchTripTypes()
      }
    } catch (error) {
      console.error('Error adding trip type:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusColors = {
      active: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      draft: 'bg-gray-100 text-gray-800'
    }
    return statusColors[status as keyof typeof statusColors] || statusColors.draft
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
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

      <Card>
        <CardHeader>
          <CardTitle>All Trips</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Departure</TableHead>
                <TableHead>Return</TableHead>
                <TableHead>Quota</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Cost Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kendaraan</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">{trip.name}</TableCell>
                  <TableCell>{trip.trip_type}</TableCell>
                  <TableCell>{formatDate(trip.departure_date)}</TableCell>
                  <TableCell>{formatDate(trip.return_date)}</TableCell>
                  <TableCell>{trip.quota}</TableCell>
                  <TableCell>{formatCurrency(trip.price || 0)}</TableCell>
                  <TableCell>
                    {trip.cost_plans ? (
                      <div className="text-sm">
                        <div className="font-medium text-green-600">{trip.cost_plans.name}</div>
                        <div className="text-gray-500">
                          {formatCurrency(trip.cost_plans.cost_per_person || 0)}/orang
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(trip.status)}>
                      {trip.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {trip.buses && trip.buses.length > 0 ? (
                      <div className="text-sm">
                        {trip.buses.map((bus, index) => (
                          <div key={bus.id} className={index > 0 ? 'mt-1 pt-1 border-t' : ''}>
                            <div className="font-medium">{bus.plate_number}</div>
                            <div className="text-gray-500">{bus.model || 'N/A'}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">Belum ditentukan</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {trip.drivers && trip.drivers.length > 0 ? (
                      <div className="text-sm">
                        {trip.drivers.map((driver, index) => (
                          <div key={driver.id} className={index > 0 ? 'mt-1 pt-1 border-t' : ''}>
                            <div className="font-medium">{driver.name}</div>
                            <div className="text-gray-500">{driver.phone || 'N/A'}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">Belum ditentukan</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(trip)}
                        title="Edit Trip"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicate(trip)}
                        title="Duplicate Trip"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      {isSuperAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" title="Delete Trip">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this trip? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(trip.id)}
                                disabled={deleting}
                              >
                                {deleting ? 'Deleting...' : 'Delete'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Trip Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Trip</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Trip Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="trip_type">Trip Type</Label>
                  <div className="flex space-x-2">
                    <Select value={formData.trip_type} onValueChange={(value) => handleInputChange('trip_type', value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Pilih tipe trip" />
                      </SelectTrigger>
                      <SelectContent>
                        {tripTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsAddTripTypeModalOpen(true)}
                      title="Tambah tipe trip baru"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="departure_date">Departure Date</Label>
                  <Input
                    id="departure_date"
                    type="date"
                    value={formData.departure_date}
                    onChange={(e) => handleInputChange('departure_date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="return_date">Return Date</Label>
                  <Input
                    id="return_date"
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => handleInputChange('return_date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="quota">Quota</Label>
                  <Input
                    id="quota"
                    type="number"
                    value={formData.quota}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value)
                      handleInputChange('quota', isNaN(val) ? '' : val)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                      handleInputChange('price', isNaN(val) ? '' : val)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="tour_leader_ids">Tour Leaders</Label>
                  <MultiSelect
                    options={tourLeaders.map(leader => ({
                      label: leader.name,
                      value: leader.id
                    }))}
                    selected={formData.tour_leader_ids}
                    onChange={(selected) => handleInputChange('tour_leader_ids', selected)}
                    placeholder="Select tour leaders"
                  />
                </div>
                <div>
                  <Label htmlFor="cost_plan_id">Cost Plan</Label>
                  <Select value={formData.cost_plan_id} onValueChange={(value) => handleInputChange('cost_plan_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cost plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {costPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="meeting_point">Meeting Point</Label>
                <Input
                  id="meeting_point"
                  value={formData.meeting_point}
                  onChange={(e) => handleInputChange('meeting_point', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="additional_facilities">Additional Facilities</Label>
                <Textarea
                  id="additional_facilities"
                  value={formData.additional_facilities}
                  onChange={(e) => handleInputChange('additional_facilities', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bus_ids">Kendaraan</Label>
                  <MultiSelect
                    options={buses.map(bus => ({
                      label: `${bus.plate_number} - ${bus.model || 'N/A'} (${bus.capacity || 0} kursi)`,
                      value: bus.id
                    }))}
                    selected={formData.bus_ids}
                    onChange={(selected) => handleInputChange('bus_ids', selected)}
                    placeholder="Pilih kendaraan"
                  />
                </div>
                <div>
                  <Label htmlFor="driver_ids">Driver</Label>
                  <MultiSelect
                    options={drivers.map(driver => ({
                      label: `${driver.name} - ${driver.license_number || 'N/A'}`,
                      value: driver.id
                    }))}
                    selected={formData.driver_ids}
                    onChange={(selected) => handleInputChange('driver_ids', selected)}
                    placeholder="Pilih driver"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateModalOpen(false)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Creating...' : 'Create Trip'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Trip Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Edit Trip</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_name">Trip Name</Label>
                  <Input
                    id="edit_name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_trip_type">Trip Type</Label>
                  <div className="flex space-x-2">
                    <Select value={formData.trip_type} onValueChange={(value) => handleInputChange('trip_type', value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Pilih tipe trip" />
                      </SelectTrigger>
                      <SelectContent>
                        {tripTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsAddTripTypeModalOpen(true)}
                      title="Tambah tipe trip baru"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="edit_departure_date">Departure Date</Label>
                  <Input
                    id="edit_departure_date"
                    type="date"
                    value={formData.departure_date}
                    onChange={(e) => handleInputChange('departure_date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_return_date">Return Date</Label>
                  <Input
                    id="edit_return_date"
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => handleInputChange('return_date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="edit_quota">Quota</Label>
                  <Input
                    id="edit_quota"
                    type="number"
                    value={formData.quota}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value)
                      handleInputChange('quota', isNaN(val) ? '' : val)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_price">Price</Label>
                  <Input
                    id="edit_price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                      handleInputChange('price', isNaN(val) ? '' : val)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_tour_leader_ids">Tour Leaders</Label>
                  <SimpleMultiSelect
                    options={tourLeaders.map(leader => ({
                      label: leader.name,
                      value: leader.id
                    }))}
                    selected={formData.tour_leader_ids}
                    onChange={(selected) => handleInputChange('tour_leader_ids', selected)}
                    placeholder="Select tour leaders"
                  />
                  <Select value={formData.cost_plan_id} onValueChange={(value) => handleInputChange('cost_plan_id', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select cost plan" />
                    </SelectTrigger>
                    <SelectContent>
                      {costPlans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="edit_meeting_point">Meeting Point</Label>
                <Input
                  id="edit_meeting_point"
                  value={formData.meeting_point}
                  onChange={(e) => handleInputChange('meeting_point', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit_additional_facilities">Additional Facilities</Label>
                <Textarea
                  id="edit_additional_facilities"
                  value={formData.additional_facilities}
                  onChange={(e) => handleInputChange('additional_facilities', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit_bus_ids">Kendaraan</Label>
                  <SimpleMultiSelect
                    options={buses.map(bus => ({
                      label: `${bus.plate_number} - ${bus.model || 'N/A'} (${bus.capacity || 0} kursi)`,
                      value: bus.id
                    }))}
                    selected={formData.bus_ids}
                    onChange={(selected) => handleInputChange('bus_ids', selected)}
                    placeholder="Pilih kendaraan"
                  />
                  <MultiSelect
                    options={drivers.map(driver => ({
                      label: `${driver.name} - ${driver.license_number || 'N/A'}`,
                      value: driver.id
                    }))}
                    selected={formData.driver_ids}
                    onChange={(selected) => handleInputChange('driver_ids', selected)}
                    placeholder="Pilih driver"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit_status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsEditModalOpen(false)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updating}>
                  {updating ? 'Updating...' : 'Update Trip'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Trip Modal */}
      {isDuplicateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center space-x-2 mb-4">
              <Copy className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold">Duplicate Trip</h2>
            </div>
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Duplicating:</strong> {selectedTrip?.name}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Dates have been automatically adjusted (+1 month). Bus and driver details have been cleared for the new trip.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duplicate_name">Trip Name</Label>
                  <Input
                    id="duplicate_name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duplicate_trip_type">Trip Type</Label>
                  <div className="flex space-x-2">
                    <Select value={formData.trip_type} onValueChange={(value) => handleInputChange('trip_type', value)}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Pilih tipe trip" />
                      </SelectTrigger>
                      <SelectContent>
                        {tripTypes.map((type) => (
                          <SelectItem key={type.id} value={type.name}>
                            {type.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsAddTripTypeModalOpen(true)}
                      title="Tambah tipe trip baru"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="duplicate_departure_date">Departure Date</Label>
                  <Input
                    id="duplicate_departure_date"
                    type="date"
                    value={formData.departure_date}
                    onChange={(e) => handleInputChange('departure_date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duplicate_return_date">Return Date</Label>
                  <Input
                    id="duplicate_return_date"
                    type="date"
                    value={formData.return_date}
                    onChange={(e) => handleInputChange('return_date', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="duplicate_quota">Quota</Label>
                  <Input
                    id="duplicate_quota"
                    type="number"
                    value={formData.quota}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value)
                      handleInputChange('quota', isNaN(val) ? '' : val)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="duplicate_price">Price</Label>
                  <Input
                    id="duplicate_price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                      handleInputChange('price', isNaN(val) ? '' : val)
                    }}
                  />
                </div>
                <div>
                  <Label htmlFor="duplicate_tour_leader_ids">Tour Leaders</Label>
                  <SimpleMultiSelect
                    options={tourLeaders.map(leader => ({
                      label: leader.name,
                      value: leader.id
                    }))}
                    selected={formData.tour_leader_ids}
                    onChange={(selected) => handleInputChange('tour_leader_ids', selected)}
                    placeholder="Select tour leaders"
                  />
                  <SimpleMultiSelect
                    options={drivers.map(driver => ({
                      label: `${driver.name} - ${driver.license_number || 'N/A'}`,
                      value: driver.id
                    }))}
                    selected={formData.driver_ids}
                    onChange={(selected) => handleInputChange('driver_ids', selected)}
                    placeholder="Pilih driver"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="duplicate_meeting_point">Meeting Point</Label>
                <Input
                  id="duplicate_meeting_point"
                  value={formData.meeting_point}
                  onChange={(e) => handleInputChange('meeting_point', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="duplicate_additional_facilities">Additional Facilities</Label>
                <Textarea
                  id="duplicate_additional_facilities"
                  value={formData.additional_facilities}
                  onChange={(e) => handleInputChange('additional_facilities', e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duplicate_bus_ids">Kendaraan (Baru)</Label>
                  <SimpleMultiSelect
                    options={buses.map(bus => ({
                      label: `${bus.plate_number} - ${bus.model || 'N/A'} (${bus.capacity || 0} kursi)`,
                      value: bus.id
                    }))}
                    selected={formData.bus_ids}
                    onChange={(selected) => handleInputChange('bus_ids', selected)}
                    placeholder="Pilih kendaraan baru"
                  />
                </div>
                <div>
                  <Label htmlFor="duplicate_driver_ids">Driver (Baru)</Label>
                  <SimpleMultiSelect
                    options={drivers.map(driver => ({
                      label: `${driver.name} - ${driver.license_number || 'N/A'}`,
                      value: driver.id
                    }))}
                    selected={formData.driver_ids}
                    onChange={(selected) => handleInputChange('driver_ids', selected)}
                    placeholder="Pilih driver baru"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsDuplicateModalOpen(false)
                  resetForm()
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={creating} className="bg-blue-600 hover:bg-blue-700">
                  {creating ? 'Duplicating...' : 'Create Duplicate Trip'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Trip Type Modal */}
      <AlertDialog open={isAddTripTypeModalOpen} onOpenChange={setIsAddTripTypeModalOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Kelola Tipe Trip</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Tambahkan tipe trip baru atau kelola tipe trip yang sudah ada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-6">
            {/* Add New Trip Type Section */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Tambah Tipe Trip Baru</Label>
              <div className="flex space-x-2">
                <Input
                  value={newTripTypeName}
                  onChange={(e) => setNewTripTypeName(e.target.value)}
                  placeholder="Contoh: Family Trip, Adventure Trip"
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddTripType()
                    }
                  }}
                />
                <Button 
                  onClick={handleAddTripType}
                  disabled={!newTripTypeName.trim() || creatingTripType}
                  size="sm"
                >
                  {creatingTripType ? 'Menambahkan...' : 'Tambah'}
                </Button>
              </div>
            </div>

            {/* Existing Trip Types Section */}
            {tripTypes.length > 0 && (
              <div className="space-y-3">
                <Label className="text-base font-semibold">Tipe Trip Yang Ada</Label>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {tripTypes.map((type) => (
                    <div key={type.id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
                      <span className="font-medium">{type.name}</span>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            disabled={deletingTripType}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Hapus Tipe Trip</AlertDialogTitle>
                            <AlertDialogDescription>
                              Apakah Anda yakin ingin menghapus tipe trip "{type.name}"? 
                              Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi trip yang menggunakan tipe ini.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Batal</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteTripType(type.id, type.name)}
                              disabled={deletingTripType}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              {deletingTripType ? 'Menghapus...' : 'Hapus'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel 
              onClick={() => {
                setNewTripTypeName('')
                setIsAddTripTypeModalOpen(false)
              }}
            >
              Tutup
            </AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}