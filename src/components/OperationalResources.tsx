import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Award, 
  Phone, 
  Mail, 
  Calendar,
  MapPin,
  Star,
  TrendingUp,
  UserCheck,
  Clock,
  Settings,
  AlertCircle,
  Bus,
  UserCog,
  Car,
  Target
} from 'lucide-react'
import { 
  useTourLeaders, 
  useCreateTourLeader, 
  useUpdateTourLeader,
  useTourLeaderPerformance 
} from '@/hooks/useTourLeaders'
import { useBuses, useCreateBus, useUpdateBus, useDeleteBus } from '@/hooks/useBuses'
import { useDrivers, useCreateDriver, useUpdateDriver, useDeleteDriver } from '@/hooks/useDrivers'
import { formatShortDate } from '@/lib/utils'

const specializations = [
  'Adventure Tourism',
  'Cultural Tourism',
  'Eco Tourism',
  'Religious Tourism',
  'Beach & Marine',
  'Mountain & Hiking',
  'City Tours',
  'Food Tourism',
  'Photography Tours',
  'Family Tours'
]

const certifications = [
  'Licensed Tour Guide',
  'First Aid Certified',
  'Wilderness First Aid',
  'CPR Certified',
  'Language Certified',
  'Cultural Heritage Guide',
  'Adventure Sports Certified',
  'Diving Instructor',
  'Mountain Guide',
  'Photography Guide'
]

