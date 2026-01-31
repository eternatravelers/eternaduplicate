import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Plus, Upload, UserPlus, Trash2, History } from 'lucide-react'
import { ParticipantForm } from '../components/ParticipantForm'
import { GroupRegistrationForm } from '../components/GroupRegistrationForm'
import { ParticipantHistoryTable } from '../components/ParticipantHistoryTable'
import { DeletedParticipantsTable } from '../components/DeletedParticipantsTable'
import { useParticipants, useCreateParticipant, useUpdateParticipant, useDeleteParticipant, useRestoreParticipant, useDeletedParticipants, useAllParticipants } from '@/hooks/useParticipants'
import { useTrips } from '@/hooks/useTrips'
import { useSales } from '@/hooks/useSales'
import { CSVImportModal } from '../components/CSVImportModal'
import { ParticipantStatsCards } from '../components/ParticipantStatsCards'
import { ParticipantDeletionSummary } from '../components/ParticipantDeletionSummary'
import { FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

export function ParticipantsPage() {
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [importError, setImportError] = useState<string>('')
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [activeTab, setActiveTab] = useState('individual')
  const [operationError, setOperationError] = useState<string>('')
  const [successMessage, setSuccessMessage] = useState<string>('')
  
  const { participants, loading, refetch: baseRefetch } = useParticipants()
  const { deletedParticipants, loading: deletedLoading, refetch: refetchDeleted } = useDeletedParticipants()
  const { allParticipants } = useAllParticipants()

  const refetch = async () => {
    console.log('ParticipantsPage.refetch() called')
    await baseRefetch()
    console.log('ParticipantsPage.refetch() completed')
  }
  const { trips } = useTrips()
  const { sales } = useSales()
  const { createParticipant, loading: creating } = useCreateParticipant()
  const { updateParticipant, loading: updating } = useUpdateParticipant()
  const { deleteParticipant, loading: deleting } = useDeleteParticipant()
  const { restoreParticipant, loading: restoring } = useRestoreParticipant()
  const { isAdmin, isSuperAdmin } = useAuth()

  // Calculate stats - count actual participants (including all group members)
  const totalParticipants = allParticipants.length
  const totalRevenue = participants.reduce((sum, p) => sum + (p.package_price || 0), 0)
  const totalDP = participants.reduce((sum, p) => sum + (p.dp_amount || 0), 0)
  const totalPaid = participants.reduce((sum, p) => sum + (p.total_paid || 0), 0)
  const totalRemaining = participants.reduce((sum, p) => sum + (p.remaining_payment || 0), 0)
  const paidOffCount = participants.filter(p => p.payment_status === 'lunas').length

  const handleSubmit = async (data: any, file?: File | null) => {
    try {
      setOperationError('')
      setSuccessMessage('')

      console.log('handleSubmit started for', editingParticipant ? 'update' : 'create', 'with data:', data)

      const result = editingParticipant
        ? await updateParticipant(editingParticipant, data, file)
        : await createParticipant(data, file)

      console.log('Operation result:', result)

      if (result.error) {
        console.error('Operation failed with error:', result.error)
        setOperationError(result.error)
        return
      }

      setSuccessMessage(editingParticipant ? 'Peserta berhasil diperbarui' : 'Peserta berhasil ditambahkan')
      setTimeout(() => setSuccessMessage(''), 5000)

      console.log('Calling refetch...')
      await refetch()
      console.log('Refetch completed')

      setEditingParticipant(null)
      setShowEditModal(false)
      setActiveTab('history')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan data peserta'
      console.error('handleSubmit caught error:', errorMsg)
      setOperationError(errorMsg)
    }
  }

  const handleEdit = (participant: any) => {
    setEditingParticipant(participant.id)
    setShowEditModal(true)
  }

  const handleAddNew = () => {
    setEditingParticipant(null)
    setActiveTab('individual')
  }

  const handleCancel = () => {
    setEditingParticipant(null)
    setShowEditModal(false)
  }

  const handleDelete = async (id: string, reason?: string, permanent: boolean = false) => {
    try {
      setOperationError('')
      const { error } = await deleteParticipant(id, permanent)

      if (error) {
        setOperationError(error)
        return
      }

      await refetch()
      if (!permanent) {
        await refetchDeleted()
      }
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus peserta')
    }
  }

  const handleRestore = async (id: string) => {
    try {
      setOperationError('')
      const { error } = await restoreParticipant(id)

      if (error) {
        setOperationError(error)
        return
      }

      await refetch()
      await refetchDeleted()
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Terjadi kesalahan saat memulihkan peserta')
    }
  }

  const handlePermanentDelete = async (id: string, reason?: string) => {
    try {
      setOperationError('')
      const { error } = await deleteParticipant(id, true)

      if (error) {
        setOperationError(error)
        return
      }

      await refetchDeleted()
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : 'Terjadi kesalahan saat menghapus peserta secara permanen')
    }
  }

  const handleGroupSubmit = async (data: any, file?: File | null) => {
    try {
      setOperationError('')
      setSuccessMessage('')
      const { error } = await createParticipant(data, file)

      if (error) {
        setOperationError(error)
        return
      }

      setSuccessMessage('Group berhasil didaftarkan')
      setTimeout(() => setSuccessMessage(''), 5000)

      await refetch()
      setActiveTab('history')
    } catch (err) {
      setOperationError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftarkan group')
    }
  }

  const handleBulkImport = async (participantsData: any[]) => {
    try {
      for (const participantData of participantsData) {
        await createParticipant(participantData)
      }
      await refetch()
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

      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{successMessage}</AlertDescription>
        </Alert>
      )}

      {importError && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{importError}</AlertDescription>
        </Alert>
      )}

      {operationError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{operationError}</AlertDescription>
        </Alert>
      )}

      <ParticipantStatsCards
        totalParticipants={totalParticipants}
        totalRevenue={totalRevenue}
        totalDP={totalDP}
        deletedCount={deletedParticipants.length}
        totalPaid={totalPaid}
        totalRemaining={totalRemaining}
        paidOffCount={paidOffCount}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-3xl">
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
            onRefresh={refetch}
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
      </Tabs>

      <CSVImportModal
        isOpen={showCSVImport}
        onClose={() => setShowCSVImport(false)}
        onImport={handleBulkImport}
        trips={trips}
        sales={sales}
        importing={creating}
      />

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Peserta</DialogTitle>
          </DialogHeader>
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
        </DialogContent>
      </Dialog>
    </div>
  )
}