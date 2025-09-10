import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Trash2, RotateCcw, Search, Filter, AlertTriangle, RefreshCw, Trash } from 'lucide-react'
import { useTransactions, useRestoreTransaction, usePermanentDeleteTransaction } from '@/hooks/useTransactions'
import { formatCurrency, formatShortDate } from '@/lib/utils'

export function TrashTransactions() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  
  // Fetch deleted transactions
  const { transactions: deletedTransactions, loading, refetch } = useTransactions({ includeDeleted: true })
  const { restoreTransaction, loading: restoring, error: restoreError } = useRestoreTransaction()

  const filteredTransactions = deletedTransactions.filter(transaction => {
    const matchesSearch = 
      transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.trips?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || transaction.transaction_type === filterType
    
    return matchesSearch && matchesType
  })

  const handleRestore = async (id: string) => {
    try {
      const { error } = await restoreTransaction(id)
      if (!error) {
        refetch()
      }
    } catch (error) {
      console.error('Error restoring transaction:', error)
    }
  }

  const summaryData = {
    totalDeleted: deletedTransactions.length,
    totalDeletedIncome: deletedTransactions
      .filter(t => t.transaction_type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0),
    totalDeletedExpense: deletedTransactions
      .filter(t => t.transaction_type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Sampah Transaksi</h1>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sampah Transaksi</h1>
          <p className="text-gray-600 mt-2">Kelola transaksi yang telah dihapus</p>
        </div>
        <Button 
          variant="outline" 
          onClick={refetch}
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Alerts */}
      {restoreError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Gagal memulihkan transaksi: {restoreError}
          </AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Transaksi Dihapus
            </CardTitle>
            <Trash2 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {summaryData.totalDeleted}
            </div>
            <p className="text-xs text-gray-500">
              Transaksi di sampah
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pemasukan Dihapus
            </CardTitle>
            <Trash2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summaryData.totalDeletedIncome)}
            </div>
            <p className="text-xs text-gray-500">
              Total pemasukan dihapus
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pengeluaran Dihapus
            </CardTitle>
            <Trash2 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summaryData.totalDeletedExpense)}
            </div>
            <p className="text-xs text-gray-500">
              Total pengeluaran dihapus
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Transaksi Dihapus</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Cari Transaksi</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Cari kategori, keterangan, atau trip..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filter_type">Jenis Transaksi</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                  <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deleted Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5" />
            <span>Transaksi yang Dihapus</span>
            <Badge variant="outline" className="ml-2">
              {filteredTransactions.length} transaksi
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Trash2 className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">
                {searchTerm || filterType !== 'all' ? 'Tidak ada transaksi yang cocok' : 'Sampah kosong'}
              </h3>
              <p className="text-sm">
                {searchTerm || filterType !== 'all' 
                  ? 'Coba ubah filter pencarian Anda'
                  : 'Belum ada transaksi yang dihapus'
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
                  <TableHead>Keterangan</TableHead>
                  <TableHead>Dihapus</TableHead>
                  <TableHead className="w-32">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
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
                          onClick={() => handleRestore(transaction.id)}
                          disabled={restoring}
                          title="Pulihkan transaksi"
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Info Box */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Informasi Sampah Transaksi:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Transaksi di sampah tidak mempengaruhi laporan keuangan aktif</li>
                <li>Anda dapat memulihkan transaksi kapan saja dengan tombol "Pulihkan"</li>
                <li>Hapus permanen akan menghilangkan data selamanya - gunakan dengan hati-hati</li>
                <li>Data di sampah tetap tersimpan hingga Anda menghapusnya secara permanen</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}