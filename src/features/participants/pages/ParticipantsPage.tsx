import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Plus, Upload, UserPlus } from 'lucide-react'
import { ParticipantForm } from '../components/ParticipantForm'
import { GroupRegistrationForm } from '../components/GroupRegistrationForm'
import { ParticipantHistoryTable } from '../components/ParticipantHistoryTable'
import { useParticipants, useCreateParticipant, useUpdateParticipant } from '@/hooks/useParticipants'
import { useTrips } from '@/hooks/useTrips'
import { useSales } from '@/hooks/useSales'

export function ParticipantsPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  const { participants, loading, refetch } = useParticipants()
  const { trips } = useTrips()
  const { sales } = useSales()
  const { createParticipant, loading: creating } = useCreateParticipant()
  const { updateParticipant, loading: updating } = useUpdateParticipant()

  const handleSubmit = async (data: any, file?: File | null) => {
    const { error } = editingParticipant
      ? await updateParticipant(editingParticipant, data, file)
      : await createParticipant(data, file)

    if (!error) {
      setShowAddForm(false)
      setEditingParticipant(null)
      refetch()
    }
  }

  const handleEdit = (participant: any) => {
    const formData = {
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
    }
    setEditingParticipant(participant.id)
    setShowAddForm(true)
  }

  const handleAddNew = () => {
    setEditingParticipant(null)
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingParticipant(null)
  }

  const handleGroupSubmit = async (data: any, file?: File | null) => {
    const { error } = await createParticipant(data, file)
    if (!error) {
      refetch()
    }
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

      {showAddForm && (
        <ParticipantForm
          initialData={editingParticipant ? participants.find(p => p.id === editingParticipant) : undefined}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          trips={trips}
          sales={sales}
          creating={creating}
          updating={updating}
          editingParticipant={editingParticipant}
        />
      )}

      <Tabs defaultValue="individual" className="space-y-6">
        <TabsList>
          <TabsTrigger value="individual">Pendaftaran Individual</TabsTrigger>
          <TabsTrigger value="group">Pendaftaran Group</TabsTrigger>
          <TabsTrigger value="history">Riwayat Pendaftaran</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
          <div className="text-center py-8 text-gray-500">
            <UserPlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Gunakan tombol "Tambah Peserta" di atas untuk mendaftarkan peserta individual</p>
          </div>
        </TabsContent>

        <TabsContent value="group" className="space-y-6">
          <GroupRegistrationForm
            onSubmit={handleGroupSubmit}
            trips={trips}
            sales={sales}
            creating={creating}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <ParticipantHistoryTable
            participants={participants}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onEdit={handleEdit}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}