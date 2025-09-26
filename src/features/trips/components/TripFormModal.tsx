import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { SimpleMultiSelect } from '@/components/ui/simple-multi-select'
import { Plus } from 'lucide-react'

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
        tour_leader_ids: initialData.tour_leaders?.map((tl: any) => tl.id) || initialData.tour_leader_ids || [],
        bus_ids: initialData.buses?.map((bus: any) => bus.id) || initialData.bus_ids || [],
        driver_ids: initialData.drivers?.map((driver: any) => driver.id) || initialData.driver_ids || [],
        pricing_type: initialData.pricing_type || 'per_person',
        cost_plan_id: initialData.cost_plan_id || '',
        status: initialData.status || 'active'
      })
    }
  }, [initialData])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSubmit(formData)
  }

  if (!isOpen) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl pt-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="max-h-[calc(90vh-120px)] overflow-y-auto px-4">
          <form id="trip-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tour_leader_ids">Tour Leaders</Label>
                <div className="relative z-10">
                  <SimpleMultiSelect
                    options={tourLeaders.filter(leader => leader.status === 'active').map(leader => ({
                      label: leader.name,
                      value: leader.id
                    }))}
                    selected={formData.tour_leader_ids}
                    onChange={(selected) => handleInputChange('tour_leader_ids', selected)}
                    placeholder="Select tour leaders"
                  />
                </div>
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
                <div className="relative z-10">
                  <SimpleMultiSelect
                    options={buses.filter(bus => bus.status === 'active').map(bus => ({
                      label: `${bus.plate_number} - ${bus.model || 'N/A'} (${bus.capacity || 0} kursi)`,
                      value: bus.id
                    }))}
                    selected={formData.bus_ids}
                    onChange={(selected) => handleInputChange('bus_ids', selected)}
                    placeholder="Pilih kendaraan"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="driver_ids">Driver</Label>
                <div className="relative z-10">
                  <SimpleMultiSelect
                    options={drivers.filter(driver => driver.status === 'active').map(driver => ({
                      label: `${driver.name} - ${driver.license_number || 'N/A'}`,
                      value: driver.id
                    }))}
                    selected={formData.driver_ids}
                    onChange={(selected) => handleInputChange('driver_ids', selected)}
                    placeholder="Pilih driver"
                  />
                </div>
              </div>
            </div>
            </div>
          </form>
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