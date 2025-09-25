import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, AlertTriangle, Trash2 } from 'lucide-react'
import { TransactionFilter } from '../components/TransactionFilter'
import { TrashTransactionTable } from '../components/TrashTransactionTable'
import { useTransactions, useRestoreTransaction } from '@/hooks/useTransactions'
import { formatCurrency } from '@/lib/utils'

export function TrashTransactionsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  
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

      <TransactionFilter
        dateFrom=""
        setDateFrom={() => {}}
        dateTo=""
        setDateTo={() => {}}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        showReportType={false}
        showSearch={true}
      />

      <TrashTransactionTable
        transactions={filteredTransactions}
        onRestoreTransaction={handleRestore}
        onPermanentDelete={handlePermanentDelete}
        restoring={restoring}
        permanentDeleting={permanentDeleting}
      />

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