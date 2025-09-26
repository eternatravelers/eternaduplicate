import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Trash2, RotateCcw, X, AlertTriangle, Users } from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface DeletedParticipantsTableProps {
  deletedParticipants: any[]
  onRestore: (id: string) => Promise<void>
  onPermanentDelete: (id: string) => Promise<void>
  restoring: boolean
  permanentDeleting: boolean
}

export function DeletedParticipantsTable({
  deletedParticipants,
  onRestore,
  onPermanentDelete,
  restoring,
  permanentDeleting
}: DeletedParticipantsTableProps) {
  const { isSuperAdmin } = useAuth()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="outline" className="border-green-200 text-green-700">Dikonfirmasi</Badge>
      case 'pending':
        return <Badge variant="outline" className="border-yellow-200 text-yellow-700">Pending</Badge>
      case 'cancelled':
        return <Badge variant="outline" className="border-red-200 text-red-700">Dibatalkan</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trash2 className="h-5 w-5 text-red-600" />
          <span>Peserta yang Dihapus</span>
          <Badge variant="outline" className="ml-2">
            {deletedParticipants.length} peserta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {deletedParticipants.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trash2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">Tidak ada peserta yang dihapus</h3>
            <p className="text-sm">Belum ada peserta yang dipindahkan ke sampah</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Peserta</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Harga</TableHead>
                <TableHead>Status Asli</TableHead>
                <TableHead>Dihapus Oleh</TableHead>
                <TableHead>Tanggal Hapus</TableHead>
                <TableHead className="w-40">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {deletedParticipants.map((participant) => (
                <TableRow key={participant.id} className="opacity-75 bg-red-50">
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{participant.full_name}</div>
                      {participant.additional_requests && (
                        <div className="text-xs text-gray-500 max-w-xs truncate">
                          {participant.additional_requests}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {participant.trips?.name ? (
                      <div className="text-sm">
                        <div className="font-medium">{participant.trips.name}</div>
                        <div className="text-gray-500">{formatShortDate(participant.trips.departure_date)}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{participant.email}</div>
                      <div className="text-gray-500">{participant.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{participant.participant_count}</div>
                      <div className="text-xs text-gray-500">orang</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium text-green-600">{formatCurrency(participant.package_price)}</div>
                      <div className="text-gray-500">DP: {formatCurrency(participant.dp_amount)}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(participant.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{participant.deleted_by_user_name || 'Unknown'}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {formatShortDate(participant.deleted_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRestore(participant.id)}
                        disabled={restoring}
                        title="Pulihkan peserta"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      
                      {isSuperAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              title="Hapus permanen"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              disabled={permanentDeleting}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center space-x-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                <span>Hapus Permanen</span>
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                <div className="space-y-3">
                                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-800 font-medium">
                                      ⚠️ PERINGATAN: Tindakan ini tidak dapat dibatalkan!
                                    </p>
                                    <p className="text-red-700 text-sm mt-1">
                                      Data peserta akan dihapus selamanya dari sistem.
                                    </p>
                                  </div>
                                  
                                  <div>
                                    <strong>Detail Peserta:</strong>
                                    <br />• Nama: {participant.full_name}
                                    <br />• Email: {participant.email}
                                    <br />• Trip: {participant.trips?.name || 'N/A'}
                                    <br />• Harga: {formatCurrency(participant.package_price)}
                                    <br />• Dihapus: {formatShortDate(participant.deleted_at)}
                                    <br />• Alasan: {participant.deletion_reason || 'Tidak ada alasan'}
                                  </div>
                                </div>
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onPermanentDelete(participant.id)}
                                disabled={permanentDeleting}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {permanentDeleting ? 'Menghapus...' : 'Hapus Permanen'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}