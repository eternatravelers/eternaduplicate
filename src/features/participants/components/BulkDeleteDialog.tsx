import React, { useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, AlertTriangle, Users, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface BulkDeleteDialogProps {
  selectedParticipants: any[]
  onBulkDelete: (participantIds: string[], permanent?: boolean) => Promise<void>
  deleting: boolean
  onClearSelection: () => void
}

export function BulkDeleteDialog({
  selectedParticipants,
  onBulkDelete,
  deleting,
  onClearSelection
}: BulkDeleteDialogProps) {
  const [deleteType, setDeleteType] = useState<'soft' | 'permanent'>('soft')
  const [isOpen, setIsOpen] = useState(false)

  const handleBulkDelete = async () => {
    try {
      const participantIds = selectedParticipants.map(p => p.id)
      await onBulkDelete(participantIds, deleteType === 'permanent')
      setIsOpen(false)
      setDeleteType('soft')
      onClearSelection()
    } catch (error) {
      console.error('Error bulk deleting participants:', error)
    }
  }

  const resetForm = () => {
    setDeleteType('soft')
  }

  const totalRevenue = selectedParticipants.reduce((sum, p) => sum + (p.package_price || 0), 0)
  const totalParticipants = selectedParticipants.reduce((sum, p) => sum + (p.participant_count || 1), 0)

  if (selectedParticipants.length === 0) {
    return null
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetForm()
    }}>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          size="sm"
          className="bg-red-600 hover:bg-red-700"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Hapus {selectedParticipants.length} Peserta
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-red-600" />
            <span>Hapus Multiple Peserta</span>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Peringatan Bulk Delete!</p>
                    <p>
                      Anda akan menghapus {selectedParticipants.length} peserta sekaligus. 
                      Pastikan Anda memahami konsekuensi dari tindakan ini.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Ringkasan Penghapusan:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Jumlah Registrasi:</span>
                    <div className="font-medium">{selectedParticipants.length} registrasi</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Peserta:</span>
                    <div className="font-medium">{totalParticipants} orang</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Total Revenue yang Terpengaruh:</span>
                    <div className="font-medium text-red-600">{formatCurrency(totalRevenue)}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bulk_delete_type">Jenis Penghapusan</Label>
                  <Select value={deleteType} onValueChange={(value: 'soft' | 'permanent') => setDeleteType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectItem value="permanent">
                      <div className="flex flex-col items-start">
                        <span className="text-red-600">Hapus Permanen</span>
                        <span className="text-xs text-red-500">Data akan hilang selamanya</span>
                      </div>
                    </SelectItem>
                        <SelectItem value="permanent">
                          <div className="flex flex-col items-start">
                            <span className="text-red-600">Hapus Permanen</span>
                            <span className="text-xs text-red-500">Data akan hilang selamanya</span>
                          </div>
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {deleteType === 'permanent' && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="text-sm text-red-800">
                        <p className="font-medium">Penghapusan Permanen!</p>
                        <p>Semua {selectedParticipants.length} peserta akan dihapus selamanya dan tidak dapat dipulihkan.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="max-h-32 overflow-y-auto border rounded-lg">
                <div className="p-3 bg-white">
                  <h5 className="font-medium text-gray-900 mb-2">Peserta yang akan dihapus:</h5>
                  <div className="space-y-1">
                    {selectedParticipants.map((participant, index) => (
                      <div key={participant.id} className="text-sm text-gray-700">
                        {index + 1}. {participant.full_name} ({participant.email})
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={resetForm}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleBulkDelete}
            disabled={deleting}
            className={deleteType === 'permanent' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'}
          >
            {deleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Menghapus...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {deleteType === 'permanent' ? 'Hapus Permanen' : 'Hapus Sementara'}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}