import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface BusPassengerAssignment {
  id: string
  resource_schedule_id: string
  participant_id: string
  seat_number: string | null
  boarding_stop_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
  participants?: {
    id: string
    full_name: string
    phone: string
    meeting_point_details: string | null
    participant_count: number
  }
  bus_route_stops?: {
    id: string
    meeting_point_name: string
    stop_order: number
    arrival_time: string
  }
}

export function useBusPassengerAssignments(resourceScheduleId: string | null) {
  const [assignments, setAssignments] = useState<BusPassengerAssignment[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = async () => {
    if (!resourceScheduleId) {
      setAssignments([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('bus_passenger_assignments')
        .select('*')
        .eq('resource_schedule_id', resourceScheduleId)
        .order('seat_number', { ascending: true })

      if (fetchError) throw fetchError

      if (!data || data.length === 0) {
        setAssignments([])
        return
      }

      const participantIds = data.map(a => a.participant_id)
      const stopIds = data.filter(a => a.boarding_stop_id).map(a => a.boarding_stop_id!)

      const { data: participants } = await supabase
        .from('participants')
        .select('id, full_name, phone, meeting_point_details, participant_count')
        .in('id', participantIds)

      const stopsData = stopIds.length > 0
        ? (await supabase
            .from('bus_route_stops')
            .select('id, meeting_point_name, stop_order, arrival_time')
            .in('id', stopIds)).data
        : []

      const enriched = data.map(a => ({
        ...a,
        participants: participants?.find(p => p.id === a.participant_id),
        bus_route_stops: stopsData?.find(s => s.id === a.boarding_stop_id)
      }))

      setAssignments(enriched)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data penumpang'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssignments()
  }, [resourceScheduleId])

  return { assignments, loading, error, refetch: fetchAssignments }
}

export function useCreateBusPassengerAssignment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createAssignment = async (assignmentData: {
    resource_schedule_id: string
    participant_id: string
    seat_number?: string | null
    boarding_stop_id?: string | null
    notes?: string | null
  }) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: createError } = await supabase
        .from('bus_passenger_assignments')
        .insert([assignmentData])
        .select()
        .single()

      if (createError) throw createError

      return { data, error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal assign penumpang'
      setError(msg)
      return { data: null, error: msg }
    } finally {
      setLoading(false)
    }
  }

  return { createAssignment, loading, error }
}

export function useUpdateBusPassengerAssignment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateAssignment = async (id: string, data: {
    seat_number?: string | null
    boarding_stop_id?: string | null
    notes?: string | null
  }) => {
    try {
      setLoading(true)
      setError(null)

      const { data: updated, error: updateError } = await supabase
        .from('bus_passenger_assignments')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      return { data: updated, error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal update assignment'
      setError(msg)
      return { data: null, error: msg }
    } finally {
      setLoading(false)
    }
  }

  return { updateAssignment, loading, error }
}

export function useDeleteBusPassengerAssignment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteAssignment = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('bus_passenger_assignments')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      return { error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus assignment'
      setError(msg)
      return { error: msg }
    } finally {
      setLoading(false)
    }
  }

  return { deleteAssignment, loading, error }
}

export function useBulkSavePassengerAssignments() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bulkSave = async (
    resourceScheduleId: string,
    assignments: Array<{
      participant_id: string
      seat_number?: string | null
      boarding_stop_id?: string | null
      notes?: string | null
    }>
  ) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('bus_passenger_assignments')
        .delete()
        .eq('resource_schedule_id', resourceScheduleId)

      if (deleteError) throw deleteError

      if (assignments.length > 0) {
        const { error: insertError } = await supabase
          .from('bus_passenger_assignments')
          .insert(assignments.map(a => ({ ...a, resource_schedule_id: resourceScheduleId })))

        if (insertError) throw insertError
      }

      return { error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan assignments'
      setError(msg)
      return { error: msg }
    } finally {
      setLoading(false)
    }
  }

  return { bulkSave, loading, error }
}
