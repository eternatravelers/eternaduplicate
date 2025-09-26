import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Users, Plus, CreditCard as Edit, Trash2, UserPlus, Mail, Phone, MapPin } from 'lucide-react'
import { FileSpreadsheet } from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { useParticipants, useCreateParticipant, useUpdateParticipant, useDeleteParticipant } from '@/hooks/useParticipants'
import { GroupMembersCSVImportModal } from './GroupMembersCSVImportModal'

interface GroupMembersModalProps {
  isOpen: boolean
  onClose: () => void
  groupParticipant: any
  onRefresh: () => void
}

export function GroupMembersModal({
  isOpen,
  onClose,
  groupParticipant,
  onRefresh
}: GroupMembersModalProps) {
  const [showAddMemberForm, setShowAddMemberForm] = useState(false)
  const [editingMember, setEditingMember] = useState<string | null>(null)
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [memberFormData, setMemberFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    additional_requests: ''
  })

  const { participants: allParticipants, loading: participantsLoading, refetch } = useParticipants()
  const { createParticipant, loading: creating } = useCreateParticipant()
  const { updateParticipant, loading: updating } = useUpdateParticipant()
  const { deleteParticipant, loading: deleting } = useDeleteParticipant()

  // Filter group members
  const groupMembers = allParticipants.filter(p => p.parent_participant_id === groupParticipant?.id)

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowAddMemberForm(false)
      setEditingMember(null)
      resetMemberForm()
    }
  }, [isOpen])

  const resetMemberForm = () => {
    setMemberFormData({
      full_name: '',
      email: '',
      phone: '',
      address: '',
      additional_requests: ''
    })
  }

  const handleAddMember = () => {
    setEditingMember(null)
    resetMemberForm()
    setShowAddMemberForm(true)
  }

  const handleCSVImport = () => {
    setShowCSVImport(true)
  }

  const handleBulkImport = async (membersData: any[]) => {
    try {
      // Import members one by one
      for (const memberData of membersData) {
        await createParticipant(memberData)
      }
      refetch()
      onRefresh()
    } catch (error) {
      console.error('Error importing group members:', error)
    }
  }

  const handleEditMember = (member: any) => {
    setMemberFormData({
      full_name: member.full_name,
      email: member.email,
      phone: member.phone,
      address: member.address,
      additional_requests: member.additional_requests || ''
    })
    setEditingMember(member.id)
    setShowAddMemberForm(true)
  }

  const handleSubmitMember = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!groupParticipant) return

    const submitData = {
      trip_id: groupParticipant.trip_id,
      sales_id: groupParticipant.sales_id,
      full_name: memberFormData.full_name,
      email: memberFormData.email,
      phone: memberFormData.phone,
      address: memberFormData.address,
      participant_count: 1, // Always 1 for individual group members
      package_price: 0, // No additional payment - covered by group leader
      dp_amount: 0, // No additional DP - covered by group leader
      dp_transfer_date: groupParticipant.dp_transfer_date,
      additional_requests: memberFormData.additional_requests,
      meeting_point_details: groupParticipant.meeting_point_details,
      status: groupParticipant.status,
      parent_participant_id: groupParticipant.id, // Link to group leader
      proof_of_transfer_url: null // Group members don't need separate proof
    }

    try {
      if (editingMember) {
        await updateParticipant(editingMember, submitData)
      } else {
        await createParticipant(submitData)
      }
      
      setShowAddMemberForm(false)
      setEditingMember(null)
      resetMemberForm()
      refetch()
      onRefresh()
    } catch (error) {
      console.error('Error saving group member:', error)
    }
  }

  const handleDeleteMember = async (memberId: string) => {
    try {
      await deleteParticipant(memberId, false) // Soft delete
      refetch()
      onRefresh()
    } catch (error) {
      console.error('Error deleting group member:', error)
    }
  }

  const handleCancelMemberForm = () => {
    setShowAddMemberForm(false)
    setEditingMember(null)
    resetMemberForm()
    setShowCSVImport(false)
  }

  if (!groupParticipant) return null

  // Calculate group summary
  const totalMembers = groupMembers.length + 1 // +1 for group leader
  const expectedMembers = groupParticipant.participant_count
  const remainingSlots = Math.max(0, expectedMembers - totalMembers)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Anggota Grup - {groupParticipant.full_name}</span>
            <Badge variant="outline" className="ml-2">
              {totalMembers}/{expectedMembers} peserta
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Summary */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-blue-800 flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Informasi Grup</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nama Grup:</span>
                  <div className="font-medium">{groupParticipant.full_name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Trip:</span>
                  <div className="font-medium">{groupParticipant.trips?.name || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Total Harga:</span>
                  <div className="font-medium text-green-600">{formatCurrency(groupParticipant.package_price)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Total DP:</span>
                  <div className="font-medium text-purple-600">{formatCurrency(groupParticipant.dp_amount)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Kontak Grup:</span>
                  <div className="font-medium">{groupParticipant.email}</div>
                  <div className="text-gray-500">{groupParticipant.phone}</div>
                </div>
                <div>
                  <span className="text-gray-600">Keberangkatan:</span>
                  <div className="font-medium">{formatShortDate(groupParticipant.trips?.departure_date)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Anggota Terdaftar:</span>
                  <div className="font-medium">{totalMembers} dari {expectedMembers}</div>
                </div>
                <div>
                  <span className="text-gray-600">Sisa Slot:</span>
                  <div className={`font-medium ${remainingSlots > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {remainingSlots} slot
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Add Member Form */}
          {showAddMemberForm && (
            <Card className="border-green-200 shadow-lg">
              <CardHeader className="bg-green-50">
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <UserPlus className="h-5 w-5" />
                  <span>{editingMember ? 'Edit Anggota Grup' : 'Tambah Anggota Grup'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmitMember} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="member_full_name" className="text-sm font-medium">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="member_full_name"
                        value={memberFormData.full_name}
                        onChange={(e) => setMemberFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="Nama lengkap anggota grup"
                        required
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="member_email" className="text-sm font-medium">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="member_email"
                        type="email"
                        value={memberFormData.email}
                        onChange={(e) => setMemberFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                        required
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="member_phone" className="text-sm font-medium">
                        Nomor Telepon <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="member_phone"
                        value={memberFormData.phone}
                        onChange={(e) => setMemberFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="08123456789"
                        required
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="member_address" className="text-sm font-medium">
                        Alamat <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="member_address"
                        value={memberFormData.address}
                        onChange={(e) => setMemberFormData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="Alamat lengkap"
                        required
                        className="focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="member_additional_requests" className="text-sm font-medium">
                      Permintaan Khusus
                    </Label>
                    <Textarea
                      id="member_additional_requests"
                      value={memberFormData.additional_requests}
                      onChange={(e) => setMemberFormData(prev => ({ ...prev, additional_requests: e.target.value }))}
                      placeholder="Makanan khusus, kebutuhan medis, dll..."
                      rows={3}
                      className="focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  {/* Info Box */}
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <Users className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm text-blue-800">
                        <p className="font-medium mb-1">Informasi Anggota Grup:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-700">
                          <li>Anggota grup tidak perlu melakukan pembayaran terpisah</li>
                          <li>Pembayaran sudah ditangani oleh ketua grup</li>
                          <li>Trip dan sales akan sama dengan ketua grup</li>
                          <li>Titik kumpul akan mengikuti pengaturan grup</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 pt-4 border-t">
                    <Button 
                      type="submit" 
                      disabled={creating || updating}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {creating || updating ? 'Menyimpan...' : editingMember ? 'Update Anggota' : 'Tambah Anggota'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={handleCancelMemberForm}
                      className="border-gray-300"
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Group Members List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <span>Daftar Anggota Grup</span>
                  <Badge variant="outline">{groupMembers.length} anggota</Badge>
                </CardTitle>
                <Button 
                  onClick={handleAddMember}
                  disabled={remainingSlots <= 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Anggota
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Group Leader Info */}
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-semibold text-yellow-800 mb-2 flex items-center space-x-2">
                  <Users className="h-4 w-4" />
                  <span>Ketua Grup (Pembayar)</span>
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Nama:</span>
                    <div className="font-medium">{groupParticipant.full_name}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <div className="font-medium">{groupParticipant.email}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Telepon:</span>
                    <div className="font-medium">{groupParticipant.phone}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={groupParticipant.status === 'confirmed' ? 'default' : 'secondary'}>
                      {groupParticipant.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Members Table */}
              {groupMembers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <UserPlus className="h-16 w-16 mx-auto mb-4 opacity-30" />
                  <h3 className="text-lg font-medium mb-2">Belum ada anggota grup</h3>
                  <p className="text-sm mb-4">
                    Tambahkan anggota grup untuk melengkapi daftar peserta
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={handleCSVImport}
                      disabled={remainingSlots <= 0}
                      className="text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Import CSV
                    </Button>
                    <div className="flex justify-center space-x-2">
                      <Button 
                        variant="outline"
                        onClick={handleCSVImport}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Import CSV
                      </Button>
                      <Button 
                        onClick={handleAddMember}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Tambah Manual
                      </Button>
                    </div>
                    </Button>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>Kontak</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Permintaan Khusus</TableHead>
                      <TableHead>Terdaftar</TableHead>
                      <TableHead>Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupMembers.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{member.full_name}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="flex items-center space-x-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span>{member.email}</span>
                            </div>
                            <div className="flex items-center space-x-1 mt-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              <span>{member.phone}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {member.address}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {member.additional_requests || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {formatShortDate(member.created_at)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditMember(member)}
                              title="Edit anggota"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  title="Hapus anggota"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Hapus Anggota Grup</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Apakah Anda yakin ingin menghapus "{member.full_name}" dari grup ini?
                                    <br /><br />
                                    <strong>Detail Anggota:</strong>
                                    <br />• Nama: {member.full_name}
                                    <br />• Email: {member.email}
                                    <br />• Telepon: {member.phone}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Batal</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteMember(member.id)}
                                    disabled={deleting}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    {deleting ? 'Menghapus...' : 'Hapus Anggota'}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Progress Indicator */}
              {expectedMembers > 1 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Progress Pendaftaran Grup</span>
                    <span className="text-sm text-gray-600">
                      {totalMembers}/{expectedMembers} peserta
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((totalMembers / expectedMembers) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {remainingSlots > 0 ? (
                      <span className="text-orange-600">Masih perlu {remainingSlots} anggota lagi</span>
                    ) : (
                      <span className="text-green-600">Grup sudah lengkap!</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <GroupMembersCSVImportModal
          isOpen={showCSVImport}
          onClose={() => setShowCSVImport(false)}
          onImport={handleBulkImport}
          groupParticipant={groupParticipant}
          importing={creating}
        />
      </DialogContent>
    </Dialog>
  )
}