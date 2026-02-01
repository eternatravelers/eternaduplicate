import { useState, useEffect, useCallback } from 'react'
import { supabase, uploadProofOfTransfer } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Database } from '@/lib/supabase'

type Participant = Database['public']['Tables']['participants']['Row'] & {
  trips?: Database['public']['Tables']['trips']['Row'] & {
    destinations?: Database['public']['Tables']['destinations']['Row'][]
  }
  sales?: Database['public']['Tables']['sales']['Row']
}

interface ParticipantFilters {
  startDate?: string
  endDate?: string
  tripId?: string
}

export function useParticipants(filters?: ParticipantFilters) {
  const { userRole } = useAuth()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  const fetchParticipants = useCallback(async (): Promise<Participant[]> => {
    try {
      setLoading(true)
      setError(null)

      console.log('[useParticipants] Fetching with user role:', userRole, 'refresh:', refreshCounter)

      let participantsQuery = supabase
        .from('participants')
        .select(`
          id,
          trip_id,
          sales_id,
          full_name,
          email,
          phone,
          address,
          participant_count,
          package_price,
          dp_amount,
          dp_transfer_date,
          status,
          additional_requests,
          created_at,
          updated_at,
          proof_of_transfer_url,
          meeting_point_details,
          parent_participant_id,
          payment_status,
          total_paid,
          remaining_payment,
          deleted_at
        `)
        .is('parent_participant_id', null)
        .is('deleted_at', null)

      if (filters?.startDate) {
        participantsQuery = participantsQuery.gte('created_at', filters.startDate)
      }
      if (filters?.endDate) {
        participantsQuery = participantsQuery.lte('created_at', filters.endDate)
      }
      if (filters?.tripId) {
        participantsQuery = participantsQuery.eq('trip_id', filters.tripId)
      }

      const { data: participantsData, error: participantsError } = await participantsQuery
        .order('created_at', { ascending: false })

      if (participantsError) {
        const errorDetails = `Participants fetch error - Code: ${participantsError.code}, Message: ${participantsError.message}, Status: ${(participantsError as any).status}, Details: ${participantsError.details || 'N/A'}, User Role: ${userRole}`
        console.error('Participants error:', errorDetails)
        throw new Error(errorDetails)
      }

      console.log('[useParticipants] Raw data from DB:', participantsData?.length || 0, 'participants')

      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id, name, departure_date, meeting_point, trip_type')

      if (tripsError) throw tripsError

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, name, email, phone')

      if (salesError) throw salesError

      const participantsWithTripsAndSales = participantsData?.map(participant => {
        const trip = participant.trip_id
          ? tripsData?.find(t => t.id === participant.trip_id)
          : null
        const sales = participant.sales_id
          ? salesData?.find(s => s.id === participant.sales_id)
          : null

        return {
          ...participant,
          trips: trip || undefined,
          sales: sales || undefined
        }
      }) || []

      console.log('[useParticipants] Setting state with', participantsWithTripsAndSales.length, 'participants')
      setParticipants(participantsWithTripsAndSales)
      return participantsWithTripsAndSales
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Error in fetchParticipants:', errorMessage)
      setError(errorMessage)
      return []
    } finally {
      setLoading(false)
    }
  }, [filters?.startDate, filters?.endDate, filters?.tripId, userRole, refreshCounter])

  const refetch = useCallback(async (): Promise<Participant[]> => {
    console.log('[useParticipants] refetch() called, incrementing refresh counter')
    setRefreshCounter(prev => prev + 1)
    return fetchParticipants()
  }, [fetchParticipants])

  useEffect(() => {
    fetchParticipants()
  }, [fetchParticipants])

  return { participants, loading, error, refetch }
}

