import React, { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Bus, UserCheck, Users, MapPin, AlertCircle, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'
import { id as idLocale } from 'date-fns/locale'

interface TripResourcesModalProps {
  isOpen: boolean
  onClose: () => void
  trip: any
}

export function TripResourcesModal({
  isOpen,
  onClose,
  trip
}: TripResourcesModalProps) {
  const [resources, setResources] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && trip?.id) {
      fetchTripResources()
    }
  }, [isOpen, trip?.id])

  const fetchTripResources = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('resource_schedules')
        .select(`
          *,
          buses (
            id,
            plate_number,
            model,
            capacity
          ),
          drivers (
            id,
            name,
            license_number
          ),
          tour_leaders (
            id,
            name,
            experience_years
          )
        `)
        .eq('trip_id', trip.id)
        .order('pickup_datetime', { ascending: true })

      if (error) throw error
      setResources(data || [])
    } catch (error) {
      console.error('Error fetching trip resources:', error)
    } finally {
      setLoading(false)
    }
  }

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'bus': return <Bus className="h-4 w-4 text-blue-600" />
      case 'driver': return <UserCheck className="h-4 w-4 text-green-600" />
      case 'tour_leader': return <Users className="h-4 w-4 text-purple-600" />
      default: return null
    }
  }

  const getResourceLabel = (type: string) => {
    switch (type) {
      case 'bus': return 'Bus'
      case 'driver': return 'Driver'
      case 'tour_leader': return 'Tour Leader'
      default: return type
    }
  }

  const getResourceName = (resource: any) => {
    if (resource.resource_type === 'bus' && resource.buses) {
      return resource.buses.plate_number
    } else if (resource.resource_type === 'driver' && resource.drivers) {
      return resource.drivers.name
    } else if (resource.resource_type === 'tour_leader' && resource.tour_leaders) {
      return resource.tour_leaders.name
    }
    return 'N/A'
  }

  const getResourceDetails = (resource: any) => {
    if (resource.resource_type === 'bus' && resource.buses) {
      return `${resource.buses.model || '-'} (${resource.buses.capacity || '-'} kursi)`
    } else if (resource.resource_type === 'driver' && resource.drivers) {
      return `SIM: ${resource.drivers.license_number || '-'}`
    } else if (resource.resource_type === 'tour_leader' && resource.tour_leaders) {
      return `${resource.tour_leaders.experience_years || '-'} tahun pengalaman`
    }
    return '-'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-yellow-100 text-yellow-800'
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'in_progress': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const groupedResources = resources.reduce((acc, resource) => {
    const type = resource.resource_type
    if (!acc[type]) acc[type] = []
    acc[type].push(resource)
    return acc
  }, {} as Record<string, any[]>)

  const stats = {
    buses: resources.filter(r => r.resource_type === 'bus').length,
    drivers: resources.filter(r => r.resource_type === 'driver').length,
    tourLeaders: resources.filter(r => r.resource_type === 'tour_leader').length,
    total: resources.length
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Bus className="h-5 w-5 text-blue-600" />
            <span>Sumber Daya Trip: {trip?.name}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Stats Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Resource</div>
              <div className="text-2xl font-bold">{stats.total}</div>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 flex items-center space-x-1">
                <Bus className="h-4 w-4" />
                <span>Bus</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{stats.buses}</div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 flex items-center space-x-1">
                <UserCheck className="h-4 w-4" />
                <span>Driver</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{stats.drivers}</div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg">
              <div className="text-sm text-purple-600 flex items-center space-x-1">
                <Users className="h-4 w-4" />
                <span>Tour Leader</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{stats.tourLeaders}</div>
            </div>
          </div>

          {/* Resources Table */}
          {loading ? (
            <div className="text-center py-12 text-gray-500">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p>Memuat data sumber daya...</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Belum ada sumber daya</h3>
              <p className="text-sm">
                Trip ini belum memiliki assignment bus, driver, atau tour leader
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Buses */}
              {groupedResources.bus && groupedResources.bus.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                    <Bus className="h-5 w-5 text-blue-600" />
                    <span>Bus ({groupedResources.bus.length})</span>
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Plat Nomor</TableHead>
                        <TableHead>Detail</TableHead>
                        <TableHead>Meeting Point</TableHead>
                        <TableHead>Jadwal Penjemputan</TableHead>
                        <TableHead>Jadwal Kepulangan</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedResources.bus.map((resource) => (
                        <TableRow key={resource.id}>
                          <TableCell className="font-medium">
                            {getResourceName(resource)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {getResourceDetails(resource)}
                          </TableCell>
                          <TableCell>
                            {resource.meeting_point_name ? (
                              <div className="flex items-center space-x-1 text-sm">
                                <MapPin className="h-3 w-3 text-blue-600" />
                                <span>{resource.meeting_point_name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>{format(new Date(resource.pickup_datetime), 'dd MMM HH:mm', { locale: idLocale })}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>{format(new Date(resource.return_datetime), 'dd MMM HH:mm', { locale: idLocale })}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(resource.status)}>
                              {resource.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Drivers */}
              {groupedResources.driver && groupedResources.driver.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    <span>Driver ({groupedResources.driver.length})</span>
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Driver</TableHead>
                        <TableHead>Detail</TableHead>
                        <TableHead>Meeting Point</TableHead>
                        <TableHead>Jadwal Penjemputan</TableHead>
                        <TableHead>Jadwal Kepulangan</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedResources.driver.map((resource) => (
                        <TableRow key={resource.id}>
                          <TableCell className="font-medium">
                            {getResourceName(resource)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {getResourceDetails(resource)}
                          </TableCell>
                          <TableCell>
                            {resource.meeting_point_name ? (
                              <div className="flex items-center space-x-1 text-sm">
                                <MapPin className="h-3 w-3 text-green-600" />
                                <span>{resource.meeting_point_name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>{format(new Date(resource.pickup_datetime), 'dd MMM HH:mm', { locale: idLocale })}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>{format(new Date(resource.return_datetime), 'dd MMM HH:mm', { locale: idLocale })}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(resource.status)}>
                              {resource.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Tour Leaders */}
              {groupedResources.tour_leader && groupedResources.tour_leader.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    <span>Tour Leader ({groupedResources.tour_leader.length})</span>
                  </h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nama Tour Leader</TableHead>
                        <TableHead>Detail</TableHead>
                        <TableHead>Meeting Point</TableHead>
                        <TableHead>Jadwal Penjemputan</TableHead>
                        <TableHead>Jadwal Kepulangan</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedResources.tour_leader.map((resource) => (
                        <TableRow key={resource.id}>
                          <TableCell className="font-medium">
                            {getResourceName(resource)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {getResourceDetails(resource)}
                          </TableCell>
                          <TableCell>
                            {resource.meeting_point_name ? (
                              <div className="flex items-center space-x-1 text-sm">
                                <MapPin className="h-3 w-3 text-purple-600" />
                                <span>{resource.meeting_point_name}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>{format(new Date(resource.pickup_datetime), 'dd MMM HH:mm', { locale: idLocale })}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>{format(new Date(resource.return_datetime), 'dd MMM HH:mm', { locale: idLocale })}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(resource.status)}>
                              {resource.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
