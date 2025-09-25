import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { UserPlus, Navigation, MapPin, Users, Plus, FileSpreadsheet, CheckCircle } from 'lucide-react'
import { ProofOfTransferUploader } from './ProofOfTransferUploader'
import { ParticipantForm } from './ParticipantForm'
import { CSVImportModal } from './CSVImportModal'
import { useGroupMembers } from '@/hooks/useParticipants'
import { formatCurrency, formatShortDate } from '@/lib/utils'

interface GroupRegistrationFormProps {
  onSubmit: (data: any) => Promise<any>
  trips: any[]
  sales: any[]
  creating: boolean
}

export function GroupRegistrationForm({
  onSubmit,
  trips,
  sales,
  creating
}: GroupRegistrationFormProps) {
  const [step, setStep] = useState<'group-leader' | 'add-members'>('group-leader')
  const [groupLeaderId, setGroupLeaderId] = useState<string | null>(null)
  const [groupLeaderData, setGroupLeaderData] = useState<any>(null)
  const [showAddMemberForm, setShowAddMemberForm] = useState(false)
  const [showCSVImport, setShowCSVImport] = useState(false)
  
  const [groupData, setGroupData] = useState({
    groupName: '',
    groupLeader: '',
    groupEmail: '',
    groupPhone: '',
    groupAddress: '',
    trip_id: '',
    sales_id: '',
    total_group_participants: '' as number | '',
    total_package_price: '' as number | '',
    total_dp_amount: '' as number | '',
    meeting_point_details: ''
  })

  const [groupProofOfTransferUrl, setGroupProofOfTransferUrl] = useState<string | null>(null)
  const [groupSelectedTripMeetingPoint, setGroupSelectedTripMeetingPoint] = useState<string>('')

  // Get group members if we have a group leader
  const { groupMembers, loading: membersLoading, refetch: refetchMembers } = useGroupMembers(groupLeaderId || '')

  useEffect(() => {
    if (groupData.trip_id) {
      const selectedTrip = trips.find(trip => trip.id === groupData.trip_id)
      if (selectedTrip) {
        setGroupSelectedTripMeetingPoint(selectedTrip.meeting_point)
        setGroupData(prev => ({ 
          ...prev, 
          meeting_point_details: selectedTrip.meeting_point 
        }))
      }
    }
  }, [groupData.trip_id, trips])

  const handleGroupLeaderSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      trip_id: groupData.trip_id,
      sales_id: groupData.sales_id,
      full_name: groupData.groupLeader,
      email: groupData.groupEmail,
      phone: groupData.groupPhone,
      address: groupData.groupAddress,
      participant_count: groupData.total_group_participants === '' ? 1 : Number(groupData.total_group_participants),
      package_price: groupData.total_package_price === '' ? 0 : Number(groupData.total_package_price),
      dp_amount: groupData.total_dp_amount === '' ? 0 : Number(groupData.total_dp_amount),
      dp_transfer_date: new Date().toISOString().split('T')[0],
      additional_requests: `Group Leader for: ${groupData.groupName}`,
      meeting_point_details: groupData.meeting_point_details,
      proof_of_transfer_url: groupProofOfTransferUrl,
      parent_participant_id: null // Group leader has no parent
    }

    try {
      await onSubmit(submitData)
      
      // Store group leader data for the next step
      setGroupLeaderData({
        ...submitData,
        id: 'temp-id', // Will be replaced with actual ID
        groupName: groupData.groupName
      })
      
      // Move to next step
      setStep('add-members')
    } catch (error) {
      console.error('Error creating group leader:', error)
    }
  }

  const handleMemberSubmit = async (memberData: any) => {
    // Ensure member inherits trip and sales from group leader, with zero payment amounts
    const memberSubmitData = {
      ...memberData,
      trip_id: groupData.trip_id,
      sales_id: groupData.sales_id,
      parent_participant_id: groupLeaderId,
      participant_count: 1, // Each member is 1 person
      package_price: 0, // Payment is consolidated at group leader level
      dp_amount: 0 // Payment is consolidated at group leader level
    }

    await onSubmit(memberSubmitData)
    setShowAddMemberForm(false)
    refetchMembers()
  }

  const handleBulkImport = async (participantsData: any[]) => {
    // Add parent_participant_id and zero payment amounts to all imported participants
    const membersData = participantsData.map(participant => ({
      ...participant,
      trip_id: groupData.trip_id,
      sales_id: groupData.sales_id,
      parent_participant_id: groupLeaderId,
      participant_count: 1, // Each member is 1 person
      package_price: 0, // Payment is consolidated at group leader level
      dp_amount: 0 // Payment is consolidated at group leader level
    }))

    // Import members one by one
    for (const memberData of membersData) {
      await onSubmit(memberData)
    }
    
    setShowCSVImport(false)
    refetchMembers()
  }

  const handleUrlChange = (url: string | null) => {
    setGroupProofOfTransferUrl(url)
  }

  const handleStartOver = () => {
    setStep('group-leader')
    setGroupLeaderId(null)
    setGroupLeaderData(null)
    setShowAddMemberForm(false)
    setShowCSVImport(false)
    setGroupData({
      groupName: '',
      groupLeader: '',
      groupEmail: '',
      groupPhone: '',
      groupAddress: '',
      trip_id: '',
      sales_id: '',
      total_group_participants: '',
      total_package_price: '',
      total_dp_amount: '',
      meeting_point_details: ''
    })
    setGroupProofOfTransferUrl(null)
    setGroupSelectedTripMeetingPoint('')
  }

  // Calculate group totals
  const totalGroupParticipants = groupLeaderData?.participant_count || 0 // Total from group leader record
  const totalGroupRevenue = groupLeaderData?.package_price || 0 // Total from group leader record
  const totalGroupDP = groupLeaderData?.dp_amount || 0 // Total from group leader record
  const actualMembersCount = groupMembers.length // Actual individual members added

  if (step === 'group-leader') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Langkah 1: Daftarkan Ketua Grup</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Panduan Pendaftaran Grup:</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Daftarkan ketua grup terlebih dahulu dengan informasi lengkap</li>
              <li>Setelah ketua grup terdaftar, Anda dapat menambahkan anggota grup lainnya</li>
              <li>Setiap anggota grup akan memiliki data individual yang lengkap</li>
              <li>Semua anggota grup akan terhubung ke ketua grup yang sama</li>
            </ol>
          </div>

          <form onSubmit={handleGroupLeaderSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="groupName">Nama Grup <span className="text-red-500">*</span></Label>
                <Input
                  id="groupName"
                  value={groupData.groupName}
                  onChange={(e) => setGroupData(prev => ({ ...prev, groupName: e.target.value }))}
                  placeholder="Contoh: Keluarga Besar Wijaya"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupLeader">Nama Ketua Grup <span className="text-red-500">*</span></Label>
                <Input
                  id="groupLeader"
                  value={groupData.groupLeader}
                  onChange={(e) => setGroupData(prev => ({ ...prev, groupLeader: e.target.value }))}
                  placeholder="Nama lengkap ketua grup"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupEmail">Email Ketua Grup <span className="text-red-500">*</span></Label>
                <Input
                  id="groupEmail"
                  type="email"
                  value={groupData.groupEmail}
                  onChange={(e) => setGroupData(prev => ({ ...prev, groupEmail: e.target.value }))}
                  placeholder="email@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="groupPhone">Telepon Ketua Grup <span className="text-red-500">*</span></Label>
                <Input
                  id="groupPhone"
                  value={groupData.groupPhone}
                  onChange={(e) => setGroupData(prev => ({ ...prev, groupPhone: e.target.value }))}
                  placeholder="08123456789"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="group_trip_id">Trip <span className="text-red-500">*</span></Label>
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
                <Label htmlFor="total_group_participants">Total Peserta dalam Grup <span className="text-red-500">*</span></Label>
                <Input
                  id="total_group_participants"
                  type="number"
                  min="1"
                  value={groupData.total_group_participants}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseInt(e.target.value)
                    setGroupData(prev => ({ ...prev, total_group_participants: isNaN(val) ? '' : val }))
                  }}
                  placeholder="Contoh: 5"
                  required
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_package_price">Total Harga Paket Grup <span className="text-red-500">*</span></Label>
                <Input
                  id="total_package_price"
                  type="number"
                  min="0"
                  value={groupData.total_package_price}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                    setGroupData(prev => ({ ...prev, total_package_price: isNaN(val) ? '' : val }))
                  }}
                  placeholder="0"
                  required
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_dp_amount">Total DP Grup</Label>
                <Input
                  id="total_dp_amount"
                  type="number"
                  min="0"
                  value={groupData.total_dp_amount}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                    setGroupData(prev => ({ ...prev, total_dp_amount: isNaN(val) ? '' : val }))
                  }}
                  placeholder="0"
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupAddress">Alamat Ketua Grup <span className="text-red-500">*</span></Label>
              <Textarea
                id="groupAddress"
                value={groupData.groupAddress}
                onChange={(e) => setGroupData(prev => ({ ...prev, groupAddress: e.target.value }))}
                placeholder="Alamat lengkap ketua grup..."
                required
                rows={3}
              />
            </div>

            {/* Meeting Point Section */}
            <div className="space-y-4 p-4 border rounded-lg bg-green-50">
              <Label className="text-base font-semibold flex items-center space-x-2">
                <Navigation className="h-5 w-5" />
                <span>Titik Kumpul Grup</span>
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
                  Titik Kumpul Khusus Grup (Opsional)
                </Label>
                <Textarea
                  id="group_meeting_point_details"
                  value={groupData.meeting_point_details}
                  onChange={(e) => setGroupData(prev => ({ ...prev, meeting_point_details: e.target.value }))}
                  placeholder="Kosongkan jika menggunakan titik kumpul default trip, atau isi dengan lokasi khusus untuk grup..."
                  rows={3}
                />
                <p className="text-xs text-gray-500">
                  Jika diisi, seluruh grup akan menggunakan titik kumpul khusus ini. Jika kosong, akan menggunakan titik kumpul default dari trip.
                </p>
              </div>
            </div>

            <ProofOfTransferUploader
              url={groupProofOfTransferUrl}
              onUrlChange={handleUrlChange}
              title="Bukti Transfer DP Grup (Total)"
            />

            <div className="flex space-x-3 pt-4 border-t">
              <Button type="submit" disabled={creating}>
                {creating ? 'Mendaftarkan Ketua Grup...' : 'Daftarkan Ketua Grup'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    )
  }

  // Step 2: Add group members
  return (
    <div className="space-y-6">
      {/* Group Leader Summary */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="h-5 w-5" />
            <span>Ketua Grup Berhasil Didaftarkan</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Nama Grup:</span>
              <div className="font-medium">{groupData.groupName}</div>
            </div>
            <div>
              <span className="text-gray-600">Ketua Grup:</span>
              <div className="font-medium">{groupLeaderData?.full_name}</div>
            </div>
            <div>
              <span className="text-gray-600">Email:</span>
              <div className="font-medium">{groupLeaderData?.email}</div>
            </div>
            <div>
              <span className="text-gray-600">Trip:</span>
              <div className="font-medium">
                {trips.find(t => t.id === groupData.trip_id)?.name}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Total Peserta:</span>
              <div className="font-medium">{totalGroupParticipants} orang</div>
            </div>
            <div>
              <span className="text-gray-600">Total Harga:</span>
              <div className="font-medium text-green-600">{formatCurrency(totalGroupRevenue)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Group Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Ringkasan Grup</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-700">{totalGroupParticipants}</div>
              <div className="text-sm text-blue-600">Total Peserta</div>
              <div className="text-xs text-gray-500 mt-1">
                Ketua grup + {actualMembersCount} anggota
              </div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-700">{formatCurrency(totalGroupRevenue)}</div>
              <div className="text-sm text-green-600">Total Revenue</div>
              <div className="text-xs text-gray-500 mt-1">
                Pembayaran konsolidasi
              </div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-700">{formatCurrency(totalGroupDP)}</div>
              <div className="text-sm text-purple-600">Total DP</div>
              <div className="text-xs text-gray-500 mt-1">
                DP yang sudah dibayar
              </div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-700">
                {formatCurrency(totalGroupRevenue - totalGroupDP)}
              </div>
              <div className="text-sm text-orange-600">Sisa Bayar</div>
              <div className="text-xs text-gray-500 mt-1">
                Belum dibayar
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Members Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Anggota Grup</span>
              <Badge variant="outline">{groupMembers.length} anggota</Badge>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowCSVImport(true)}
                size="sm"
              >
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button
                onClick={() => setShowAddMemberForm(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Anggota
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Belum ada anggota grup</h3>
              <p className="text-sm mb-4">
                Tambahkan anggota grup satu per satu atau import dari CSV
              </p>
              <div className="flex justify-center space-x-2">
                <Button
                  onClick={() => setShowAddMemberForm(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Anggota
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCSVImport(true)}
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Import CSV
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {groupMembers.map((member, index) => (
                <div key={member.id} className="p-4 border rounded-lg bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                      <div>
                        <div className="font-medium text-gray-900">{member.full_name}</div>
                        <div className="text-sm text-gray-600">{member.email}</div>
                        <div className="text-sm text-gray-600">{member.phone}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">
                          <div>Pembayaran: Termasuk dalam grup</div>
                          <div className="text-xs text-gray-500">
                            (Konsolidasi di ketua grup)
                          </div>
                        </div>
                      </div>
                      <div>
                        <Badge variant="outline">Anggota #{index + 1}</Badge>
                        <div className="text-xs text-gray-500 mt-1">
                          Terdaftar: {formatShortDate(member.created_at)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Member Form */}
      {showAddMemberForm && (
        <ParticipantForm
          onSubmit={handleMemberSubmit}
          onCancel={() => setShowAddMemberForm(false)}
          trips={trips.filter(t => t.id === groupData.trip_id)} // Only show the selected trip
          sales={sales.filter(s => s.id === groupData.sales_id)} // Only show the selected sales
          creating={creating}
          updating={false}
          editingParticipant={null}
          parentParticipantId={groupLeaderId}
          isGroupMember={true}
        />
      )}

      {/* CSV Import Modal */}
      <CSVImportModal
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onImport={handleBulkImport}
        trips={trips.filter(t => t.id === groupData.trip_id)} // Only show the selected trip
        sales={sales.filter(s => s.id === groupData.sales_id)} // Only show the selected sales
        importing={creating}
        parentParticipantId={groupLeaderId}
      />

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={handleStartOver}
        >
          Mulai Ulang
        </Button>
        <Button
          onClick={() => {
            // Navigate back to participants list or close the form
            window.location.reload()
          }}
          className="bg-green-600 hover:bg-green-700"
        >
          Selesai
        </Button>
      </div>
    </div>
  )
}