export function useCreateParticipant() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createParticipant = async (
    participantData: Database['public']['Tables']['participants']['Insert'],
    proofOfTransferFile?: File | null // Keep for backward compatibility but won't be used
  ) => {
    try {
      setLoading(true)
      setError(null)

      console.log('Starting participant creation with data:', participantData)

      // Step 1: Insert participant and get only the ID
      const { data: insertResult, error: participantError } = await supabase
        .from('participants')
        .insert([participantData])
        .select('id')
        .single()

      if (participantError) {
        const errorDetails = `Insert Error - Code: ${participantError.code}, Message: ${participantError.message}, Details: ${participantError.details || 'N/A'}`
        console.error('Participant insert error:', errorDetails)
        console.error('Insert error full object:', participantError)
        throw new Error(errorDetails)
      }

      console.log('Insert successful, participant ID:', insertResult.id)

      // Step 2: Fetch the complete participant data separately
      const { data: newParticipant, error: fetchError } = await supabase
        .from('participants')
        .select(`
          id,
          trip_id,
          sales_id,
          full_name,
          email,
          phone,
          address,
          participant_count,
          package_price,
          dp_amount,
          dp_transfer_date,
          status,
          additional_requests,
          created_at,
          updated_at,
          proof_of_transfer_url,
          meeting_point_details,
          parent_participant_id,
          payment_status,
          total_paid,
          remaining_payment,
          deleted_at
        `)
        .eq('id', insertResult.id)
        .single()

      if (fetchError) {
        const errorDetails = `Fetch participant error - Code: ${fetchError.code}, Message: ${fetchError.message}, Details: ${fetchError.details || 'N/A'}`
        console.error('Participant fetch error:', errorDetails)
        console.error('Fetch error full object:', fetchError)
        throw new Error(errorDetails)
      }

      if (!newParticipant) {
        throw new Error('Participant created but could not be fetched')
      }

      console.log('Participant fetch successful:', newParticipant)

      // Step 2.5: Verify payment_installments record was created by trigger
      if (newParticipant.dp_amount && newParticipant.dp_amount > 0) {
        try {
          const { data: paymentRecords, error: paymentCheckError } = await supabase
            .from('payment_installments')
            .select('id')
            .eq('participant_id', insertResult.id)
            .limit(1)

          if (paymentCheckError) {
            const paymentErrorDetails = `Payment installments check error - Code: ${paymentCheckError.code}, Message: ${paymentCheckError.message}, Details: ${paymentCheckError.details || 'N/A'}`
            console.warn('Payment installments verification warning:', paymentErrorDetails)
          } else if (!paymentRecords || paymentRecords.length === 0) {
            console.warn('Warning: Payment installments record not created automatically for participant', insertResult.id)
          } else {
            console.log('Payment installments created successfully:', paymentRecords.length, 'record(s)')
          }
        } catch (paymentCheckErr) {
          console.warn('Payment installments verification failed:', paymentCheckErr instanceof Error ? paymentCheckErr.message : 'Unknown error')
        }
      }

      // Step 3: Fetch trips data separately
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id, name, departure_date, meeting_point, trip_type')

      if (tripsError) {
        const errorDetails = `Fetch trips error - Code: ${tripsError.code}, Message: ${tripsError.message}`
        console.error('Trips fetch error:', errorDetails)
        throw new Error(errorDetails)
      }

      console.log('Trips data fetched:', tripsData?.length || 0, 'trips')

      // Step 4: Fetch sales data separately
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, name, email, phone')

      if (salesError) {
        const errorDetails = `Fetch sales error - Code: ${salesError.code}, Message: ${salesError.message}`
        console.error('Sales fetch error:', errorDetails)
        throw new Error(errorDetails)
      }

      console.log('Sales data fetched:', salesData?.length || 0, 'sales')

      // Step 5: Manually join participant with trip and sales data
      let tripData = null
      if (newParticipant.trip_id) {
        tripData = tripsData?.find(t => t.id === newParticipant.trip_id) || null
      }

      let participantSalesData = null
      if (newParticipant.sales_id) {
        participantSalesData = salesData?.find(s => s.id === newParticipant.sales_id) || null
      }

      // Step 6: Combine participant with trip and sales data
      const participantWithTripAndSales = {
        ...newParticipant,
        trips: tripData || undefined,
        sales: participantSalesData || undefined
      }

      console.log('Participant creation completed successfully:', participantWithTripAndSales.id)

      return { data: participantWithTripAndSales, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Create participant error:', errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { createParticipant, loading, error }
}

export function useUpdateParticipant() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateParticipant = async (
    id: string, 
    participantData: Database['public']['Tables']['participants']['Update'],
    proofOfTransferFile?: File | null // Keep for backward compatibility but won't be used
  ) => {
    try {
      setLoading(true)
      setError(null)

      // Step 1: Update participant and get only the ID
      const { data: updateResult, error: updateError } = await supabase
        .from('participants')
        .update(participantData)
        .eq('id', id)
        .select('id')
        .single()

      if (updateError) throw updateError

      // Step 2: Fetch the complete participant data separately
      const { data: updatedParticipant, error: fetchError } = await supabase
        .from('participants')
        .select(`
          id,
          trip_id,
          sales_id,
          full_name,
          email,
          phone,
          address,
          participant_count,
          package_price,
          dp_amount,
          dp_transfer_date,
          status,
          additional_requests,
          created_at,
          updated_at,
          proof_of_transfer_url,
          meeting_point_details,
          parent_participant_id,
          payment_status,
          total_paid,
          remaining_payment,
          deleted_at
        `)
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError

      // Step 3: Fetch trips data separately
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id, name, departure_date, meeting_point, trip_type')

      if (tripsError) throw tripsError

      // Step 4: Fetch sales data separately
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, name, email, phone')

      if (salesError) throw salesError

      // Step 5: Manually join participant with trip and sales data
      let tripData = null
      if (updatedParticipant.trip_id) {
        tripData = tripsData?.find(t => t.id === updatedParticipant.trip_id) || null
      }

      let participantSalesData = null
      if (updatedParticipant.sales_id) {
        participantSalesData = salesData?.find(s => s.id === updatedParticipant.sales_id) || null
      }

      // Step 6: Combine participant with trip and sales data
      const participantWithTripAndSales = {
        ...updatedParticipant,
        trips: tripData || undefined,
        sales: participantSalesData || undefined
      }

      return { data: participantWithTripAndSales, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { updateParticipant, loading, error }
}

export function useDeleteParticipant() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const deleteParticipant = async (id: string, permanent: boolean = false) => {
    try {
      setLoading(true)
      setError(null)

      if (permanent) {
        // Permanently delete the participant
        const { error: deleteError } = await supabase
          .from('participants')
          .delete()
          .eq('id', id)

        if (deleteError) throw deleteError
      } else {
        // Update participant with soft delete fields
        const { error: updateError } = await supabase
          .from('participants')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by_user_id: user?.id || null,
            deleted_by_user_name: user?.user_metadata?.full_name || user?.email || 'Unknown User'
          })
          .eq('id', id)

        if (updateError) throw updateError
      }

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { deleteParticipant, loading, error }
}

export function useRestoreParticipant() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const restoreParticipant = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Restore participant by clearing soft delete fields
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          deleted_at: null,
          deleted_by_user_id: null,
          deleted_by_user_name: null
        })
        .eq('id', id)

      if (updateError) throw updateError

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { restoreParticipant, loading, error }
}

