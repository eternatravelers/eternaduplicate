import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Plus, Upload, UserPlus, Trash2, History } from 'lucide-react'
import { ParticipantForm } from '../components/ParticipantForm'
import { GroupRegistrationForm } from '../components/GroupRegistrationForm'
import { ParticipantHistoryTable } from '../components/ParticipantHistoryTable'
import { DeletedParticipantsTable } from '../components/DeletedParticipantsTable'
import { ParticipantAuditLog } from '../components/ParticipantAuditLog'
import { useParticipants, useCreateParticipant, useUpdateParticipant, useDeleteParticipant, useRestoreParticipant, useDeletedParticipants } from '@/hooks/useParticipants'
import { useTrips } from '@/hooks/useTrips'
import { useSales } from '@/hooks/useSales'
import { CSVImportModal } from '../components/CSVImportModal'
import { ParticipantStatsCards } from '../components/ParticipantStatsCards'
import { ParticipantDeletionSummary } from '../components/ParticipantDeletionSummary'
import { FileSpreadsheet, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'

export function ParticipantsPage() {
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [importError, setImportError] = useState<string>('')
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [activeTab, setActiveTab] = useState('individual')
  
  const { participants, loading, refetch } = useParticipants()
  const { deletedParticipants, loading: deletedLoading, refetch: refetchDeleted } = useDeletedParticipants()
  const { trips } = useTrips()
  const { sales } = useSales()
  const { createParticipant, loading: creating } = useCreateParticipant()
  const { updateParticipant, loading: updating } = useUpdateParticipant()
  const { deleteParticipant, loading: deleting } = useDeleteParticipant()
  const { restoreParticipant, loading: restoring } = useRestoreParticipant()
  const { isAdmin, isSuperAdmin } = useAuth()

  // Calculate stats
  const totalParticipants = participants.reduce((sum, p) => sum + (p.participant_count || 1), 0)
  const totalRevenue = participants.reduce((sum, p) => sum + (p.package_price || 0), 0)
  const totalDP = participants.reduce((sum, p) => sum + (p.dp_amount || 0), 0)

  const handleSubmit = async (data: any, file?: File | null) => {
    const { error } = editingParticipant
      ? await updateParticipant(editingParticipant, data, file)
      : await createParticipant(data, file)

    if (!error) {
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
    setActiveTab('individual')
  }

  const handleAddNew = () => {
    setEditingParticipant(null)
    setActiveTab('individual')
  }

  const handleCancel = () => {
    setEditingParticipant(null)
  }

  const handleDelete = async (id: string, reason?: string, permanent: boolean = false) => {
    try {
      const { error } = await deleteParticipant(id, reason, permanent)
      if (!error) {
        refetch()
        if (!permanent) {
          refetchDeleted() // Refresh deleted participants list
        }
      }
    } catch (error) {
      console.error('Error deleting participant:', error)
    }
  }

  const handleRestore = async (id: string) => {
    try {
      const { error } = await restoreParticipant(id)
      if (!error) {
        refetch()
        refetchDeleted()
      }
    } catch (error) {
      console.error('Error restoring participant:', error)
    }
  }

  const handlePermanentDelete = async (id: string, reason?: string) => {
    try {
      const { error } = await deleteParticipant(id, reason, true)
      if (!error) {
        refetchDeleted()
      }
    } catch (error) {
      console.error('Error permanently deleting participant:', error)
    }
  }

  const handleGroupSubmit = async (data: any, file?: File | null) => {
    const { error } = await createParticipant(data, file)
    if (!error) {
      refetch()
    }
  }

  const handleBulkImport = async (participantsData: any[]) => {
    try {
      // Import participants one by one
      for (const participantData of participantsData) {
        await createParticipant(participantData)
      }
      refetch()
    } catch (error) {
      setImportError('Gagal mengimpor beberapa peserta. Silakan coba lagi.')
      setTimeout(() => setImportError(''), 5000)
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
          <Button variant="outline" size="sm" onClick={() => setShowCSVImport(true)}>
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={handleAddNew}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Peserta
          </Button>
        </div>
      </div>

      {importError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}

      <ParticipantStatsCards
        totalParticipants={totalParticipants}
        totalRevenue={totalRevenue}
        totalDP={totalDP}
        deletedCount={deletedParticipants.length}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 max-w-4xl">
          <TabsTrigger value="individual">Pendaftaran Individual</TabsTrigger>
          <TabsTrigger value="group">Pendaftaran Group</TabsTrigger>
          <TabsTrigger value="history">Riwayat Pendaftaran</TabsTrigger>
          <TabsTrigger value="deleted">
            <div className="flex items-center space-x-1">
              <Trash2 className="h-3 w-3" />
              <span>Sampah</span>
              {deletedParticipants.length > 0 && (
                <span className="ml-1 bg-red-100 text-red-800 text-xs px-1.5 py-0.5 rounded-full">
                  {deletedParticipants.length}
                </span>
              )}
            </div>
          </TabsTrigger>
          <TabsTrigger value="audit">
            <div className="flex items-center space-x-1">
              <History className="h-3 w-3" />
              <span>Audit Log</span>
            </div>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-6">
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
            onDelete={handleDelete}
            deleting={deleting}
          />
        </TabsContent>

        <TabsContent value="deleted" className="space-y-6">
          {!isAdmin && !isSuperAdmin ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-medium mb-2">Akses Terbatas</h3>
              <p className="text-sm">Hanya admin yang dapat melihat peserta yang dihapus</p>
            </div>
          ) : (
            <div className="space-y-6">
              <ParticipantStatsCards
                totalParticipants={0}
                totalRevenue={0}
                totalDP={0}
                deletedCount={deletedParticipants.length}
                showDeletedStats={true}
              />
              
              <ParticipantDeletionSummary deletedParticipants={deletedParticipants} />
              
              <DeletedParticipantsTable
                deletedParticipants={deletedParticipants}
                onRestore={handleRestore}
                onPermanentDelete={handlePermanentDelete}
                restoring={restoring}
                permanentDeleting={deleting}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          {!isSuperAdmin ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-lg font-medium mb-2">Akses Terbatas</h3>
              <p className="text-sm">Hanya super admin yang dapat melihat audit log</p>
            </div>
          ) : (
            <ParticipantAuditLog />
          )}
        </TabsContent>
      </Tabs>

      <CSVImportModal
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onImport={handleBulkImport}
        trips={trips}
        sales={sales}
        importing={creating}
      />
    </div>
  )
}