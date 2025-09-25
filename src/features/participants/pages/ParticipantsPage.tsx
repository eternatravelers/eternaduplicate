```tsx
import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Users, Plus, Upload, UserPlus, Trash2, History, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { ParticipantHistoryTable } from '../components/ParticipantHistoryTable'
import { DeletedParticipantsTable } from '../components/DeletedParticipantsTable'
import { ParticipantAuditLog } from '../components/ParticipantAuditLog'
import { useParticipants, useCreateParticipant, useUpdateParticipant, useDeleteParticipant, useRestoreParticipant, useDeletedParticipants } from '@/hooks/useParticipants'
import { useTrips } from '@/hooks/useTrips'
import { useSales } from '@/hooks/useSales'
import { CSVImportModal } from '../components/CSVImportModal'
import { ParticipantStatsCards } from '../components/ParticipantStatsCards'
import { ParticipantDeletionSummary } from '../components/ParticipantDeletionSummary'
import { Alert } from '@/components/ui/alert'
import { useAuth } from '@/hooks/useAuth'
import { Label } from '@/components/ui/label'
import { IndividualRegistrationPage } from './IndividualRegistrationPage'
import { GroupRegistrationPage } from './GroupRegistrationPage'

export function ParticipantsPage() {
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [importError, setImportError] = useState<string>('')
  const [showCSVImport, setShowCSVImport] = useState(false)
  const [activeTab, setActiveTab] = useState('individual-registration') // Default to individual registration
  const [historyFilter, setHistoryFilter] = useState<'all' | 'individual' | 'group_leader' | 'group_member'>('all')

  const { participants, loading, refetch } = useParticipants({
    searchTerm,
    statusFilter: filterStatus,
    typeFilter: historyFilter
  })
  const { deletedParticipants, loading: deletedLoading, refetch: refetchDeleted } = useDeletedParticipants()
  const { trips } = useTrips()
  const { sales } = useSales()
  const { createParticipant, loading: creating } = useCreateParticipant()
  const { deleteParticipant, loading: deleting } = useDeleteParticipant()
  const { restoreParticipant, loading: restoring } = useRestoreParticipant()
  const { isAdmin, isSuperAdmin } = useAuth()

  // Calculate stats
  const consolidatedParticipants = participants.filter(p => !p.parent_participant_id)
  const totalParticipants = consolidatedParticipants.reduce((sum, p) => sum + (p.participant_count || 1), 0)
  const totalRevenue = consolidatedParticipants.reduce((sum, p) => sum + (p.package_price || 0), 0)
  const totalDP = consolidatedParticipants.reduce((sum, p) => sum + (p.dp_amount || 0), 0)

  const handleParticipantSaved = () => {
    refetch()
  }

  const handleGroupSaved = () => {
    refetch()
    setActiveTab('history') // Navigate to history after group is saved
    setHistoryFilter('group_leader') // Show group leaders in history
  }

  const handleEdit = (participantId: string) => {
    setEditingParticipantId(participantId)
    setActiveTab('individual-registration') // Switch to individual registration page for editing
  }

  const handleCancelEdit = () => {
    setEditingParticipantId(null)
  }

  const handleDelete = async (id: string, reason?: string, permanent: boolean = false) => {
    try {
      const { error } = await deleteParticipant(id, reason, permanent)
      if (!error) {
        refetch()
        if (!permanent) {
          refetchDeleted()
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

  const handleBulkImport = async (participantsData: any[]) => {
    try {
      for (const participantData of participantsData) {
        await createParticipant(participantData)
      }
      refetch()
      setShowCSVImport(false)
      setActiveTab('history') // Navigate to history after import
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
          <Button onClick={() => {
            setEditingParticipantId(null)
            setActiveTab('individual-registration')
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Tambah Peserta Individual
          </Button>
          <Button onClick={() => setActiveTab('group-registration')}>
            <UserPlus className="h-4 w-4 mr-2" />
            Tambah Grup
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
          <TabsTrigger value="individual-registration">Pendaftaran Individual</TabsTrigger>
          <TabsTrigger value="group-registration">Pendaftaran Grup</TabsTrigger>
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

        <TabsContent value="individual-registration" className="space-y-6">
          <IndividualRegistrationPage
            editingParticipantId={editingParticipantId}
            onCancelEdit={handleCancelEdit}
            onParticipantSaved={handleParticipantSaved}
          />
        </TabsContent>

        <TabsContent value="group-registration" className="space-y-6">
          <GroupRegistrationPage
            onGroupSaved={handleGroupSaved}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center space-x-4 mb-4">
            <Label className="text-sm font-medium">Filter Riwayat:</Label>
            <div className="flex space-x-2">
              <Button
                variant={historyFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHistoryFilter('all')}
              >
                Semua Peserta
              </Button>
              <Button
                variant={historyFilter === 'individual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHistoryFilter('individual')}
              >
                Individual
              </Button>
              <Button
                variant={historyFilter === 'group_leader' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHistoryFilter('group_leader')}
              >
                Ketua Grup
              </Button>
              <Button
                variant={historyFilter === 'group_member' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setHistoryFilter('group_member')}
              >
                Anggota Grup
              </Button>
            </div>
          </div>
          <ParticipantHistoryTable
            participants={participants}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            onEdit={handleEdit}
            onDelete={handleDelete}
            deleting={deleting}
            historyFilter={historyFilter}
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
```