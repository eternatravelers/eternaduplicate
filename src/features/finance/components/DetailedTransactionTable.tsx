import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { FileText, Trash2 } from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'

interface DetailedTransactionTableProps {
  transactions: any[]
  onDeleteTransaction: (id: string) => void
  deleting: boolean
}

export function DetailedTransactionTable({
  transactions,
  onDeleteTransaction,
  deleting
}: DetailedTransactionTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detail Laporan</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Kategori</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Trip</TableHead>
              <TableHead>Keterangan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{formatShortDate(transaction.transaction_date)}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    transaction.transaction_type === 'Pemasukan' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {transaction.transaction_type}
                  </span>
                </TableCell>
                <TableCell>{transaction.category}</TableCell>
                <TableCell className={transaction.transaction_type === 'Pemasukan' ? 'text-green-600' : 'text-red-600'}>
                  {transaction.transaction_type === 'Pemasukan' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </TableCell>
                <TableCell>{transaction.trips?.name || '-'}</TableCell>
                <TableCell className="max-w-xs truncate">{transaction.description || '-'}</TableCell>
                <TableCell>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        title="Hapus transaksi"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Transaksi</AlertDialogTitle>
                        <AlertDialogDescription>
                          Apakah Anda yakin ingin menghapus transaksi ini? 
                          Transaksi akan dipindahkan ke sampah dan dapat dipulihkan nanti.
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
                          onClick={() => onDeleteTransaction(transaction.id)}
                          disabled={deleting}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          {deleting ? 'Menghapus...' : 'Pindah ke Sampah'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Tidak ada data untuk periode yang dipilih</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}