export function OperationalResources() {
  const [activeTab, setActiveTab] = useState('tour-leaders')
  
  // Tour Leader states
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTourLeader, setEditingTourLeader] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Bus states
  const [showAddBusForm, setShowAddBusForm] = useState(false)
  const [editingBus, setEditingBus] = useState<string | null>(null)
  const [busSearchTerm, setBusSearchTerm] = useState('')
  const [busFilterStatus, setBusFilterStatus] = useState<string>('all')
  
  // Driver states
  const [showAddDriverForm, setShowAddDriverForm] = useState(false)
  const [editingDriver, setEditingDriver] = useState<string | null>(null)
  const [driverSearchTerm, setDriverSearchTerm] = useState('')
  const [driverFilterStatus, setDriverFilterStatus] = useState<string>('all')
  
  // Tour Leaders hooks
  const { tourLeaders, loading: tourLeadersLoading, error: tourLeadersError, refetch } = useTourLeaders()
  const { performance, loading: performanceLoading } = useTourLeaderPerformance()
  const { createTourLeader, loading: creatingTourLeader, error: createTourLeaderError } = useCreateTourLeader()
  const { updateTourLeader, loading: updatingTourLeader, error: updateTourLeaderError } = useUpdateTourLeader()

  // Buses hooks
  const { buses, loading: busesLoading, error: busesError, refetch: refetchBuses } = useBuses()
  const { createBus, loading: creatingBus, error: createBusError } = useCreateBus()
  const { updateBus, loading: updatingBus, error: updateBusError } = useUpdateBus()
  const { deleteBus, loading: deletingBus, error: deleteBusError } = useDeleteBus()

  // Drivers hooks
  const { drivers, loading: driversLoading, error: driversError, refetch: refetchDrivers } = useDrivers()
  const { createDriver, loading: creatingDriver, error: createDriverError } = useCreateDriver()
  const { updateDriver, loading: updatingDriver, error: updateDriverError } = useUpdateDriver()
  const { deleteDriver, loading: deletingDriver, error: deleteDriverError } = useDeleteDriver()

  // Combined loading and error states
  const isLoading = tourLeadersLoading || busesLoading || driversLoading
  const hasError = tourLeadersError || busesError || driversError
  const formErrors = createTourLeaderError || updateTourLeaderError || createBusError || updateBusError || createDriverError || updateDriverError

  // Tour Leader form data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    certification: '',
    specialization: '',
    experience_years: 0,
    bio: '',
    status: 'active'
  })

  const [busFormData, setBusFormData] = useState({
    plate_number: '',
    model: '',
    capacity: 0,
    status: 'available'
  })

  const [driverFormData, setDriverFormData] = useState({
    name: '',
    phone: '',
    license_number: '',
    status: 'available'
  })

  // Tour Leader handlers
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data, error } = editingTourLeader 
      ? await updateTourLeader(editingTourLeader, formData)
      : await createTourLeader(formData)

    if (!error) {
      setShowAddForm(false)
      setEditingTourLeader(null)
      setFormData({
        name: '',
        email: '',
        phone: '',
        certification: '',
        specialization: '',
        experience_years: 0,
        bio: '',
        status: 'active'
      })
      refetch()
    }
  }

  const handleBusSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data, error } = editingBus 
      ? await updateBus(editingBus, busFormData)
      : await createBus(busFormData)

    if (!error) {
      setShowAddBusForm(false)
      setEditingBus(null)
      setBusFormData({
        plate_number: '',
        model: '',
        capacity: 0,
        status: 'available'
      })
      refetchBuses()
    }
  }

  const handleDriverSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const { data, error } = editingDriver 
      ? await updateDriver(editingDriver, driverFormData)
      : await createDriver(driverFormData)

    if (!error) {
      setShowAddDriverForm(false)
      setEditingDriver(null)
      setDriverFormData({
        name: '',
        phone: '',
        license_number: '',
        status: 'available'
      })
      refetchDrivers()
    }
  }

  const handleEdit = (tourLeader: any) => {
    setFormData({
      name: tourLeader.name,
      email: tourLeader.email || '',
      phone: tourLeader.phone || '',
      certification: tourLeader.certification || '',
      specialization: tourLeader.specialization || '',
      experience_years: tourLeader.experience_years || 0,
      bio: tourLeader.bio || '',
      status: tourLeader.status
    })
    setEditingTourLeader(tourLeader.id)
    setShowAddForm(true)
  }

  const handleEditBus = (bus: any) => {
    setBusFormData({
      plate_number: bus.plate_number,
      model: bus.model || '',
      capacity: bus.capacity || 0,
      status: bus.status
    })
    setEditingBus(bus.id)
    setShowAddBusForm(true)
  }

  const handleDeleteBus = async (id: string) => {
    const { error } = await deleteBus(id)
    if (!error) {
      refetchBuses()
    }
  }

  const handleEditDriver = (driver: any) => {
    setDriverFormData({
      name: driver.name,
      phone: driver.phone || '',
      license_number: driver.license_number || '',
      status: driver.status
    })
    setEditingDriver(driver.id)
    setShowAddDriverForm(true)
  }

  const handleDeleteDriver = async (id: string) => {
    const { error } = await deleteDriver(id)
    if (!error) {
      refetchDrivers()
    }
  }

  // Filter functions
  const filteredTourLeaders = tourLeaders.filter(tl => {
    const matchesSearch = tl.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tl.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tl.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || tl.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const filteredBuses = buses.filter(bus => {
    const matchesSearch = bus.plate_number.toLowerCase().includes(busSearchTerm.toLowerCase()) ||
                         bus.model?.toLowerCase().includes(busSearchTerm.toLowerCase())
    const matchesStatus = busFilterStatus === 'all' || bus.status === busFilterStatus
    return matchesSearch && matchesStatus
  })

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
                         driver.phone?.toLowerCase().includes(driverSearchTerm.toLowerCase()) ||
                         driver.license_number?.toLowerCase().includes(driverSearchTerm.toLowerCase())
    const matchesStatus = driverFilterStatus === 'all' || driver.status === driverFilterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
      case 'available':
        return <Badge className="bg-green-500">Aktif</Badge>
      case 'inactive':
      case 'maintenance':
        return <Badge variant="secondary">Tidak Aktif</Badge>
      case 'on_leave':
      case 'unavailable':
        return <Badge className="bg-yellow-500">Cuti</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const topPerformer = performance[0]
  const activeTourLeaders = tourLeaders.filter(tl => tl.status === 'active').length
  const totalExperience = tourLeaders.reduce((sum, tl) => sum + (tl.experience_years || 0), 0)
  const avgExperience = tourLeaders.length > 0 ? totalExperience / tourLeaders.length : 0

  // Show loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manajemen Sumber Daya Operasional</h1>
        <div className="animate-pulse">
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded-lg"></div>
            <div className="grid grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  // Show error state
  if (hasError) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manajemen Sumber Daya Operasional</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">Terjadi kesalahan saat memuat data:</p>
              {tourLeadersError && <p>• Tour Leaders: {tourLeadersError}</p>}
              {busesError && <p>• Kendaraan: {busesError}</p>}
              {driversError && <p>• Driver: {driversError}</p>}
            </div>
          </AlertDescription>
        </Alert>
        <Button onClick={() => window.location.reload()} variant="outline">
          <AlertCircle className="h-4 w-4 mr-2" />
          Muat Ulang Halaman
        </Button>
      </div>
    )
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Sumber Daya Operasional</h1>
          <p className="text-gray-600 mt-2">Kelola tour leader, kendaraan, dan driver dalam satu tempat</p>
        </div>
        <Button 
          onClick={() => {
            if (activeTab === 'tour-leaders') setShowAddForm(true)
            else if (activeTab === 'buses') setShowAddBusForm(true)
            else if (activeTab === 'drivers') setShowAddDriverForm(true)
          }} 
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Tambah {activeTab === 'tour-leaders' ? 'Tour Leader' : activeTab === 'buses' ? 'Kendaraan' : 'Driver'}
        </Button>
      </div>

      {/* Global Form Errors */}
      {formErrors && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{formErrors}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tour-leaders" className="flex items-center space-x-2">
            <UserCog className="h-4 w-4" />
            <span>Tour Leaders</span>
          </TabsTrigger>
          <TabsTrigger value="buses" className="flex items-center space-x-2">
            <Bus className="h-4 w-4" />
            <span>Kendaraan</span>
          </TabsTrigger>
          <TabsTrigger value="drivers" className="flex items-center space-x-2">
            <UserCheck className="h-4 w-4" />
            <span>Driver</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tour-leaders" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Manajemen Tour Leader</h2>
            <Button onClick={() => setShowAddForm(true)} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Tour Leader
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Tour Leaders
                </CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{tourLeaders.length}</div>
                <p className="text-xs text-gray-500">
                  Tim tour leader
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Aktif
                </CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeTourLeaders}</div>
                <p className="text-xs text-gray-500">
                  Siap bertugas
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Avg Experience
                </CardTitle>
                <Award className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgExperience.toFixed(1)} tahun</div>
                <p className="text-xs text-gray-500">
                  Pengalaman rata-rata
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Specializations
                </CardTitle>
                <Target className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(tourLeaders.map(tl => tl.specialization).filter(Boolean)).size}
                </div>
                <p className="text-xs text-gray-500">
                  Bidang keahlian
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Performer */}
          {topPerformer && (
            <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <Award className="h-5 w-5" />
                  <span>Top Performer</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{topPerformer.name}</h3>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      {topPerformer.specialization && (
                        <Badge variant="outline" className="text-green-600 border-green-200">
                          {topPerformer.specialization}
                        </Badge>
                      )}
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{topPerformer.experience_years} tahun pengalaman</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                      {topPerformer.email && (
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3" />
                          <span>{topPerformer.email}</span>
                        </div>
                      )}
                      {topPerformer.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-3 w-3" />
                          <span>{topPerformer.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {topPerformer.totalTrips}
                    </div>
                    <div className="text-sm text-gray-600">
                      Total trips • {topPerformer.totalParticipants} peserta
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {topPerformer.upcomingTrips} upcoming trips
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Performance Ranking</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {performanceLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading performance data...</p>
                </div>
              ) : performance.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Belum ada data performance</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {performance.map((tl, index) => {
                    const maxTrips = Math.max(...performance.map(p => p.totalTrips))
                    const progressPercentage = maxTrips > 0 ? (tl.totalTrips / maxTrips) * 100 : 0
                    
                    return (
                      <div key={tl.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge variant={index === 0 ? "default" : "secondary"} className="w-8 h-8 rounded-full flex items-center justify-center">
                              #{index + 1}
                            </Badge>
                            <div>
                              <h3 className="font-semibold text-gray-900">{tl.name}</h3>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                {tl.specialization && (
                                  <Badge variant="outline" className="text-xs">
                                    {tl.specialization}
                                  </Badge>
                                )}
                                <span>{tl.experience_years} tahun exp</span>
                                <span>{tl.activeTrips} active trips</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {tl.totalTrips} trips
                            </div>
                            <div className="text-sm text-gray-500">
                              {tl.totalParticipants} total peserta
                            </div>
                            <div className="text-xs text-gray-500">
                              Avg: {tl.avgParticipantsPerTrip.toFixed(1)} peserta/trip
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Performance vs Top</span>
                            <span>{progressPercentage.toFixed(1)}%</span>
                          </div>
                          <Progress value={progressPercentage} className="h-2" />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add/Edit Tour Leader Form */}
          {showAddForm && (
            <Card className="border-green-200 shadow-lg">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <UserCheck className="h-5 w-5" />
                  <span>{editingTourLeader ? 'Edit Tour Leader' : 'Tambah Tour Leader Baru'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {(createTourLeaderError || updateTourLeaderError) && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {createTourLeaderError || updateTourLeaderError}
                    </AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Contoh: Ahmad Wijaya"
                        required
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-sm font-medium">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="ahmad@example.com"
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-sm font-medium">
                        Nomor Telepon
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="08123456789"
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="experience_years" className="text-sm font-medium">
                        Pengalaman (Tahun)
                      </Label>
                      <Input
                        id="experience_years"
                        type="number"
                        min="0"
                        value={formData.experience_years}
                        onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialization" className="text-sm font-medium">
                        Spesialisasi
                      </Label>
                      <Select 
                        value={formData.specialization} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, specialization: value }))}
                      >
                        <SelectTrigger className="focus:ring-green-500 focus:border-green-500">
                          <SelectValue placeholder="Pilih spesialisasi" />
                        </SelectTrigger>
                        <SelectContent>
                          {specializations.map(spec => (
                            <SelectItem key={spec} value={spec}>
                              {spec}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="certification" className="text-sm font-medium">
                        Sertifikasi
                      </Label>
                      <Select 
                        value={formData.certification} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, certification: value }))}
                      >
                        <SelectTrigger className="focus:ring-green-500 focus:border-green-500">
                          <SelectValue placeholder="Pilih sertifikasi" />
                        </SelectTrigger>
                        <SelectContent>
                          {certifications.map(cert => (
                            <SelectItem key={cert} value={cert}>
                              {cert}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-sm font-medium">
                        Status
                      </Label>
                      <Select 
                        value={formData.status} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="focus:ring-green-500 focus:border-green-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Aktif</SelectItem>
                          <SelectItem value="inactive">Tidak Aktif</SelectItem>
                          <SelectItem value="on_leave">Cuti</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium">
                      Bio / Deskripsi
                    </Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Ceritakan tentang pengalaman dan keahlian tour leader..."
                      rows={4}
                      className="focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4 border-t">
                    <Button 
                      type="submit" 
                      disabled={creatingTourLeader || updatingTourLeader}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {creatingTourLeader || updatingTourLeader ? 'Menyimpan...' : editingTourLeader ? 'Update Tour Leader' : 'Simpan Tour Leader'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddForm(false)
                        setEditingTourLeader(null)
                        setFormData({
                          name: '',
                          email: '',
                          phone: '',
                          certification: '',
                          specialization: '',
                          experience_years: 0,
                          bio: '',
                          status: 'active'
                        })
                      }}
                      className="border-gray-300"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Tour Leaders List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <UserCheck className="h-5 w-5 text-green-600" />
                  <span>Daftar Tour Leader</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari tour leader..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64 focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="active">Aktif</SelectItem>
                      <SelectItem value="inactive">Tidak Aktif</SelectItem>
                      <SelectItem value="on_leave">Cuti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filteredTourLeaders.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">
                    {searchTerm ? 'Tour leader tidak ditemukan' : 'Belum ada tour leader'}
                  </h3>
                  <p className="text-sm mb-4">
                    {searchTerm 
                      ? 'Coba gunakan kata kunci yang berbeda'
                      : 'Mulai dengan menambahkan tour leader pertama'
                    }
                  </p>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setShowAddForm(true)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Tour Leader
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tour Leader</TableHead>
                      <TableHead>Kontak</TableHead>
                      <TableHead>Spesialisasi</TableHead>
                      <TableHead>Pengalaman</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bergabung</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTourLeaders.map((tl) => {
                      const performanceData = performance.find(p => p.id === tl.id)
                      
                      return (
                        <TableRow key={tl.id}>
                          <TableCell>
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-green-600">
                                  {tl.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium text-gray-900">{tl.name}</div>
                                {tl.certification && (
                                  <Badge variant="outline" className="text-xs mt-1">
                                    {tl.certification}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {tl.email && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {tl.email}
                                </div>
                              )}
                              {tl.phone && (
                                <div className="flex items-center text-sm text-gray-600">
                                  <Phone className="h-3 w-3 mr-1" />
                                  {tl.phone}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {tl.specialization ? (
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                {tl.specialization}
                              </Badge>
                            ) : (
                              <span className="text-gray-400 text-sm">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{tl.experience_years} tahun</div>
                              {performanceData && (
                                <div className="text-gray-500">
                                  {performanceData.totalTrips} trips
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(tl.status)}</TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-600">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatShortDate(tl.created_at)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                onClick={() => handleEdit(tl)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="buses" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Manajemen Kendaraan</h2>
            <Button onClick={() => setShowAddBusForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kendaraan
            </Button>
          </div>

          {/* Bus Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Kendaraan
                </CardTitle>
                <Bus className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{buses.length}</div>
                <p className="text-xs text-gray-500">
                  Armada kendaraan
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Tersedia
                </CardTitle>
                <Bus className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {buses.filter(bus => bus.status === 'available').length}
                </div>
                <p className="text-xs text-gray-500">
                  Siap operasi
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Kapasitas
                </CardTitle>
                <Users className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {buses.reduce((sum, bus) => sum + (bus.capacity || 0), 0)}
                </div>
                <p className="text-xs text-gray-500">
                  Penumpang
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Maintenance
                </CardTitle>
                <Settings className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {buses.filter(bus => bus.status === 'maintenance').length}
                </div>
                <p className="text-xs text-gray-500">
                  Dalam perawatan
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Add Bus Form */}
          {showAddBusForm && (
            <Card className="border-blue-200 shadow-lg">
              <CardHeader className="bg-blue-50">
                <CardTitle className="flex items-center space-x-2 text-blue-800">
                  <Bus className="h-5 w-5" />
                  <span>{editingBus ? 'Edit Kendaraan' : 'Tambah Kendaraan Baru'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {(createBusError || updateBusError) && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {createBusError || updateBusError}
                    </AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleBusSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="plate_number" className="text-sm font-medium">
                        Nomor Plat <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="plate_number"
                        value={busFormData.plate_number}
                        onChange={(e) => setBusFormData(prev => ({ ...prev, plate_number: e.target.value }))}
                        placeholder="Contoh: B 1234 ABC"
                        required
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="model" className="text-sm font-medium">
                        Model Kendaraan
                      </Label>
                      <Input
                        id="model"
                        value={busFormData.model}
                        onChange={(e) => setBusFormData(prev => ({ ...prev, model: e.target.value }))}
                        placeholder="Contoh: Toyota Hiace, Isuzu Elf"
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="capacity" className="text-sm font-medium">
                        Kapasitas Penumpang
                      </Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="1"
                        value={busFormData.capacity}
                        onChange={(e) => setBusFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                        className="focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bus_status" className="text-sm font-medium">
                        Status
                      </Label>
                      <Select 
                        value={busFormData.status} 
                        onValueChange={(value) => setBusFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="focus:ring-blue-500 focus:border-blue-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Tersedia</SelectItem>
                          <SelectItem value="in_use">Sedang Digunakan</SelectItem>
                          <SelectItem value="maintenance">Maintenance</SelectItem>
                          <SelectItem value="unavailable">Tidak Tersedia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4 border-t">
                    <Button 
                      type="submit" 
                      disabled={creatingBus || updatingBus}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {creatingBus || updatingBus ? 'Menyimpan...' : editingBus ? 'Update Kendaraan' : 'Simpan Kendaraan'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddBusForm(false)
                        setEditingBus(null)
                        setBusFormData({
                          plate_number: '',
                          model: '',
                          capacity: 0,
                          status: 'available'
                        })
                      }}
                      className="border-gray-300"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Buses List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Bus className="h-5 w-5 text-blue-600" />
                  <span>Daftar Kendaraan</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari kendaraan..."
                      value={busSearchTerm}
                      onChange={(e) => setBusSearchTerm(e.target.value)}
                      className="pl-9 w-64 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <Select value={busFilterStatus} onValueChange={setBusFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="available">Tersedia</SelectItem>
                      <SelectItem value="in_use">Digunakan</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                      <SelectItem value="unavailable">Tidak Tersedia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {busesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading kendaraan...</p>
                </div>
              ) : filteredBuses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Bus className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">
                    {busSearchTerm ? 'Kendaraan tidak ditemukan' : 'Belum ada kendaraan'}
                  </h3>
                  <p className="text-sm mb-4">
                    {busSearchTerm 
                      ? 'Coba gunakan kata kunci yang berbeda'
                      : 'Mulai dengan menambahkan kendaraan pertama'
                    }
                  </p>
                  {!busSearchTerm && (
                    <Button 
                      onClick={() => setShowAddBusForm(true)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Kendaraan
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nomor Plat</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Kapasitas</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ditambahkan</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBuses.map((bus) => (
                      <TableRow key={bus.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{bus.plate_number}</div>
                        </TableCell>
                        <TableCell>
                          {bus.model || <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Users className="h-3 w-3" />
                            <span>{bus.capacity || 0} orang</span>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(bus.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatShortDate(bus.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditBus(bus)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteBus(bus.id)}
                              disabled={deletingBus}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">Manajemen Driver</h2>
            <Button onClick={() => setShowAddDriverForm(true)} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Driver
            </Button>
          </div>

          {/* Driver Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Driver
                </CardTitle>
                <Car className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{drivers.length}</div>
                <p className="text-xs text-gray-500">
                  Tim driver
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Tersedia
                </CardTitle>
                <Car className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {drivers.filter(driver => driver.status === 'available').length}
                </div>
                <p className="text-xs text-gray-500">
                  Siap bertugas
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Berlisensi
                </CardTitle>
                <Award className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {drivers.filter(driver => driver.license_number).length}
                </div>
                <p className="text-xs text-gray-500">
                  Memiliki SIM
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Tidak Tersedia
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {drivers.filter(driver => driver.status === 'unavailable').length}
                </div>
                <p className="text-xs text-gray-500">
                  Sedang cuti/off
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Add Driver Form */}
          {showAddDriverForm && (
            <Card className="border-purple-200 shadow-lg">
              <CardHeader className="bg-purple-50">
                <CardTitle className="flex items-center space-x-2 text-purple-800">
                  <Car className="h-5 w-5" />
                  <span>{editingDriver ? 'Edit Driver' : 'Tambah Driver Baru'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {(createDriverError || updateDriverError) && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {createDriverError || updateDriverError}
                    </AlertDescription>
                  </Alert>
                )}
                <form onSubmit={handleDriverSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="driver_name" className="text-sm font-medium">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="driver_name"
                        value={driverFormData.name}
                        onChange={(e) => setDriverFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Contoh: Budi Santoso"
                        required
                        className="focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="driver_phone" className="text-sm font-medium">
                        Nomor Telepon
                      </Label>
                      <Input
                        id="driver_phone"
                        value={driverFormData.phone}
                        onChange={(e) => setDriverFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="08123456789"
                        className="focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="license_number" className="text-sm font-medium">
                        Nomor SIM
                      </Label>
                      <Input
                        id="license_number"
                        value={driverFormData.license_number}
                        onChange={(e) => setDriverFormData(prev => ({ ...prev, license_number: e.target.value }))}
                        placeholder="Contoh: 1234567890123456"
                        className="focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="driver_status" className="text-sm font-medium">
                        Status
                      </Label>
                      <Select 
                        value={driverFormData.status} 
                        onValueChange={(value) => setDriverFormData(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="focus:ring-purple-500 focus:border-purple-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">Tersedia</SelectItem>
                          <SelectItem value="on_duty">Sedang Bertugas</SelectItem>
                          <SelectItem value="unavailable">Tidak Tersedia</SelectItem>
                          <SelectItem value="on_leave">Cuti</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4 border-t">
                    <Button 
                      type="submit" 
                      disabled={creatingDriver || updatingDriver}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {creatingDriver || updatingDriver ? 'Menyimpan...' : editingDriver ? 'Update Driver' : 'Simpan Driver'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowAddDriverForm(false)
                        setEditingDriver(null)
                        setDriverFormData({
                          name: '',
                          phone: '',
                          license_number: '',
                          status: 'available'
                        })
                      }}
                      className="border-gray-300"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Drivers List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Car className="h-5 w-5 text-purple-600" />
                  <span>Daftar Driver</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari driver..."
                      value={driverSearchTerm}
                      onChange={(e) => setDriverSearchTerm(e.target.value)}
                      className="pl-9 w-64 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <Select value={driverFilterStatus} onValueChange={setDriverFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="available">Tersedia</SelectItem>
                      <SelectItem value="on_duty">Bertugas</SelectItem>
                      <SelectItem value="unavailable">Tidak Tersedia</SelectItem>
                      <SelectItem value="on_leave">Cuti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {driversLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                  <p className="text-gray-500 mt-2">Loading driver...</p>
                </div>
              ) : filteredDrivers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Car className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">
                    {driverSearchTerm ? 'Driver tidak ditemukan' : 'Belum ada driver'}
                  </h3>
                  <p className="text-sm mb-4">
                    {driverSearchTerm 
                      ? 'Coba gunakan kata kunci yang berbeda'
                      : 'Mulai dengan menambahkan driver pertama'
                    }
                  </p>
                  {!driverSearchTerm && (
                    <Button 
                      onClick={() => setShowAddDriverForm(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Driver
                    </Button>
                  )}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Kontak</TableHead>
                      <TableHead>Nomor SIM</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Bergabung</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDrivers.map((driver) => (
                      <TableRow key={driver.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-purple-600">
                                {driver.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="font-medium text-gray-900">{driver.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {driver.phone ? (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-3 w-3 mr-1" />
                              {driver.phone}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {driver.license_number ? (
                            <div className="font-mono text-sm">{driver.license_number}</div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(driver.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="h-3 w-3 mr-1" />
                            {formatShortDate(driver.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditDriver(driver)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              onClick={() => handleDeleteDriver(driver.id)}
                              disabled={deletingDriver}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}