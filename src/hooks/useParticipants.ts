import { useState, useEffect } from 'react'
import { supabase, uploadProofOfTransfer } from '@/lib/supabase'
import { useAuth } from './useAuth'
import type { Database } from '@/lib/supabase'

type Participant = Database['public']['Tables']['participants']['Row'] & {
  trips?: Database['public']['Tables']['trips']['Row'] & {
    destinations?: Database['public']['Tables']['destinations']['Row'][]
  }
  sales?: Database['public']['Tables']['sales']['Row']
  parent_participant?: Participant | null
  group_members?: Participant[]
}

interface ParticipantFilters {
  startDate?: string
  endDate?: string
  tripId?: string
  typeFilter?: 'individual' | 'group_leader' | 'group_member' | 'all'
  searchTerm?: string
  statusFilter?: string
}

export function useParticipants(filters?: ParticipantFilters) {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchParticipants = async () => {
    try {
      setLoading(true)
      
      let query = supabase
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
          trips (
            id,
            name,
            departure_date,
            meeting_point,
            trip_type,
            trip_destinations!left (
              destinations (
                id,
                name
              )
            )
          ),
          sales!participants_sales_id_fkey (
            id,
            name
          )
        `)
        .is('deleted_at', null)

      // Apply type filter
      if (filters?.typeFilter) {
        switch (filters.typeFilter) {
          case 'individual':
            query = query
              .is('parent_participant_id', null)
              .not('additional_requests', 'ilike', '%Group Leader%')
            break
          case 'group_leader':
            query = query
              .is('parent_participant_id', null)
              .ilike('additional_requests', '%Group Leader%')
            break
          case 'group_member':
            query = query.not('parent_participant_id', 'is', null)
            break
          case 'all':
          default:
            // No additional filter for 'all'
            break
        }
      }

      // Apply date filters
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      // Apply trip filter
      if (filters?.tripId) {
        query = query.eq('trip_id', filters.tripId)
      }

      // Apply search filter
      if (filters?.searchTerm) {
        query = query.or(`full_name.ilike.%${filters.searchTerm}%,email.ilike.%${filters.searchTerm}%,phone.ilike.%${filters.searchTerm}%`)
      }

      // Apply status filter
      if (filters?.statusFilter && filters.statusFilter !== 'all') {
        query = query.eq('status', filters.statusFilter)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })

      if (error) throw error

      const participantsWithTrips = data?.map(p => ({
        ...p,
        trips: p.trips ? {
          ...p.trips,
          destinations: p.trips.trip_destinations?.map(td => td.destinations).filter(Boolean) || []
        } : undefined
      })) || []

      setParticipants(participantsWithTrips)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchParticipants()
  }, [filters?.startDate, filters?.endDate, filters?.tripId, filters?.typeFilter, filters?.searchTerm, filters?.statusFilter])

  return { participants, loading, error, refetch: fetchParticipants }
}

export function useCreateParticipant() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createParticipant = async (
    participantData: Database['public']['Tables']['participants']['Insert'],
  ) => {
    try {
      setLoading(true)
      setError(null)

      const { data: newParticipant, error: participantError } = await supabase
        .from('participants')
        .insert([participantData])
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
          trips (
            id,
            name,
            departure_date,
            meeting_point,
            trip_type
          ),
          sales!participants_sales_id_fkey (
            id,
            name
          )
        `)
        .single()

      if (participantError) throw participantError

      return { data: newParticipant, error: null }
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
    participantData: Database['public']['Tables']['participants']['Update']
  ) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('participants')
        .update(participantData)
        .eq('id', id)
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
          trips (
            id,
            name,
            departure_date,
            meeting_point,
            trip_type
          ),
          sales!participants_sales_id_fkey (
            id,
            name
          )
        `)
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
          deletion_reason,
          parent_participant_id,
          parent_participant_id,
          trips (
            id,
            name,
            departure_date,
            meeting_point,
            trip_type
          ),
          sales!participants_sales_id_fkey (
            id,
            name
          )
        `)
        .not('deleted_at', 'is', null)
        .order('deleted_at', { ascending: false })

      if (error) throw error

      setDeletedParticipants(data || [])
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

// Hook to get group members for a specific group leader
export function useGroupMembers(groupLeaderId: string) {
  const [groupMembers, setGroupMembers] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGroupMembers = async () => {
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
          parent_participant_id,
          trips (
            id,
            name,
            departure_date,
            meeting_point,
            trip_type
          ),
          sales!participants_sales_id_fkey (
            id,
            name
          )
        `)
        .eq('parent_participant_id', groupLeaderId)
        .is('deleted_at', null)
        .order('created_at', { ascending: true })

      if (error) throw error

      setGroupMembers(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (groupLeaderId) {
      fetchGroupMembers()
    }
  }, [groupLeaderId])

  return { groupMembers, loading, error, refetch: fetchGroupMembers }
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