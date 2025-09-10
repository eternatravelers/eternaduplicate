import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { CheckSquare, Upload, Users, FileText, Plus, Search, Calendar, Clock, AlertTriangle, MapPin, Bus, UserCheck, Phone, Mail, TrendingUp, Activity, Calculator, DollarSign } from 'lucide-react'
import { useTrips } from '@/hooks/useTrips'
import { useTourLeaders } from '@/hooks/useTourLeaders'
import { formatShortDate, formatCurrency } from '@/lib/utils'

export function Operations() {
  const [activeTab, setActiveTab] = useState('monitoring')
  const [searchTerm, setSearchTerm] = useState('')
  const [checklistItems, setChecklistItems] = useState([
    { id: 1, item: 'Konfirmasi bus dan driver', completed: true, priority: 'high' },
    { id: 2, item: 'Cek kondisi kendaraan', completed: true, priority: 'high' },
    { id: 3, item: 'Persiapan konsumsi', completed: false, priority: 'medium' },
    { id: 4, item: 'Briefing tour leader', completed: false, priority: 'high' },
    { id: 5, item: 'Konfirmasi hotel/penginapan', completed: false, priority: 'medium' },
    { id: 6, item: 'Persiapan dokumentasi', completed: false, priority: 'low' }
  ])

  const [documents, setDocuments] = useState([
    { id: 1, name: 'KTP Peserta', type: 'ID', status: 'complete', count: 15 },
    { id: 2, name: 'Surat Kesehatan', type: 'Health', status: 'pending', count: 8 },
    { id: 3, name: 'Asuransi Perjalanan', type: 'Insurance', status: 'complete', count: 15 },
    { id: 4, name: 'Formulir Pendaftaran', type: 'Registration', status: 'complete', count: 15 }
  ])

  const [emergencyContacts, setEmergencyContacts] = useState([
    { id: 1, name: 'Dr. Ahmad Wijaya', role: 'Dokter', phone: '08123456789', location: 'Jakarta' },
    { id: 2, name: 'Polsek Setempat', role: 'Kepolisian', phone: '08198765432', location: 'Bandung' },
    { id: 3, name: 'RS Umum Daerah', role: 'Rumah Sakit', phone: '08111222333', location: 'Bandung' }
  ])

  const { trips, loading: tripsLoading } = useTrips()
  const { tourLeaders } = useTourLeaders()

  // Filter trips for monitoring
  const activeTrips = trips.filter(trip => {
    const today = new Date()
    const departureDate = new Date(trip.departure_date)
    const returnDate = new Date(trip.return_date)
    
    return trip.status === 'active' && (
      departureDate >= today || // Future trips
      (departureDate <= today && returnDate >= today) // Currently running trips
    )
  })

  const upcomingTrips = activeTrips.filter(trip => {
    const today = new Date()
    const departureDate = new Date(trip.departure_date)
    return departureDate > today
  })

  const ongoingTrips = activeTrips.filter(trip => {
    const today = new Date()
    const departureDate = new Date(trip.departure_date)
    const returnDate = new Date(trip.return_date)
    return departureDate <= today && returnDate >= today
  })

  const filteredTrips = activeTrips.filter(trip =>
    trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    trip.destinations?.some(d => d.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getTripStatus = (trip: any) => {
    const today = new Date()
    const departureDate = new Date(trip.departure_date)
    const returnDate = new Date(trip.return_date)
    
    if (departureDate > today) {
      const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      if (daysUntilDeparture <= 7) {
        return { status: 'Persiapan Final', color: 'bg-yellow-500', description: `${daysUntilDeparture} hari lagi` }
      } else if (daysUntilDeparture <= 30) {
        return { status: 'Persiapan', color: 'bg-blue-500', description: `${daysUntilDeparture} hari lagi` }
      } else {
        return { status: 'Terjadwal', color: 'bg-gray-500', description: `${daysUntilDeparture} hari lagi` }
      }
    } else if (departureDate <= today && returnDate >= today) {
      return { status: 'Berjalan', color: 'bg-green-500', description: 'Sedang berlangsung' }
    } else {
      return { status: 'Selesai', color: 'bg-gray-400', description: 'Trip selesai' }
    }
  }

  const getTourLeaderName = (id: string) => {
    return tourLeaders.find(tl => tl.id === id)?.name || 'Belum ditentukan'
  }

  const getTourLeaderPhone = (id: string) => {
    return tourLeaders.find(tl => tl.id === id)?.phone || '-'
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">Tinggi</Badge>
      case 'medium':
        return <Badge className="bg-yellow-500">Sedang</Badge>
      case 'low':
        return <Badge variant="secondary">Rendah</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'complete':
        return <Badge className="bg-green-500">Lengkap</Badge>
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>
      case 'missing':
        return <Badge variant="destructive">Kurang</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (tripsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Operasional Management</h1>
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
          <h1 className="text-3xl font-bold">Operasional Management</h1>
          <p className="text-gray-600 mt-2">Monitor dan kelola operasional trip secara real-time</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>Real-time monitoring</span>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Trip Aktif
            </CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTrips.length}</div>
            <p className="text-xs text-gray-500">
              Total trip aktif
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Sedang Berjalan
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{ongoingTrips.length}</div>
            <p className="text-xs text-gray-500">
              Trip berlangsung
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Akan Berangkat
            </CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{upcomingTrips.length}</div>
            <p className="text-xs text-gray-500">
              Trip mendatang
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Peserta
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activeTrips.reduce((sum, trip) => sum + (trip.participant_count || 0), 0)}
            </div>
            <p className="text-xs text-gray-500">
              Peserta aktif
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring">Trip Monitoring</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="documents">Dokumen</TabsTrigger>
          <TabsTrigger value="emergency">Kontak Darurat</TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring" className="space-y-6">
          {/* Search and Filter */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Monitor Trip Aktif</span>
                </CardTitle>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari trip..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTrips.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <MapPin className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm ? 'Trip tidak ditemukan' : 'Belum ada trip aktif'}
                  </h3>
                  <p className="text-sm">
                    {searchTerm 
                      ? 'Coba gunakan kata kunci yang berbeda'
                      : 'Trip yang sedang berjalan atau akan berangkat akan muncul di sini'
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTrips.map((trip) => {
                    const tripStatus = getTripStatus(trip)
                    const progressPercentage = Math.min((trip.participant_count! / trip.quota) * 100, 100)
                    const tourLeaderName = getTourLeaderName(trip.tour_leader_id!)
                    const tourLeaderPhone = getTourLeaderPhone(trip.tour_leader_id!)
                    
                    return (
                      <Card key={trip.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="text-xl font-semibold text-gray-900">{trip.name}</h3>
                                <Badge className={tripStatus.color}>
                                  {tripStatus.status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <div className="text-gray-600 font-medium">Keberangkatan</div>
                                  <div className="flex items-center space-x-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>{formatShortDate(trip.departure_date)}</span>
                                  </div>
                                  <div className="text-xs text-gray-500">{tripStatus.description}</div>
                                </div>
                                
                                <div>
                                  <div className="text-gray-600 font-medium">Peserta</div>
                                  <div className="flex items-center space-x-1">
                                    <Users className="h-3 w-3" />
                                    <span>{trip.participant_count}/{trip.quota} orang</span>
                                  </div>
                                  <Progress value={progressPercentage} className="h-1 mt-1" />
                                </div>
                                
                                <div>
                                  <div className="text-gray-600 font-medium">Tour Leader</div>
                                  <div className="flex items-center space-x-1">
                                    <UserCheck className="h-3 w-3" />
                                    <span>{tourLeaderName}</span>
                                  </div>
                                  {tourLeaderPhone !== '-' && (
                                    <div className="flex items-center space-x-1 text-xs text-gray-500">
                                      <Phone className="h-2 w-2" />
                                      <span>{tourLeaderPhone}</span>
                                    </div>
                                  )}
                                </div>
                                
                                <div>
                                  <div className="text-gray-600 font-medium">Transportasi</div>
                                  <div className="flex items-center space-x-1">
                                    <Bus className="h-3 w-3" />
                                    <span>{trip.bus_number || 'Belum ditentukan'}</span>
                                  </div>
                                  {trip.driver_name && (
                                    <div className="text-xs text-gray-500">
                                      Driver: {trip.driver_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Destinations */}
                          {trip.destinations && trip.destinations.length > 0 && (
                            <div className="mb-4">
                              <div className="text-sm font-medium text-gray-600 mb-2">Destinasi:</div>
                              <div className="flex flex-wrap gap-1">
                                {trip.destinations.map((destination) => (
                                  <Badge key={destination.id} variant="outline" className="text-xs">
                                    <MapPin className="h-2 w-2 mr-1" />
                                    {destination.name}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Meeting Point */}
                          <div className="mb-4">
                            <div className="text-sm font-medium text-gray-600 mb-1">Titik Kumpul:</div>
                            <div className="text-sm text-gray-800">{trip.meeting_point}</div>
                          </div>

                          {/* Cost Plan Information */}
                          {trip.cost_plans && (
                            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center space-x-2 mb-2">
                                <Calculator className="h-4 w-4 text-green-600" />
                                <span className="text-sm font-medium text-green-800">Template Biaya: {trip.cost_plans.name}</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                                <div>
                                  <div className="text-gray-600">Estimasi Peserta</div>
                                  <div className="font-semibold">{trip.cost_plans.estimated_participants} orang</div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Total Biaya</div>
                                  <div className="font-semibold text-green-600">
                                    {formatCurrency(trip.cost_plans.total_cost || 0)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Biaya per Orang</div>
                                  <div className="font-semibold text-blue-600">
                                    {formatCurrency(trip.cost_plans.cost_per_person || 0)}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-gray-600">Kategori Biaya</div>
                                  <div className="font-semibold">
                                    {Array.isArray(trip.cost_plans.categories) ? trip.cost_plans.categories.length : 0} item
                                  </div>
                                </div>
                              </div>
                              
                              {/* Cost Categories Detail */}
                              {Array.isArray(trip.cost_plans.categories) && trip.cost_plans.categories.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-green-200">
                                  <div className="text-xs text-gray-600 mb-2">Rincian Biaya:</div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    {trip.cost_plans.categories.slice(0, 8).map((category: any, index: number) => (
                                      <div key={index} className="flex justify-between">
                                        <span className="text-gray-600 truncate">{category.name}:</span>
                                        <span className="font-medium ml-1">{formatCurrency(category.amount || 0)}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Financial Info */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-3 bg-gray-50 rounded-lg">
                            <div>
                              <div className="text-xs text-gray-600">Harga per Orang</div>
                              <div className="font-semibold text-green-600">
                                {formatCurrency(trip.price)}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Estimasi Revenue</div>
                              <div className="font-semibold text-blue-600">
                                {formatCurrency(trip.price * (trip.participant_count || 0))}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-600">Potensi Maksimal</div>
                              <div className="font-semibold text-purple-600">
                                {formatCurrency(trip.price * trip.quota)}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center justify-between mt-4 pt-4 border-t">
                            <div className="text-xs text-gray-500">
                              Dibuat: {formatShortDate(trip.created_at)}
                            </div>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline">
                                <FileText className="h-3 w-3 mr-1" />
                                Detail
                              </Button>
                              <Button size="sm" variant="outline">
                                <Phone className="h-3 w-3 mr-1" />
                                Kontak TL
                              </Button>
                              {trip.cost_plans && (
                                <Button size="sm" variant="outline">
                                  <Calculator className="h-3 w-3 mr-1" />
                                  Cost Plan
                                </Button>
                              )}
                              {tripStatus.status === 'Berjalan' && (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  <Activity className="h-3 w-3 mr-1" />
                                  Live Update
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5" />
                <span>Alert & Notifikasi</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingTrips.filter(trip => {
                  const daysUntil = Math.ceil((new Date(trip.departure_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return daysUntil <= 7
                }).map(trip => {
                  const daysUntil = Math.ceil((new Date(trip.departure_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <div key={trip.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">
                          {trip.name} berangkat dalam {daysUntil} hari
                        </span>
                      </div>
                      <p className="text-xs text-yellow-700 mt-1">
                        Pastikan semua persiapan sudah lengkap
                        {trip.cost_plans && ` - Template biaya: ${trip.cost_plans.name}`}
                      </p>
                    </div>
                  )
                })}
                
                {ongoingTrips.map(trip => (
                  <div key={trip.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">
                        {trip.name} sedang berlangsung
                      </span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">
                      Trip berjalan lancar, {trip.participant_count} peserta
                      {trip.cost_plans && ` - Budget: ${formatCurrency(trip.cost_plans.total_cost || 0)}`}
                    </p>
                  </div>
                ))}

                {activeTrips.length === 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CheckSquare className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Semua trip berjalan lancar
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-1">
                      Tidak ada alert yang memerlukan perhatian
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <CheckSquare className="h-5 w-5" />
                  <span>Checklist Keberangkatan</span>
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {checklistItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {
                          setChecklistItems(prev => 
                            prev.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i)
                          )
                        }}
                        className="h-4 w-4 text-blue-600 rounded"
                      />
                      <span className={`${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                        {item.item}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getPriorityBadge(item.priority)}
                      {item.completed && <Badge className="bg-green-500">Selesai</Badge>}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progress Checklist</span>
                  <span className="text-sm text-gray-600">
                    {checklistItems.filter(i => i.completed).length}/{checklistItems.length} selesai
                  </span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${(checklistItems.filter(i => i.completed).length / checklistItems.length) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5" />
                  <span>Manajemen Dokumen</span>
                </CardTitle>
                <Button size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Dokumen
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jenis Dokumen</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium">{doc.name}</TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{doc.count} file</TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">View</Button>
                          <Button size="sm" variant="outline">Download</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Kontak Darurat</span>
                </CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Kontak
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {emergencyContacts.map((contact) => (
                  <Card key={contact.id} className="border-red-200">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                        <Badge variant="outline" className="text-red-600 border-red-200">
                          {contact.role}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Phone className="h-3 w-3" />
                          <span>{contact.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-3 w-3" />
                          <span>{contact.location}</span>
                        </div>
                      </div>
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Phone className="h-3 w-3 mr-1" />
                          Call
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Edit
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}