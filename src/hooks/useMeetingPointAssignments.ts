import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type MeetingPointAssignment = Database['public']['Tables']['meeting_point_assignments']['Row'] & {
  buses?: Database['public']['Tables']['buses']['Row']
  drivers?: Database['public']['Tables']['drivers']['Row']
}

type MeetingPointAssignmentInsert = Database['public']['Tables']['meeting_point_assignments']['Insert']
type MeetingPointAssignmentUpdate = Database['public']['Tables']['meeting_point_assignments']['Update']

export function useMeetingPointAssignments(tripId: string | null) {
  const [assignments, setAssignments] = useState<MeetingPointAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = async () => {
    if (!tripId) {
      setAssignments([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data: assignmentsData, error: fetchError } = await supabase
        .from('meeting_point_assignments')
        .select('*')
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const { data: busesData } = await supabase
        .from('buses')
        .select('id, bus_number, capacity, status')

      const { data: driversData } = await supabase
        .from('drivers')
        .select('id, name, phone, license_number')

      const enrichedAssignments = assignmentsData?.map(assignment => {
        const bus = assignment.bus_id
          ? busesData?.find(b => b.id === assignment.bus_id)
          : undefined
        const driver = assignment.driver_id
          ? driversData?.find(d => d.id === assignment.driver_id)
          : undefined

        return {
          ...assignment,
          buses: bus,
          drivers: driver
        }
      }) || []

      setAssignments(enrichedAssignments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meeting point assignments')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [tripId])

  return { assignments, loading, error, refetch: fetchAssignments }
}

export function useCreateMeetingPointAssignment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createAssignment = async (assignmentData: MeetingPointAssignmentInsert) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: insertError } = await supabase
        .from('meeting_point_assignments')
        .insert([assignmentData])
        .select()
        .single()

      if (insertError) throw insertError

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create assignment'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { createAssignment, loading, error }
}

export function useUpdateMeetingPointAssignment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateAssignment = async (id: string, assignmentData: MeetingPointAssignmentUpdate) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: updateError } = await supabase
        .from('meeting_point_assignments')
        .update(assignmentData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update assignment'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { updateAssignment, loading, error }
}

export function useDeleteMeetingPointAssignment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteAssignment = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('meeting_point_assignments')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete assignment'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { deleteAssignment, loading, error }
}
