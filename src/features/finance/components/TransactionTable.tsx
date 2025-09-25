import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { DollarSign, Search, Edit, Trash2, Eye, FileText } from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface TransactionTableProps {
  transactions: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  onEdit: (transaction: any) => void
  onDelete: (id: string) => void
  deleting: boolean
}

export function TransactionTable({
  transactions,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
  deleting
}: TransactionTableProps) {
  const { isSuperAdmin } = useAuth()

  const filteredTransactions = transactions.filter(transaction =>
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.trips?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case 'Pemasukan':
        return <Badge className="bg-green-100 text-green-800">Pemasukan</Badge>
      case 'Pengeluaran':
        return <Badge className="bg-red-100 text-red-800">Pengeluaran</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const getAmountDisplay = (amount: number, type: string) => {
    const color = type === 'Pemasukan' ? 'text-green-600' : 'text-red-600'
    const prefix = type === 'Pemasukan' ? '+' : '-'
    return (
      <span className={`font-medium ${color}`}>
        {prefix}{formatCurrency(amount)}
      </span>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <span>Daftar Transaksi</span>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari transaksi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'Transaksi tidak ditemukan' : 'Belum ada transaksi'}
            </h3>
            <p className="text-sm mb-4">
              {searchTerm 
                ? 'Coba gunakan kata kunci yang berbeda'
                : 'Mulai dengan menambahkan transaksi pertama Anda'
              }
            </p>
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
                <TableHead>Destinasi</TableHead>
                <TableHead>Keterangan</TableHead>
                <TableHead>Bukti</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    <div className="text-sm">
                      {formatShortDate(transaction.transaction_date)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTransactionTypeBadge(transaction.transaction_type)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {transaction.category}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getAmountDisplay(transaction.amount, transaction.transaction_type)}
                  </TableCell>
                  <TableCell>
                    {transaction.trips?.name ? (
                      <div className="text-sm">
                        <div className="font-medium">{transaction.trips.name}</div>
                        <div className="text-gray-500">{transaction.trip_type}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {transaction.destinations?.name || (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {transaction.description ? (
                        <div className="text-sm text-gray-700 truncate" title={transaction.description}>
                          {transaction.description}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {transaction.proof_url ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(transaction.proof_url!, '_blank')}
                        title="Lihat bukti transaksi"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Lihat
                      </Button>
                    ) : (
                      <Badge variant="outline" className="text-gray-500">
                        Tidak ada
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(transaction)}
                        title="Edit transaksi"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {isSuperAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Hapus transaksi"
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
                                <br />• Keterangan: {transaction.description || 'N/A'}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onDelete(transaction.id)}
                                disabled={deleting}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {deleting ? 'Menghapus...' : 'Pindah ke Sampah'}
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