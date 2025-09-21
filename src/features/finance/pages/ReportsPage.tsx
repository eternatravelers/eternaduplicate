import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Download, AlertCircle } from 'lucide-react'
import { TransactionFilter } from '../components/TransactionFilter'
import { FinancialSummaryCards } from '../components/FinancialSummaryCards'
import { DetailedTransactionTable } from '../components/DetailedTransactionTable'
import { useTransactions, useDeleteTransaction } from '@/hooks/useTransactions'
import { useParticipants } from '@/hooks/useParticipants'

export function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [reportType, setReportType] = useState('all')
  
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

      <TransactionFilter
        dateFrom={dateFrom}
        setDateFrom={setDateFrom}
        dateTo={dateTo}
        setDateTo={setDateTo}
        reportType={reportType}
        setReportType={setReportType}
      />

      <FinancialSummaryCards
        summaryData={summaryData}
        profit={profit}
      />

      <DetailedTransactionTable
        transactions={filteredTransactions}
        onDeleteTransaction={handleDeleteTransaction}
        deleting={deleting}
      />
    </div>
  )
}