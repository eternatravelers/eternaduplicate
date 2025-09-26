import { useState, useEffect } from 'react'
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
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchParticipants = async () => {
    try {
      setLoading(true)
      
      // Fetch participants without trips join
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
          meeting_point_details
        `)

      // Apply date filters
      if (filters?.startDate) {
        participantsQuery = participantsQuery.gte('created_at', filters.startDate)
      }
      if (filters?.endDate) {
        participantsQuery = participantsQuery.lte('created_at', filters.endDate)
      }

      // Apply trip filter
      if (filters?.tripId) {
        participantsQuery = participantsQuery.eq('trip_id', filters.tripId)
      }

      const { data: participantsData, error: participantsError } = await participantsQuery.order('created_at', { ascending: false })

      if (participantsError) throw participantsError

      // Fetch trips data separately
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id, name, departure_date, meeting_point, trip_type')

      if (tripsError) throw tripsError

      // Fetch sales data separately
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, name, email, phone')

      if (salesError) throw salesError

      // Manually join participants with trips
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

      setParticipants(participantsWithTripsAndSales)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParticipants()
  }, [filters?.startDate, filters?.endDate, filters?.tripId])

  return { participants, loading, error, refetch: fetchParticipants }
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

      // Step 1: Insert participant and get only the ID
      const { data: insertResult, error: participantError } = await supabase
        .from('participants')
        .insert([participantData])
        .select('id')
        .single()

      if (participantError) throw participantError

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
          meeting_point_details
        `)
        .eq('id', insertResult.id)
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

      return { data: participantWithTripAndSales, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
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
          meeting_point_details
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

  const deleteParticipant = async (
    id: string,
    reason?: string,
    permanent: boolean = false
  ) => {
    try {
      setLoading(true)
      setError(null)

      if (permanent) {
        // Hard delete - permanently remove from database
        // First get participant data for audit log
        const { data: participantData, error: fetchError } = await supabase
          .from('participants')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

        // Log the permanent deletion
        if (participantData && !fetchError) {
          const { error: logError } = await supabase.rpc('log_participant_action', {
            p_participant_id: id,
            p_action: 'permanently_deleted',
            p_performed_by_user_id: user?.id || null,
            p_performed_by_user_name: user?.user_metadata?.full_name || user?.email || 'Unknown User',
            p_reason: reason || null,
            p_participant_data: participantData
          })

          if (logError) console.warn('Failed to log permanent deletion:', logError)
        }

        // Permanently delete the participant
        const { error: deleteError } = await supabase
          .from('participants')
          .delete()
          .eq('id', id)

        if (deleteError) throw deleteError
      } else {
        // Soft delete - mark as deleted
        // First get participant data for audit log
        const { data: participantData, error: fetchError } = await supabase
          .from('participants')
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

        // Update participant with soft delete fields
        const { error: updateError } = await supabase
          .from('participants')
          .update({
            deleted_at: new Date().toISOString(),
            deleted_by_user_id: user?.id || null,
            deleted_by_user_name: user?.user_metadata?.full_name || user?.email || 'Unknown User',
            deletion_reason: reason || null
          })
          .eq('id', id)

        if (updateError) throw updateError

        // Log the soft deletion
        if (participantData && !fetchError) {
          const { error: logError } = await supabase.rpc('log_participant_action', {
            p_participant_id: id,
            p_action: 'deleted',
            p_performed_by_user_id: user?.id || null,
            p_performed_by_user_name: user?.user_metadata?.full_name || user?.email || 'Unknown User',
            p_reason: reason || null,
            p_participant_data: participantData
          })

          if (logError) console.warn('Failed to log deletion:', logError)
        }
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
  const { user } = useAuth()

  const restoreParticipant = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Get participant data for audit log
      const { data: participantData, error: fetchError } = await supabase
        .from('participants')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

      // Restore participant by clearing soft delete fields
      const { error: updateError } = await supabase
        .from('participants')
        .update({
          deleted_at: null,
          deleted_by_user_id: null,
          deleted_by_user_name: null,
          deletion_reason: null
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Log the restoration
      if (participantData && !fetchError) {
        const { error: logError } = await supabase.rpc('log_participant_action', {
          p_participant_id: id,
          p_action: 'restored',
          p_performed_by_user_id: user?.id || null,
          p_performed_by_user_name: user?.user_metadata?.full_name || user?.email || 'Unknown User',
          p_reason: 'Participant restored from deletion',
          p_participant_data: participantData
        })

        if (logError) console.warn('Failed to log restoration:', logError)
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

  return { restoreParticipant, loading, error }
}

// Hook to get deleted participants (for trash/recovery functionality)
export function useDeletedParticipants() {
  const [deletedParticipants, setDeletedParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDeletedParticipants = async () => {
    try {
      setLoading(true)
      
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
          deleted_at,
          deleted_by_user_name,
          deletion_reason
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

      if (error) throw error

      // Fetch trips data separately
      const { data: tripsData, error: tripsError } = await supabase
        .from('trips')
        .select('id, name, departure_date, meeting_point, trip_type')

      if (tripsError) throw tripsError

      // Fetch sales data separately
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('id, name, email, phone')

      if (salesError) throw salesError

      // Manually join deleted participants with trips
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

      setDeletedParticipants(deletedParticipantsWithTripsAndSales)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeletedParticipants()
  }, [])

  return { deletedParticipants, loading, error, refetch: fetchDeletedParticipants }
}

// Hook to get participant audit log
export function useParticipantAuditLog(participantId?: string) {
  const [auditLog, setAuditLog] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAuditLog = async () => {
    try {
      setLoading(true)
      
      let query = supabase
        .from('participant_audit_log')
        .select('*')
        .order('created_at', { ascending: false })

      if (participantId) {
        query = query.eq('participant_id', participantId)
      }

      const { data, error } = await query

      if (error) throw error

      setAuditLog(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLog()
  }, [participantId])

  return { auditLog, loading, error, refetch: fetchAuditLog }
}