import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, AlertCircle } from 'lucide-react'
import { TransactionForm } from '../components/TransactionForm'
import { TransactionTable } from '../components/TransactionTable'
import { TransactionFilter } from '../components/TransactionFilter'
import { FinanceStatsCards } from '../components/FinanceStatsCards'
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from '@/hooks/useTransactions'
import { useTrips } from '@/hooks/useTrips'
import { useDestinations } from '@/hooks/useDestinations'

export function FinancePage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [selectedTrip, setSelectedTrip] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { transactions, loading, refetch } = useTransactions()
  const { trips, loading: tripsLoading } = useTrips()
  const { destinations, loading: destinationsLoading } = useDestinations()
  const { createTransaction, loading: creating } = useCreateTransaction()
  const { updateTransaction, loading: updating } = useUpdateTransaction()
  const { deleteTransaction, loading: deleting, error: deleteError } = useDeleteTransaction()

  // Check if any supporting data is still loading
  const dataLoading = tripsLoading || destinationsLoading

  // Filter transactions based on search, date, and trip filters
  const filteredTransactions = transactions.filter(transaction => {
    try {
      const transactionDate = new Date(transaction.transaction_date)
      const fromDate = dateFrom ? new Date(dateFrom) : null
      const toDate = dateTo ? new Date(dateTo) : null

      let dateMatch = true
      if (fromDate) dateMatch = dateMatch && transactionDate >= fromDate
      if (toDate) dateMatch = dateMatch && transactionDate <= toDate

      const typeMatch = filterType === 'all' || transaction.transaction_type === filterType

      const tripMatch = !selectedTrip || transaction.trip_id === selectedTrip

      const searchMatch =
        transaction.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.trips?.name?.toLowerCase().includes(searchTerm.toLowerCase())

      return dateMatch && typeMatch && tripMatch && searchMatch
    } catch {
      return false
    }
  })

  // Calculate stats
  const totalIncome = filteredTransactions
    .filter(t => t.transaction_type === 'Pemasukan')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpense = filteredTransactions
    .filter(t => t.transaction_type === 'Pengeluaran')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const netBalance = totalIncome - totalExpense

  const handleSubmit = async (formData: any, file?: File | null) => {
    try {
      setError(null)
      
      // For now, we'll store the file reference in the description if provided
      // In a real implementation, you'd upload to Supabase Storage
      let finalData = { ...formData }
      if (file) {
        finalData.description = `${formData.description || ''} [Bukti: ${file.name}]`.trim()
      }

      const { data, error } = await createTransaction(finalData)

      if (error) {
        setError(error)
        return
      }

      if (data) {
        setShowAddForm(false)
        setEditingTransaction(null)
        refetch()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleEdit = (transaction: any) => {
    setEditingTransaction(transaction.id)
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      setError(null)
      const { error } = await deleteTransaction(id)
      if (error) {
        setError(error)
        return
      }
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleAddNew = () => {
    setEditingTransaction(null)
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingTransaction(null)
    setError(null)
  }

  const handleFormSubmit = async (formData: any, file?: File | null) => {
    try {
      setError(null)
      
      // For now, we'll store the file reference in the description if provided
      // In a real implementation, you'd upload to Supabase Storage
      let finalData = { ...formData }
      if (file) {
        finalData.description = `${formData.description || ''} [Bukti: ${file.name}]`.trim()
      }

      let result
      if (editingTransaction) {
        result = await updateTransaction(editingTransaction, finalData)
      } else {
        result = await createTransaction(finalData)
      }

      const { data, error } = result

      if (error) {
        setError(error)
        return
      }

      if (data) {
        setShowAddForm(false)
        setEditingTransaction(null)
        refetch()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const resetFilters = () => {
    setDateFrom('')
    setDateTo('')
    setFilterType('all')
    setSearchTerm('')
    setSelectedTrip('')
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manajemen Keuangan</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!transactions || transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Keuangan</h1>
            <p className="text-gray-600 mt-2">Kelola pemasukan dan pengeluaran bisnis travel Anda</p>
          </div>
          <Button
            onClick={handleAddNew}
            disabled={dataLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            {dataLoading ? 'Memuat data...' : 'Tambah Transaksi'}
          </Button>
        </div>
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-lg font-medium mb-2">Belum ada transaksi</h3>
          <p className="text-sm mb-4">Mulai dengan menambahkan transaksi pertama Anda</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Manajemen Keuangan</h1>
          <p className="text-gray-600 mt-2">Kelola pemasukan dan pengeluaran bisnis travel Anda</p>
        </div>
        <Button
          onClick={handleAddNew}
          disabled={dataLoading}
          className="bg-green-600 hover:bg-green-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          {dataLoading ? 'Memuat data...' : 'Tambah Transaksi'}
        </Button>
      </div>

      {(error || deleteError) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || deleteError}</AlertDescription>
        </Alert>
      )}

      <FinanceStatsCards
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        netBalance={netBalance}
        transactionCount={filteredTransactions.length}
      />

      {showAddForm && (
        <TransactionForm
          initialData={editingTransaction ? transactions.find(t => t.id === editingTransaction) : undefined}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          trips={trips || []}
          destinations={destinations || []}
          creating={creating}
          updating={updating}
          editingTransaction={editingTransaction}
        />
      )}

      <TransactionFilter
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        selectedTrip={selectedTrip}
        setSelectedTrip={setSelectedTrip}
        trips={trips || []}
        onReset={resetFilters}
        showReportType={false}
        showSearch={true}
      />

      <TransactionTable
        transactions={filteredTransactions}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onEdit={handleEdit}
        onDelete={handleDelete}
        deleting={deleting}
      />
    </div>
  )
}