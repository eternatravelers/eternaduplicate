import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

export interface PaymentInstallment {
  id: string
  participant_id: string
  payment_date: string
  amount: number
  payment_method: string
  proof_of_transfer_url?: string
  notes?: string
  payment_type: 'dp' | 'installment'
  status: 'verified' | 'pending' | 'rejected'
  created_by?: string
  created_at: string
  updated_at: string
}

export function usePaymentInstallments(participantId?: string) {
  const [installments, setInstallments] = useState<PaymentInstallment[]>([])
  const [loading, setLoading] = useState(true)

  const fetchInstallments = useCallback(async () => {
    if (!participantId) {
      setInstallments([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('payment_installments')
        .select('*')
        .eq('participant_id', participantId)
        .order('payment_date', { ascending: false })

      if (error) throw error
      setInstallments(data || [])
    } catch (error) {
      console.error('Error fetching payment installments:', error)
      setInstallments([])
    } finally {
      setLoading(false)
    }
  }, [participantId])

  useEffect(() => {
    fetchInstallments()
  }, [fetchInstallments])

  return { installments, loading, refetch: fetchInstallments }
}

export function useCreatePaymentInstallment() {
  const [loading, setLoading] = useState(false)

  const createInstallment = async (data: Partial<PaymentInstallment>) => {
    try {
      setLoading(true)

      const { data: userData } = await supabase.auth.getUser()

      const installmentData = {
        ...data,
        created_by: userData?.user?.id
      }

      const { error } = await supabase
        .from('payment_installments')
        .insert([installmentData])

      if (error) throw error

      return { error: null }
    } catch (error: any) {
      console.error('Error creating payment installment:', error)
      return { error: error.message }
    } finally {
      setLoading(false)
    }
  }

  return { createInstallment, loading }
}

export function useUpdatePaymentInstallment() {
  const [loading, setLoading] = useState(false)

  const updateInstallment = async (id: string, data: Partial<PaymentInstallment>) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('payment_installments')
        .update(data)
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (error: any) {
      console.error('Error updating payment installment:', error)
      return { error: error.message }
    } finally {
      setLoading(false)
    }
  }

  return { updateInstallment, loading }
}

export function useDeletePaymentInstallment() {
  const [loading, setLoading] = useState(false)

  const deleteInstallment = async (id: string) => {
    try {
      setLoading(true)

      const { error } = await supabase
        .from('payment_installments')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (error: any) {
      console.error('Error deleting payment installment:', error)
      return { error: error.message }
    } finally {
      setLoading(false)
    }
  }

  return { deleteInstallment, loading }
}

export function usePaymentSummary(participantId?: string) {
  const [summary, setSummary] = useState({
    totalPaid: 0,
    remainingPayment: 0,
    packagePrice: 0,
    paymentStatus: 'belum_bayar',
    paymentPercentage: 0,
    installmentCount: 0
  })
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    if (!participantId) {
      setSummary({
        totalPaid: 0,
        remainingPayment: 0,
        packagePrice: 0,
        paymentStatus: 'belum_bayar',
        paymentPercentage: 0,
        installmentCount: 0
      })
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const { data: participant, error: participantError } = await supabase
        .from('participants')
        .select('package_price, total_paid, remaining_payment, payment_status')
        .eq('id', participantId)
        .single()

      if (participantError) throw participantError

      const { data: installments, error: installmentsError } = await supabase
        .from('payment_installments')
        .select('id')
        .eq('participant_id', participantId)
        .eq('status', 'verified')

      if (installmentsError) throw installmentsError

      const totalPaid = participant?.total_paid || 0
      const packagePrice = participant?.package_price || 0
      const paymentPercentage = packagePrice > 0 ? (totalPaid / packagePrice) * 100 : 0

      setSummary({
        totalPaid,
        remainingPayment: participant?.remaining_payment || 0,
        packagePrice,
        paymentStatus: participant?.payment_status || 'belum_bayar',
        paymentPercentage: Math.min(paymentPercentage, 100),
        installmentCount: installments?.length || 0
      })
    } catch (error) {
      console.error('Error fetching payment summary:', error)
    } finally {
      setLoading(false)
    }
  }, [participantId])

  useEffect(() => {
    fetchSummary()
  }, [fetchSummary])

  return { summary, loading, refetch: fetchSummary }
}
