import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type BusRow = Database['public']['Tables']['buses']['Row']
type DriverRow = Database['public']['Tables']['drivers']['Row']
type MeetingPointAssignmentRow = Database['public']['Tables']['meeting_point_assignments']['Row']

type MeetingPointAssignment = MeetingPointAssignmentRow & {
  buses: BusRow | null
  drivers: DriverRow | null
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
        .select(`
          *,
          meeting_point_buses(
            buses(id, bus_number, plate_number, type, capacity, status)
          ),
          meeting_point_drivers(
            drivers(id, name, phone, license_number, license_type, status)
          )
        `)
        .eq('trip_id', tripId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      const enrichedAssignments = (assignmentsData || []).map((assignment: any) => {
        // Extract first bus and driver from the junction tables
        const buses = assignment.meeting_point_buses?.[0]?.buses || null
        const drivers = assignment.meeting_point_drivers?.[0]?.drivers || null

        return {
          ...assignment,
          buses,
          drivers
        }
      })

      setAssignments(enrichedAssignments)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch meeting point assignments'
      setError(errorMessage)
      console.error('Error fetching meeting point assignments:', err)
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
        .maybeSingle()

      if (insertError) throw insertError

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create assignment'
      setError(errorMessage)
      console.error('Error creating meeting point assignment:', err)
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
        .maybeSingle()

      if (updateError) throw updateError

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update assignment'
      setError(errorMessage)
      console.error('Error updating meeting point assignment:', err)
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
      console.error('Error deleting meeting point assignment:', err)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { deleteAssignment, loading, error }
}
