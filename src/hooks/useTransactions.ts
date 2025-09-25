import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Transaction = Database['public']['Tables']['transactions']['Row'] & {
  trips?: Database['public']['Tables']['trips']['Row']
  destinations?: Database['public']['Tables']['destinations']['Row']
}

interface TransactionSummary {
  totalIncome: number
  totalExpense: number
  netBalance: number
}

interface TransactionFilters {
  startDate?: string
  endDate?: string
  tripIds?: string[]
  includeDeleted?: boolean
}

export function useTransactions(filters?: TransactionFilters) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('transactions')
        .select('id,transaction_date,transaction_type,category,amount,description,trip_id,destination_id,trip_type,status,created_at,updated_at')


      // Filter by status - default to active only unless includeDeleted is true
      if (filters?.includeDeleted) {
        query = query.in('status', ['deleted'])
      } else {
        query = query.in('status', ['active'])
      }

      // Apply date filters
      if (filters?.startDate) {
        query = query.gte('transaction_date', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('transaction_date', filters.endDate)
      }

      // Apply trip filter if tripIds are provided
      if (filters?.tripIds && filters.tripIds.length > 0) {
        query = query.in('trip_id', filters.tripIds)
      }

      const { data, error } = await query.order('transaction_date', { ascending: false })

      if (error) throw error

      setTransactions(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [filters?.startDate, filters?.endDate, filters?.tripIds?.join(','), filters?.includeDeleted])

  return { transactions, loading, error, refetch: fetchTransactions }
}

export function useTransactionSummary(filters?: TransactionFilters) {
  const [summary, setSummary] = useState<TransactionSummary>({
    totalIncome: 0,
    totalExpense: 0,
    netBalance: 0
  })

  const { transactions } = useTransactions(filters)

  useEffect(() => {
    const income = transactions
      .filter(t => t.transaction_type === 'Pemasukan')
      .reduce((sum, t) => sum + t.amount, 0)

    const expense = transactions
      .filter(t => t.transaction_type === 'Pengeluaran')
      .reduce((sum, t) => sum + t.amount, 0)

    setSummary({
      totalIncome: income,
      totalExpense: expense,
      netBalance: income - expense
    })
  }, [transactions])

  return summary
}

export function useCreateTransaction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTransaction = async (transactionData: Database['public']['Tables']['transactions']['Insert']) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { createTransaction, loading, error }
}

export function useDeleteTransaction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteTransaction = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Soft delete - update status to 'deleted' instead of actually deleting
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'deleted' })
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { deleteTransaction, loading, error }
}

export function useRestoreTransaction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const restoreTransaction = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Restore transaction by updating status back to 'active'
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'active' })
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { restoreTransaction, loading, error }
}

export function usePermanentDeleteTransaction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const permanentDeleteTransaction = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Permanent delete - actually remove from database
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { permanentDeleteTransaction, loading, error }
}

export function useUpdateTransaction() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTransaction = async (
    id: string,
    transactionData: Database['public']['Tables']['transactions']['Update'],
    proofFile?: File | null
  ) => {
    try {
      setLoading(true)
      setError(null)

      let updateData = { ...transactionData }

      // If there's a new proof file, upload it
      if (proofFile) {
        const fileExt = proofFile.name.split('.').pop()
        const fileName = `transaction-${id}-${Date.now()}.${fileExt}`
        const proofUrl = await uploadFile(proofFile, 'transaction-proofs', 'proofs', fileName)
        
        if (proofUrl) {
          updateData.proof_url = proofUrl
        }
      }

      const { data, error } = await supabase
        .from('transactions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { updateTransaction, loading, error }
}