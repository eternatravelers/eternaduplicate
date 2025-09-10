import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { FileText, Download, Calendar, Filter, DollarSign, TrendingUp, Users, Trash2, AlertCircle } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useDeleteTransaction } from '@/hooks/useTransactions'
import { useParticipants } from '@/hooks/useParticipants'
import { formatCurrency, formatShortDate } from '@/lib/utils'

export function Reports() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reportType, setReportType] = useState('all')
  const [selectedTransaction, setSelectedTransaction] = useState<string | null>(null)
  
  const { transactions, loading: transactionsLoading } = useTransactions()
  const { deleteTransaction, loading: deleting, error: deleteError } = useDeleteTransaction()
  const { participants, loading: participantsLoading } = useParticipants()

  const filteredTransactions = transactions.filter(transaction => {
    const transactionDate = new Date(transaction.transaction_date)
    const fromDate = dateFrom ? new Date(dateFrom) : null
    const toDate = dateTo ? new Date(dateTo) : null
    
    let dateMatch = true
    if (fromDate) dateMatch = dateMatch && transactionDate >= fromDate
    if (toDate) dateMatch = dateMatch && transactionDate <= toDate
    
    const typeMatch = reportType === 'all' || transaction.transaction_type === reportType
    
    return dateMatch && typeMatch
  })

  const filteredParticipants = participants.filter(participant => {
    const participantDate = new Date(participant.created_at)
    const fromDate = dateFrom ? new Date(dateFrom) : null
    const toDate = dateTo ? new Date(dateTo) : null
    
    let dateMatch = true
    if (fromDate) dateMatch = dateMatch && participantDate >= fromDate
    if (toDate) dateMatch = dateMatch && participantDate <= toDate
    
    return dateMatch
  })

  const summaryData = {
    totalIncome: filteredTransactions
      .filter(t => t.transaction_type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpense: filteredTransactions
      .filter(t => t.transaction_type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0),
    totalParticipants: filteredParticipants.length,
    totalRevenue: filteredParticipants.reduce((sum, p) => sum + p.package_price, 0)
  }

  const profit = summaryData.totalIncome - summaryData.totalExpense

  const handleDeleteTransaction = async (id: string) => {
    try {
      const { error } = await deleteTransaction(id)
      if (!error) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
    } finally {
      setSelectedTransaction(null)
    }
  }

  if (transactionsLoading || participantsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Laporan & Rekapitulasi</h1>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Laporan & Rekapitulasi</h1>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Excel
        </Button>
      </div>

      {deleteError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Gagal menghapus transaksi: {deleteError}
          </AlertDescription>
        </Alert>
      )}

      {deleteError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Gagal menghapus transaksi: {deleteError}
          </AlertDescription>
        </Alert>
      )}

      {/* Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Laporan</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_from">Tanggal Dari</Label>
              <Input
                id="date_from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date_to">Tanggal Sampai</Label>
              <Input
                id="date_to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="report_type">Jenis Laporan</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Transaksi</SelectItem>
                  <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                  <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Button variant="outline" className="w-full">
                <Calendar className="h-4 w-4 mr-2" />
                Reset Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pemasukan
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(summaryData.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Pengeluaran
            </CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(summaryData.totalExpense)}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Profit
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit)}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Peserta
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryData.totalParticipants}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Report Table */}
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
              {filteredTransactions.map((transaction) => (
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
                            onClick={() => handleDeleteTransaction(transaction.id)}
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
          
          {filteredTransactions.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Tidak ada data untuk periode yang dipilih</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}