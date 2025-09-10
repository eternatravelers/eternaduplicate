import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Plus, Upload, Search, Filter, UserPlus, FileSpreadsheet, Edit, Image, X, Eye, MapPin, Navigation } from 'lucide-react'
import { useParticipants, useCreateParticipant, useUpdateParticipant } from '@/hooks/useParticipants'
import { useTrips } from '@/hooks/useTrips'
import { useSales } from '@/hooks/useSales'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

export function Participants() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [proofOfTransferFile, setProofOfTransferFile] = useState<File | null>(null)
  const [groupProofOfTransferFile, setGroupProofOfTransferFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [groupPreviewUrl, setGroupPreviewUrl] = useState<string | null>(null)
  const [selectedTripMeetingPoint, setSelectedTripMeetingPoint] = useState<string>('')
  const [groupSelectedTripMeetingPoint, setGroupSelectedTripMeetingPoint] = useState<string>('')
  const csvFileInputRef = useRef<HTMLInputElement>(null)
  
  const [groupData, setGroupData] = useState({
    groupName: '',
    groupLeader: '',
    groupEmail: '',
    groupPhone: '',
    participantCount: '' as number | '',
    trip_id: '',
    sales_id: '',
    package_price: '' as number | '',
    dp_amount: '' as number | '',
    meeting_point_details: ''
  })

  const { participants, loading, refetch } = useParticipants()
  const { trips } = useTrips()
  const { sales } = useSales()
  const { createParticipant, loading: creating } = useCreateParticipant()
  const { updateParticipant, loading: updating } = useUpdateParticipant()
  const { isSuperAdmin } = useAuth()

  const [formData, setFormData] = useState({
    trip_id: '',
    sales_id: '',
    full_name: '',
    email: '',
    phone: '',
    address: '',
    participant_count: '' as number | '',
    package_price: '' as number | '',
    dp_amount: '' as number | '',
    dp_transfer_date: '',
    additional_requests: '',
    meeting_point_details: ''
  })

  // Update meeting point when trip is selected
  useEffect(() => {
    if (formData.trip_id) {
      const selectedTrip = trips.find(trip => trip.id === formData.trip_id)
      if (selectedTrip) {
        setSelectedTripMeetingPoint(selectedTrip.meeting_point)
        // Auto-fill meeting point details with trip's default meeting point
        if (!editingParticipant) {
          setFormData(prev => ({ 
            ...prev, 
            meeting_point_details: selectedTrip.meeting_point 
          }))
        }
      }
    }
  }, [formData.trip_id, trips, editingParticipant])

  // Update group meeting point when trip is selected
  useEffect(() => {
    if (groupData.trip_id) {
      const selectedTrip = trips.find(trip => trip.id === groupData.trip_id)
      if (selectedTrip) {
        setGroupSelectedTripMeetingPoint(selectedTrip.meeting_point)
        // Auto-fill meeting point details with trip's default meeting point
        setGroupData(prev => ({ 
          ...prev, 
          meeting_point_details: selectedTrip.meeting_point 
        }))
      }
    }
  }, [groupData.trip_id, trips])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isGroup = false) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Hanya file gambar yang diperbolehkan')
        return
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB')
        return
      }

      if (isGroup) {
        setGroupProofOfTransferFile(file)
        const url = URL.createObjectURL(file)
        setGroupPreviewUrl(url)
      } else {
        setProofOfTransferFile(file)
        const url = URL.createObjectURL(file)
        setPreviewUrl(url)
      }
    }
  }

  const removeFile = (isGroup = false) => {
    if (isGroup) {
      setGroupProofOfTransferFile(null)
      if (groupPreviewUrl) {
        URL.revokeObjectURL(groupPreviewUrl)
        setGroupPreviewUrl(null)
      }
    } else {
      setProofOfTransferFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert empty strings to appropriate default values
    const submitData = {
      ...formData,
      participant_count: formData.participant_count === '' ? 1 : Number(formData.participant_count),
      package_price: formData.package_price === '' ? 0 : Number(formData.package_price),
      dp_amount: formData.dp_amount === '' ? 0 : Number(formData.dp_amount),
      dp_transfer_date: formData.dp_transfer_date || new Date().toISOString().split('T')[0]
    }

    const { data, error } = editingParticipant
      ? await updateParticipant(editingParticipant, submitData, proofOfTransferFile)
      : await createParticipant(submitData, proofOfTransferFile)

    if (!error) {
      setShowAddForm(false)
      setEditingParticipant(null)
      removeFile()
      setSelectedTripMeetingPoint('')
      setFormData({
        trip_id: '',
        sales_id: '',
        full_name: '',
        email: '',
        phone: '',
        address: '',
        participant_count: 1,
        package_price: 0,
        dp_amount: 0,
        dp_transfer_date: '',
        additional_requests: '',
        meeting_point_details: ''
      })
      refetch()
    }
  }

  const handleEdit = (participant: any) => {
    setFormData({
      trip_id: participant.trip_id || '',
      sales_id: participant.sales_id || '',
      full_name: participant.full_name,
      email: participant.email,
      phone: participant.phone,
      address: participant.address,
      participant_count: participant.participant_count || '',
      package_price: participant.package_price || '',
      dp_amount: participant.dp_amount || '',
      dp_transfer_date: participant.dp_transfer_date,
      additional_requests: participant.additional_requests || '',
      meeting_point_details: participant.meeting_point_details || ''
    })
    setEditingParticipant(participant.id)
    setShowAddForm(true)
  }

  const handleAddNew = () => {
    setEditingParticipant(null)
    removeFile()
    setSelectedTripMeetingPoint('')
    setFormData({
      trip_id: '',
      sales_id: '',
      full_name: '',
      email: '',
      phone: '',
      address: '',
      participant_count: 1,
      package_price: 0,
      dp_amount: 0,
      dp_transfer_date: '',
      additional_requests: '',
      meeting_point_details: ''
    })
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingParticipant(null)
    removeFile()
    setSelectedTripMeetingPoint('')
    setFormData({
      trip_id: '',
      sales_id: '',
      full_name: '',
      email: '',
      phone: '',
      address: '',
      participant_count: '',
      package_price: '',
      dp_amount: '',
      dp_transfer_date: '',
      additional_requests: '',
      meeting_point_details: ''
    })
  }

  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Convert empty strings to appropriate default values for group registration
    const processedGroupData = {
      participantCount: groupData.participantCount === '' ? 1 : Number(groupData.participantCount),
      package_price: groupData.package_price === '' ? 0 : Number(groupData.package_price),
      dp_amount: groupData.dp_amount === '' ? 0 : Number(groupData.dp_amount)
    }
    
    // Create group registration logic here
    const { data, error } = await createParticipant({
      trip_id: groupData.trip_id,
      sales_id: groupData.sales_id,
      full_name: `${groupData.groupName} (Group Leader: ${groupData.groupLeader})`,
      email: groupData.groupEmail,
      phone: groupData.groupPhone,
      address: 'Group Registration',
      participant_count: processedGroupData.participantCount,
      package_price: processedGroupData.package_price,
      dp_amount: processedGroupData.dp_amount,
      dp_transfer_date: new Date().toISOString().split('T')[0],
      additional_requests: `Group registration for ${processedGroupData.participantCount} participants`,
      meeting_point_details: groupData.meeting_point_details
    }, groupProofOfTransferFile)

    if (!error) {
      removeFile(true)
      setGroupSelectedTripMeetingPoint('')
      setGroupData({
        groupName: '',
        groupLeader: '',
        groupEmail: '',
        groupPhone: '',
        participantCount: '',
        trip_id: '',
        sales_id: '',
        package_price: '',
        dp_amount: '',
        meeting_point_details: ''
      })
      refetch()
    }
  }

  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log('File CSV dipilih:', file)
      // TODO: Implement CSV parsing logic here
      alert(`File CSV "${file.name}" berhasil dipilih. Fitur parsing akan diimplementasikan selanjutnya.`)
    }
  }

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || participant.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
        return <Badge variant="default">Terdaftar</Badge>
      case 'confirmed':
        return <Badge className="bg-green-500">Dikonfirmasi</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getMeetingPointDisplay = (participant: any) => {
    // If participant has custom meeting point, show it
    if (participant.meeting_point_details) {
      return (
        <div>
          <div className="font-medium text-blue-600">{participant.meeting_point_details}</div>
          <div className="text-xs text-gray-500">Titik kumpul khusus</div>
        </div>
      )
    }
    // Otherwise show trip's default meeting point
    if (participant.trips?.meeting_point) {
      return (
        <div>
          <div className="font-medium">{participant.trips.meeting_point}</div>
          <div className="text-xs text-gray-500">Titik kumpul default</div>
        </div>
      )
    }
    return <span className="text-gray-400">-</span>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Pendaftaran Peserta</h1>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pendaftaran Peserta</h1>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Peserta
          </Button>
        </div>
      </div>

      {/* Add/Edit Participant Form - Moved outside tabs for global access */}
      {showAddForm && (
        <Card className="border-blue-200 shadow-lg">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-800">
              {editingParticipant ? 'Edit Peserta' : 'Tambah Peserta Baru'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="trip_id">Trip</Label>
                  <Select 
                    value={formData.trip_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, trip_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih trip" />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map(trip => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.name} - {formatShortDate(trip.departure_date)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sales_id">Sales</Label>
                  <Select 
                    value={formData.sales_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, sales_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih sales" />
                    </SelectTrigger>
                    <SelectContent>
                      {sales.map(sale => (
                        <SelectItem key={sale.id} value={sale.id}>
                          {sale.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="full_name">Nama Lengkap</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telepon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="participant_count">Jumlah Peserta</Label>
                  <Input
                    id="participant_count"
                    type="number"
                    min="1"
                    value={formData.participant_count}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseInt(e.target.value)
                      setFormData(prev => ({ ...prev, participant_count: isNaN(val) ? '' : val }))
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="package_price">Harga Paket</Label>
                  <Input
                    id="package_price"
                    type="number"
                    value={formData.package_price}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                      setFormData(prev => ({ ...prev, package_price: isNaN(val) ? '' : val }))
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dp_amount">Jumlah DP</Label>
                  <Input
                    id="dp_amount"
                    type="number"
                    value={formData.dp_amount}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                      setFormData(prev => ({ ...prev, dp_amount: isNaN(val) ? '' : val }))
                    }}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dp_transfer_date">Tanggal Transfer DP</Label>
                  <Input
                    id="dp_transfer_date"
                    type="date"
                    value={formData.dp_transfer_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, dp_transfer_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Alamat</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  required
                />
              </div>

              {/* Meeting Point Section */}
              <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                <Label className="text-base font-semibold flex items-center space-x-2">
                  <Navigation className="h-5 w-5" />
                  <span>Titik Kumpul Peserta</span>
                </Label>
                
                {selectedTripMeetingPoint && (
                  <div className="p-3 bg-white border rounded-lg">
                    <div className="text-sm font-medium text-gray-700 mb-1">Titik Kumpul Default Trip:</div>
                    <div className="text-sm text-gray-600 flex items-center space-x-2">
                      <MapPin className="h-4 w-4" />
                      <span>{selectedTripMeetingPoint}</span>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="meeting_point_details">
                    Titik Kumpul Khusus (Opsional)
                  </Label>
                  <Textarea
                    id="meeting_point_details"
                    value={formData.meeting_point_details}
                    onChange={(e) => setFormData(prev => ({ ...prev, meeting_point_details: e.target.value }))}
                    placeholder="Kosongkan jika menggunakan titik kumpul default trip, atau isi dengan lokasi khusus..."
                    rows={3}
                  />
                  <p className="text-xs text-gray-500">
                    Jika diisi, peserta akan menggunakan titik kumpul khusus ini. Jika kosong, akan menggunakan titik kumpul default dari trip.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_requests">Permintaan Tambahan</Label>
                <Textarea
                  id="additional_requests"
                  value={formData.additional_requests}
                  onChange={(e) => setFormData(prev => ({ ...prev, additional_requests: e.target.value }))}
                  placeholder="Makanan khusus, kebutuhan medis, dll..."
                />
              </div>

              {/* Proof of Transfer Upload */}
              <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                <Label className="text-base font-semibold flex items-center space-x-2">
                  <Image className="h-5 w-5" />
                  <span>Bukti Transfer DP</span>
                </Label>
                
                <div className="space-y-3">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e)}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500">
                    Format yang didukung: JPG, PNG, GIF. Maksimal 5MB.
                  </p>
                  
                  {previewUrl && (
                    <div className="relative inline-block">
                      <img 
                        src={previewUrl} 
                        alt="Preview bukti transfer" 
                        className="w-32 h-32 object-cover rounded-lg border"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                        onClick={() => removeFile()}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <Button type="submit" disabled={creating || updating}>
                  {creating || updating ? 'Menyimpan...' : editingParticipant ? 'Update Peserta' : 'Simpan Peserta'}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancel}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList>
          <TabsTrigger value="individual">Pendaftaran Individual</TabsTrigger>
          <TabsTrigger value="group">Pendaftaran Group</TabsTrigger>
          <TabsTrigger value="history">Riwayat Pendaftaran</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          {/* Individual registration content can be added here if needed */}
          <div className="text-center py-8 text-gray-500">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Gunakan tombol "Tambah Peserta" di atas untuk mendaftarkan peserta individual</p>
          </div>
        </TabsContent>

        <TabsContent value="group" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Pendaftaran Group</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGroupSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="groupName">Nama Group</Label>
                    <Input
                      id="groupName"
                      value={groupData.groupName}
                      onChange={(e) => setGroupData(prev => ({ ...prev, groupName: e.target.value }))}
                      placeholder="Contoh: Keluarga Besar Wijaya"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groupLeader">Ketua Group</Label>
                    <Input
                      id="groupLeader"
                      value={groupData.groupLeader}
                      onChange={(e) => setGroupData(prev => ({ ...prev, groupLeader: e.target.value }))}
                      placeholder="Nama ketua group"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groupEmail">Email Group</Label>
                    <Input
                      id="groupEmail"
                      type="email"
                      value={groupData.groupEmail}
                      onChange={(e) => setGroupData(prev => ({ ...prev, groupEmail: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="groupPhone">Telepon Group</Label>
                    <Input
                      id="groupPhone"
                      value={groupData.groupPhone}
                      onChange={(e) => setGroupData(prev => ({ ...prev, groupPhone: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="participantCount">Jumlah Peserta</Label>
                    <Input
                      id="participantCount"
                      type="number"
                      min="2"
                      value={groupData.participantCount}
                     onChange={(e) => {
                       const val = e.target.value === '' ? '' : parseInt(e.target.value)
                       setGroupData(prev => ({ ...prev, participantCount: isNaN(val) ? '' : val }))
                     }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="group_trip_id">Trip</Label>
                    <Select 
                      value={groupData.trip_id} 
                      onValueChange={(value) => setGroupData(prev => ({ ...prev, trip_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih trip" />
                      </SelectTrigger>
                      <SelectContent>
                        {trips.map(trip => (
                          <SelectItem key={trip.id} value={trip.id}>
                            {trip.name} - {formatShortDate(trip.departure_date)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="group_sales_id">Sales</Label>
                    <Select 
                      value={groupData.sales_id} 
                      onValueChange={(value) => setGroupData(prev => ({ ...prev, sales_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih sales" />
                      </SelectTrigger>
                      <SelectContent>
                        {sales.map(sale => (
                          <SelectItem key={sale.id} value={sale.id}>
                            {sale.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="group_package_price">Harga per Orang</Label>
                    <Input
                      id="group_package_price"
                      type="number"
                      value={groupData.package_price}
                     onChange={(e) => {
                       const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                       setGroupData(prev => ({ ...prev, package_price: isNaN(val) ? '' : val }))
                     }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="group_dp_amount">DP per Orang</Label>
                    <Input
                      id="group_dp_amount"
                      type="number"
                      value={groupData.dp_amount}
                     onChange={(e) => {
                       const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                       setGroupData(prev => ({ ...prev, dp_amount: isNaN(val) ? '' : val }))
                     }}
                      required
                    />
                  </div>
                </div>

                {/* Group Meeting Point Section */}
                <div className="space-y-4 p-4 border rounded-lg bg-green-50">
                  <Label className="text-base font-semibold flex items-center space-x-2">
                    <Navigation className="h-5 w-5" />
                    <span>Titik Kumpul Group</span>
                  </Label>
                  
                  {groupSelectedTripMeetingPoint && (
                    <div className="p-3 bg-white border rounded-lg">
                      <div className="text-sm font-medium text-gray-700 mb-1">Titik Kumpul Default Trip:</div>
                      <div className="text-sm text-gray-600 flex items-center space-x-2">
                        <MapPin className="h-4 w-4" />
                        <span>{groupSelectedTripMeetingPoint}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="group_meeting_point_details">
                      Titik Kumpul Khusus Group (Opsional)
                    </Label>
                    <Textarea
                      id="group_meeting_point_details"
                      value={groupData.meeting_point_details}
                      onChange={(e) => setGroupData(prev => ({ ...prev, meeting_point_details: e.target.value }))}
                      placeholder="Kosongkan jika menggunakan titik kumpul default trip, atau isi dengan lokasi khusus untuk group..."
                      rows={3}
                    />
                    <p className="text-xs text-gray-500">
                      Jika diisi, seluruh group akan menggunakan titik kumpul khusus ini. Jika kosong, akan menggunakan titik kumpul default dari trip.
                    </p>
                  </div>
                </div>

                {/* Group Proof of Transfer Upload */}
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <Label className="text-base font-semibold flex items-center space-x-2">
                    <Image className="h-5 w-5" />
                    <span>Bukti Transfer DP Group</span>
                  </Label>
                  
                  <div className="space-y-3">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, true)}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <p className="text-xs text-gray-500">
                      Format yang didukung: JPG, PNG, GIF. Maksimal 5MB.
                    </p>
                    
                    {groupPreviewUrl && (
                      <div className="relative inline-block">
                        <img 
                          src={groupPreviewUrl} 
                          alt="Preview bukti transfer group" 
                          className="w-32 h-32 object-cover rounded-lg border"
                        />
                        <Button
                          type="button"
                          size="sm"
                          variant="destructive"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                          onClick={() => removeFile(true)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold mb-2">Ringkasan Group</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                   <div>Total Peserta: {groupData.participantCount || 0} orang</div>
                   <div>Total Harga: {formatCurrency((Number(groupData.package_price) || 0) * (Number(groupData.participantCount) || 0))}</div>
                   <div>Total DP: {formatCurrency((Number(groupData.dp_amount) || 0) * (Number(groupData.participantCount) || 0))}</div>
                   <div>Sisa Bayar: {formatCurrency(((Number(groupData.package_price) || 0) - (Number(groupData.dp_amount) || 0)) * (Number(groupData.participantCount) || 0))}</div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Menyimpan...' : 'Daftar Group'}
                  </Button>
                  <input
                    type="file"
                    ref={csvFileInputRef}
                    accept=".csv"
                    style={{ display: 'none' }}
                    onChange={handleCsvFileChange}
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => csvFileInputRef.current?.click()}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Import Detail Peserta
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Riwayat Pendaftaran</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Cari peserta..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-64"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua</SelectItem>
                      <SelectItem value="registered">Terdaftar</SelectItem>
                      <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Trip</TableHead>
                    <TableHead>Jumlah</TableHead>
                    <TableHead>Harga</TableHead>
                    <TableHead>DP</TableHead>
                    <TableHead>Titik Kumpul</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Bukti Transfer</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{participant.full_name}</div>
                          <div className="text-sm text-gray-500">{participant.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {participant.trips?.name || 'N/A'}
                      </TableCell>
                      <TableCell>{participant.participant_count} orang</TableCell>
                      <TableCell>{formatCurrency(participant.package_price)}</TableCell>
                      <TableCell>{formatCurrency(participant.dp_amount)}</TableCell>
                      <TableCell>
                        {getMeetingPointDisplay(participant)}
                      </TableCell>
                      <TableCell>{getStatusBadge(participant.status)}</TableCell>
                      <TableCell>
                        {participant.proof_of_transfer_url ? (
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(participant.proof_of_transfer_url!, '_blank')}
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Lihat
                            </Button>
                            <Badge variant="outline" className="text-green-600 border-green-200">
                              Ada
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-gray-500">
                            Belum ada
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatShortDate(participant.created_at)}</TableCell>
                      <TableCell>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          onClick={() => handleEdit(participant)}
                         title="Edit peserta"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredParticipants.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Tidak ada peserta yang ditemukan</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}