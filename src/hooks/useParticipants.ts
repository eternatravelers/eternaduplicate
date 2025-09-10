import { useState, useEffect } from 'react'
import { supabase, uploadProofOfTransfer } from '@/lib/supabase'
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
          sales (
            id,
            name
          )
        `)

      // Apply date filters
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

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
  }, [filters?.startDate, filters?.endDate])

  return { participants, loading, error, refetch: fetchParticipants }
}

export function useCreateParticipant() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createParticipant = async (
    participantData: Database['public']['Tables']['participants']['Insert'],
    proofOfTransferFile?: File | null
  ) => {
    try {
      setLoading(true)
      setError(null)

      // First create the participant record
      const { data: newParticipant, error: participantError } = await supabase
        .from('participants')
        .insert([participantData])
        .select()
        .single()

      if (participantError) throw participantError

      // If there's a proof of transfer file, upload it
      let proofUrl = null
      if (proofOfTransferFile && newParticipant) {
        proofUrl = await uploadProofOfTransfer(proofOfTransferFile, newParticipant.id)
        
        if (proofUrl) {
          // Update the participant record with the proof URL
          const { error: updateError } = await supabase
            .from('participants')
            .update({ proof_of_transfer_url: proofUrl })
            .eq('id', newParticipant.id)

          if (updateError) throw updateError
          
          // Update the returned data
          newParticipant.proof_of_transfer_url = proofUrl
        }
      }

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
    participantData: Database['public']['Tables']['participants']['Update'],
    proofOfTransferFile?: File | null
  ) => {
    try {
      setLoading(true)
      setError(null)

      // If there's a new proof of transfer file, upload it
      let proofUrl = participantData.proof_of_transfer_url
      if (proofOfTransferFile) {
        proofUrl = await uploadProofOfTransfer(proofOfTransferFile, id)
        if (proofUrl) {
          participantData.proof_of_transfer_url = proofUrl
        }
      }

      const { data, error } = await supabase
        .from('participants')
        .update(participantData)
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

  return { updateParticipant, loading, error }
}