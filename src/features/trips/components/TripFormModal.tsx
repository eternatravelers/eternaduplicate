import React, { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Bus, UserCheck, Info, Users, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MeetingPointSelector } from './MeetingPointSelector'
import { useResourceSchedules } from '@/hooks/useResourceSchedules'

interface TripFormModalProps {
  isOpen: boolean
  onClose: () => void
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  tourLeaders: any[]
  destinations: any[]
  costPlans: any[]
  tripTypes: any[]
  buses: any[]
  drivers: any[]
  creating: boolean
  updating: boolean
  onAddTripType: () => void
  title: string
}

export function TripFormModal({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  tourLeaders,
  destinations,
  costPlans,
  tripTypes,
  buses,
  drivers,
  creating,
  updating,
  onAddTripType,
  title
}: TripFormModalProps) {
  const [activeTab, setActiveTab] = useState('basic')

  const [formData, setFormData] = useState<any>({
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
    status: 'active',
    meeting_point_ids: [],
    primary_meeting_point_id: undefined
  })

  const tripId = initialData?.id
  const { schedules: resourceSchedules } = useResourceSchedules({ tripId: tripId || undefined })

  // Group resources from resource schedules
  const assignedResources = useMemo(() => {
    const tourLeaders = resourceSchedules
      .filter(s => s.resource_type === 'tour_leader' && ['scheduled', 'confirmed', 'in_progress'].includes(s.status))
      .map(s => s.tour_leaders)
      .filter((tl, index, self) => tl && self.findIndex(t => t?.name === tl?.name) === index)

    const buses = resourceSchedules
      .filter(s => s.resource_type === 'bus' && ['scheduled', 'confirmed', 'in_progress'].includes(s.status))
      .map(s => s.buses)
      .filter((b, index, self) => b && self.findIndex(bus => bus?.plate_number === b?.plate_number) === index)

    const drivers = resourceSchedules
      .filter(s => s.resource_type === 'driver' && ['scheduled', 'confirmed', 'in_progress'].includes(s.status))
      .map(s => s.drivers)
      .filter((d, index, self) => d && self.findIndex(drv => drv?.name === d?.name) === index)

    return { tourLeaders, buses, drivers }
  }, [resourceSchedules])

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        trip_type: initialData.trip_type || '',
        departure_date: initialData.departure_date || '',
        return_date: initialData.return_date || '',
        meeting_point: initialData.meeting_point || '',
        quota: initialData.quota || '',
        price: initialData.price || '',
        additional_facilities: initialData.additional_facilities || '',
        tour_leader_ids: [],
        bus_ids: [],
        driver_ids: [],
        pricing_type: initialData.pricing_type || 'per_person',
        cost_plan_id: initialData.cost_plan_id || '',
        status: initialData.status || 'active',
        meeting_point_ids: initialData.meeting_point_ids || [],
        primary_meeting_point_id: initialData.primary_meeting_point_id
      })
    } else {
      setActiveTab('basic')
    }
  }, [initialData])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  const isEditMode = !!initialData

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <div className="max-h-[calc(90vh-120px)] overflow-y-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-1">
              <TabsTrigger value="basic">
                <Info className="h-4 w-4 mr-2" />
                Informasi Dasar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <form id="trip-form" onSubmit={handleSubmit} className="space-y-6">
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
                      onClick={onAddTripType}
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
              </div>

              {/* Resource Assignment Display (Read-only) */}
              {initialData && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <Label className="text-base font-semibold">Sumber Daya yang Ditugaskan</Label>
                  <div className="text-sm text-gray-600 mb-3">
                    Assignment sumber daya dilakukan di halaman "Resource Scheduling"
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium flex items-center space-x-1">
                        <UserCheck className="h-3 w-3" />
                        <span>Tour Leaders</span>
                      </Label>
                      <div className="mt-2 space-y-1">
                        {assignedResources.tourLeaders && assignedResources.tourLeaders.length > 0 ? (
                          assignedResources.tourLeaders.map((tl: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="mr-1 mb-1">
                              {tl?.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Belum ada assignment</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium flex items-center space-x-1">
                        <Bus className="h-3 w-3" />
                        <span>Kendaraan</span>
                      </Label>
                      <div className="mt-2 space-y-1">
                        {assignedResources.buses && assignedResources.buses.length > 0 ? (
                          assignedResources.buses.map((bus: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="mr-1 mb-1">
                              {bus?.plate_number}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Belum ada assignment</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-medium flex items-center space-x-1">
                        <UserCheck className="h-3 w-3" />
                        <span>Driver</span>
                      </Label>
                      <div className="mt-2 space-y-1">
                        {assignedResources.drivers && assignedResources.drivers.length > 0 ? (
                          assignedResources.drivers.map((driver: any, idx: number) => (
                            <Badge key={idx} variant="outline" className="mr-1 mb-1">
                              {driver?.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-500">Belum ada assignment</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="completed">Selesai</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <MeetingPointSelector
                selectedMeetingPointIds={formData.meeting_point_ids}
                primaryMeetingPointId={formData.primary_meeting_point_id}
                onChange={(selectedIds, primaryId) => {
                  setFormData((prev: any) => ({
                    ...prev,
                    meeting_point_ids: selectedIds,
                    primary_meeting_point_id: primaryId
                  }))
                }}
              />
              
              <div>
                <Label htmlFor="additional_facilities">Additional Facilities</Label>
                <Textarea
                  id="additional_facilities"
                  value={formData.additional_facilities}
                  onChange={(e) => handleInputChange('additional_facilities', e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!initialData && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Langkah Selanjutnya</p>
                        <p>
                          Setelah trip dibuat, Anda dapat:
                        </p>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Assign transportasi per meeting point di tab Transportasi</li>
                          <li>Atur jadwal penjemputan di tab Jadwal</li>
                          <li>Assign tour leader di halaman Sumber Daya Operasional</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </form>
          </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="px-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="trip-form" disabled={creating || updating}>
            {creating || updating ? 'Saving...' : 'Save Trip'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}