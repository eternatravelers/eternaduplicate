import React, { useState } from 'react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Trash2, AlertTriangle, UserX, Loader2 } from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface DeleteParticipantDialogProps {
  participant: any
  onDelete: (id: string, reason?: string, permanent?: boolean) => Promise<void>
  deleting: boolean
  trigger?: React.ReactNode
}

export function DeleteParticipantDialog({
  participant,
  onDelete,
  deleting,
  trigger
}: DeleteParticipantDialogProps) {
  const [deleteType, setDeleteType] = useState<'soft' | 'permanent'>('soft')
  const [confirmText, setConfirmText] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const { isSuperAdmin, userRole } = useAuth()

  const handleDelete = async () => {
    if (deleteType === 'permanent' && confirmText !== participant.full_name) {
      return
    }

    try {
      await onDelete(participant.id, deleteType === 'permanent')
      setIsOpen(false)
      setConfirmText('')
      setDeleteType('soft')
    } catch (error) {
      console.error('Error deleting participant:', error)
    }
  }

  const resetForm = () => {
    setConfirmText('')
    setDeleteType('soft')
  }

  const canPermanentDelete = isSuperAdmin
  const requiresConfirmation = deleteType === 'permanent'

  return (
    <AlertDialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (!open) resetForm()
    }}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button 
            size="sm" 
            variant="ghost" 
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            title="Hapus peserta"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <UserX className="h-5 w-5 text-red-600" />
            <span>Hapus Peserta</span>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div className="text-sm text-red-800">
                    <p className="font-medium mb-1">Peringatan!</p>
                    <p>
                      Anda akan menghapus peserta dari sistem. Pastikan Anda memahami konsekuensi dari tindakan ini.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Detail Peserta:</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Nama:</span>
                    <div className="font-medium">{participant.full_name}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Email:</span>
                    <div className="font-medium">{participant.email}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Telepon:</span>
                    <div className="font-medium">{participant.phone}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Jumlah Peserta:</span>
                    <div className="font-medium">{participant.participant_count} orang</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Harga Paket:</span>
                    <div className="font-medium text-green-600">{formatCurrency(participant.package_price)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">DP:</span>
                    <div className="font-medium text-blue-600">{formatCurrency(participant.dp_amount)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Trip:</span>
                    <div className="font-medium">{participant.trips?.name || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={participant.status === 'confirmed' ? 'default' : 'secondary'}>
                      {participant.status}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Terdaftar:</span>
                    <div className="font-medium">{formatShortDate(participant.created_at)}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delete_type">Jenis Penghapusan</Label>
                  <Select value={deleteType} onValueChange={(value: 'soft' | 'permanent') => setDeleteType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="soft">
                        <div className="flex flex-col items-start">
                          <span>Hapus Sementara</span>
                          <span className="text-xs text-gray-500">Data dapat dipulihkan nanti</span>
                        </div>
                      </SelectItem>
                      {canPermanentDelete && (
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

                {requiresConfirmation && (
                  <div className="space-y-2">
                    <Label htmlFor="confirm_text" className="text-red-600">
                      Konfirmasi Penghapusan Permanen
                    </Label>
                    <Input
                      id="confirm_text"
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      placeholder={`Ketik "${participant.full_name}" untuk konfirmasi`}
                      className="border-red-300 focus:border-red-500 focus:ring-red-500"
                    />
                    <p className="text-xs text-red-600">
                      Ketik nama lengkap peserta untuk mengkonfirmasi penghapusan permanen
                    </p>
                  </div>
                )}

                {deleteType === 'permanent' && (
                  <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                      <div className="text-sm text-red-800">
                        <p className="font-medium">Penghapusan Permanen!</p>
                        <p>Data peserta akan dihapus selamanya dan tidak dapat dipulihkan.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={resetForm}>
            Batal
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete}
            disabled={
              deleting ||
              (requiresConfirmation && confirmText !== participant.full_name)
            }
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