export function useDeletedParticipants() {
  const [deletedParticipants, setDeletedParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  const fetchDeletedParticipants = useCallback(async (): Promise<Participant[]> => {
    try {
      setLoading(true)
      setError(null)

      console.log('[useDeletedParticipants] Fetching deleted participants, refresh:', refreshCounter)

      const { data, error } = await supabase
        .from('participants')
        .select(`
          id,
          trip_id,
          sales_id,
          full_name,
          email,
          phone,
          address,
          participant_count,
          package_price,
          dp_amount,
          dp_transfer_date,
          status,
          additional_requests,
          created_at,
          updated_at,
          proof_of_transfer_url,
          meeting_point_details,
          parent_participant_id,
          deleted_at,
          deleted_by_user_name,
          payment_status,
          total_paid,
          remaining_payment
        `)
        .not('deleted_at', 'is', null)
        .is('parent_participant_id', null)
        .order('deleted_at', { ascending: false })

      if (error) throw error

      console.log('[useDeletedParticipants] Raw data from DB:', data?.length || 0, 'deleted participants')

      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id, name, departure_date, meeting_point, trip_type')

      if (tripsError) throw tripsError

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, name, email, phone')

      if (salesError) throw salesError

      const deletedParticipantsWithTripsAndSales = data?.map(participant => {
        const trip = participant.trip_id
          ? tripsData?.find(t => t.id === participant.trip_id)
          : null
        const sales = participant.sales_id
          ? salesData?.find(s => s.id === participant.sales_id)
          : null

        return {
          ...participant,
          trips: trip || undefined,
          sales: sales || undefined
        }
      }) || []

      console.log('[useDeletedParticipants] Setting state with', deletedParticipantsWithTripsAndSales.length, 'participants')
      setDeletedParticipants(deletedParticipantsWithTripsAndSales)
      return deletedParticipantsWithTripsAndSales
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return []
    } finally {
      setLoading(false)
    }
  }, [refreshCounter])

  const refetch = useCallback(async (): Promise<Participant[]> => {
    console.log('[useDeletedParticipants] refetch() called')
    setRefreshCounter(prev => prev + 1)
    return fetchDeletedParticipants()
  }, [fetchDeletedParticipants])

  useEffect(() => {
    fetchDeletedParticipants()
  }, [fetchDeletedParticipants])

  return { deletedParticipants, loading, error, refetch }
}

export function useAllParticipants() {
  const [allParticipants, setAllParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshCounter, setRefreshCounter] = useState(0)

  const fetchAllParticipants = useCallback(async (): Promise<Participant[]> => {
    try {
      setLoading(true)
      setError(null)

      console.log('[useAllParticipants] Fetching all participants, refresh:', refreshCounter)

      const { data, error } = await supabase
        .from('participants')
        .select(`
          id,
          trip_id,
          sales_id,
          full_name,
          email,
          phone,
          address,
          participant_count,
          package_price,
          dp_amount,
          dp_transfer_date,
          status,
          additional_requests,
          created_at,
          updated_at,
          proof_of_transfer_url,
          meeting_point_details,
          parent_participant_id,
          payment_status,
          total_paid,
          remaining_payment,
          deleted_at
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log('[useAllParticipants] Raw data from DB:', data?.length || 0, 'participants')

      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id, name, departure_date, meeting_point, trip_type')

      if (tripsError) throw tripsError

      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, name, email, phone')

      if (salesError) throw salesError

      const participantsWithTripsAndSales = data?.map(participant => {
        const trip = participant.trip_id
          ? tripsData?.find(t => t.id === participant.trip_id)
          : null
        const sales = participant.sales_id
          ? salesData?.find(s => s.id === participant.sales_id)
          : null

        return {
          ...participant,
          trips: trip || undefined,
          sales: sales || undefined
        }
      }) || []

      console.log('[useAllParticipants] Setting state with', participantsWithTripsAndSales.length, 'participants')
      setAllParticipants(participantsWithTripsAndSales)
      return participantsWithTripsAndSales
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return []
    } finally {
      setLoading(false)
    }
  }, [refreshCounter])

  const refetch = useCallback(async (): Promise<Participant[]> => {
    console.log('[useAllParticipants] refetch() called')
    setRefreshCounter(prev => prev + 1)
    return fetchAllParticipants()
  }, [fetchAllParticipants])

  useEffect(() => {
    fetchAllParticipants()
  }, [fetchAllParticipants])

  return { allParticipants, loading, error, refetch }
}