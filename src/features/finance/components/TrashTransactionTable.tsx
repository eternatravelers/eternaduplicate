import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, RotateCcw, X } from 'lucide-react'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { formatCurrency, formatShortDate } from '@/lib/utils'

interface TrashTransactionTableProps {
  transactions: any[]
  onRestoreTransaction: (id: string) => void
  onPermanentDelete: (id: string) => void
  restoring: boolean
  permanentDeleting: boolean
}

export function TrashTransactionTable({
  transactions,
  onRestoreTransaction,
  onPermanentDelete,
  restoring,
  permanentDeleting
}: TrashTransactionTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Trash2 className="h-5 w-5" />
          <span>Transaksi yang Dihapus</span>
          <Badge variant="outline" className="ml-2">
            {transactions.length} transaksi
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Trash2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">Sampah kosong</h3>
            <p className="text-sm">Belum ada transaksi yang dihapus</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Jenis</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Jumlah</TableHead>
                <TableHead>Trip</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Dihapus</TableHead>
                <TableHead className="w-40">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id} className="opacity-75">
                  <TableCell>{formatShortDate(transaction.transaction_date)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline"
                      className={`${
                        transaction.transaction_type === 'Pemasukan' 
                          ? 'border-green-200 text-green-700' 
                          : 'border-red-200 text-red-700'
                      }`}
                    >
                      {transaction.transaction_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell className={transaction.transaction_type === 'Pemasukan' ? 'text-green-600' : 'text-red-600'}>
                    {transaction.transaction_type === 'Pemasukan' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell>{transaction.trips?.name || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate">{transaction.description || '-'}</TableCell>
                  <TableCell>{formatShortDate(transaction.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onRestoreTransaction(transaction.id)}
                        disabled={restoring}
                        title="Pulihkan transaksi"
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <RotateCcw className="h-3 w-3" />
                      </Button>
                      {onPermanentDelete && (
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
                              <AlertDialogTitle>Hapus Permanen</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus transaksi ini secara permanen? 
                                Tindakan ini tidak dapat dibatalkan dan data akan hilang selamanya.
                                <br /><br />
                                <strong>Detail Transaksi:</strong>
                                <br />• Tanggal: {formatShortDate(transaction.transaction_date)}
                                <br />• Jenis: {transaction.transaction_type}
                                <br />• Kategori: {transaction.category}
                                <br />• Jumlah: {formatCurrency(transaction.amount)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onPermanentDelete(transaction.id)}
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