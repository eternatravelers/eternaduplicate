import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type MeetingPoint = Database['public']['Tables']['meeting_points']['Row']
type MeetingPointInsert = Database['public']['Tables']['meeting_points']['Insert']
type MeetingPointUpdate = Database['public']['Tables']['meeting_points']['Update']

export function useMeetingPoints() {
  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMeetingPoints = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('meeting_points')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })

      if (fetchError) throw fetchError

      setMeetingPoints(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch meeting points'
      setError(errorMessage)
      console.error('Error fetching meeting points:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetingPoints()
  }, [])

  return { meetingPoints, loading, error, refetch: fetchMeetingPoints }
}

export function useCreateMeetingPoint() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createMeetingPoint = async (data: MeetingPointInsert) => {
    try {
      setLoading(true)
      setError(null)

      // Check if meeting point with same name already exists
      const { data: existingPoint, error: checkError } = await supabase
        .from('meeting_points')
        .select('id')
        .eq('name', data.name)
        .maybeSingle()

      if (checkError) throw new Error(`Failed to check existing meeting point: ${checkError.message}`)
      if (existingPoint) throw new Error('Meeting point dengan nama ini sudah ada. Silakan gunakan nama yang berbeda.')

      const { data: newPoint, error: insertError } = await supabase
        .from('meeting_points')
        .insert([data])
        .select()
        .maybeSingle()

      if (insertError) throw insertError
      if (!newPoint) throw new Error('Failed to create meeting point')

      return { data: newPoint, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create meeting point'
      setError(errorMessage)
      console.error('Error creating meeting point:', err)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { createMeetingPoint, loading, error }
}

export function useUpdateMeetingPoint() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateMeetingPoint = async (id: string, data: MeetingPointUpdate) => {
    try {
      setLoading(true)
      setError(null)

      // If name is being updated, check for duplicates
      if (data.name) {
        const { data: existingPoint, error: checkError } = await supabase
          .from('meeting_points')
          .select('id')
          .eq('name', data.name)
          .neq('id', id)
          .maybeSingle()

        if (checkError) throw new Error(`Failed to check existing meeting point: ${checkError.message}`)
        if (existingPoint) throw new Error('Meeting point dengan nama ini sudah ada. Silakan gunakan nama yang berbeda.')
      }

      const { data: updatedPoint, error: updateError } = await supabase
        .from('meeting_points')
        .update(data)
        .eq('id', id)
        .select()
        .maybeSingle()

      if (updateError) throw updateError
      if (!updatedPoint) throw new Error('Meeting point not found')

      return { data: updatedPoint, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update meeting point'
      setError(errorMessage)
      console.error('Error updating meeting point:', err)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { updateMeetingPoint, loading, error }
}

export function useDeleteMeetingPoint() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteMeetingPoint = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Instead of hard delete, soft delete by setting is_active to false
      const { error: updateError } = await supabase
        .from('meeting_points')
        .update({ is_active: false })
        .eq('id', id)

      if (updateError) throw updateError

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete meeting point'
      setError(errorMessage)
      console.error('Error deleting meeting point:', err)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { deleteMeetingPoint, loading, error }
}

export function useMeetingPointsForTrip(tripId: string | null) {
  const [meetingPoints, setMeetingPoints] = useState<MeetingPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMeetingPointsForTrip = async () => {
    if (!tripId) {
      setMeetingPoints([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('trip_meeting_points')
        .select(`
          meeting_point_id,
          is_primary,
          meeting_points(id, name, description, address, display_order)
        `)
        .eq('trip_id', tripId)
        .order('is_primary', { ascending: false })

      if (fetchError) throw fetchError

      const meetingPointsList = (data || [])
        .map(item => (item.meeting_points as any))
        .filter((mp) => mp !== null)

      setMeetingPoints(meetingPointsList)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch meeting points for trip'
      setError(errorMessage)
      console.error('Error fetching meeting points for trip:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetingPointsForTrip()
  }, [tripId])

  return { meetingPoints, loading, error, refetch: fetchMeetingPointsForTrip }
}

export function useAssignMeetingPointToTrip() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assignMeetingPoint = async (tripId: string, meetingPointId: string, isPrimary = false) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: insertError } = await supabase
        .from('trip_meeting_points')
        .insert([{
          trip_id: tripId,
          meeting_point_id: meetingPointId,
          is_primary: isPrimary
        }])
        .select()
        .maybeSingle()

      if (insertError) {
        if (insertError.message?.includes('duplicate')) {
          throw new Error('Meeting point sudah di-assign ke trip ini')
        }
        throw insertError
      }

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign meeting point to trip'
      setError(errorMessage)
      console.error('Error assigning meeting point to trip:', err)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { assignMeetingPoint, loading, error }
}

export function useRemoveMeetingPointFromTrip() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const removeMeetingPoint = async (tripId: string, meetingPointId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('trip_meeting_points')
        .delete()
        .eq('trip_id', tripId)
        .eq('meeting_point_id', meetingPointId)

      if (deleteError) throw deleteError

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove meeting point from trip'
      setError(errorMessage)
      console.error('Error removing meeting point from trip:', err)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { removeMeetingPoint, loading, error }
}
