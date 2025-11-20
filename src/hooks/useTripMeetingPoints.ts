import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type TripMeetingPoint = {
  trip_id: string
  meeting_point_id: string
  is_primary: boolean
}

export function useTripMeetingPoints(tripId: string | null) {
  const [tripMeetingPoints, setTripMeetingPoints] = useState<TripMeetingPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTripMeetingPoints = async () => {
    if (!tripId) {
      setTripMeetingPoints([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('trip_meeting_points')
        .select('*')
        .eq('trip_id', tripId)

      if (fetchError) throw fetchError

      setTripMeetingPoints(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trip meeting points'
      setError(errorMessage)
      console.error('Error fetching trip meeting points:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTripMeetingPoints()
  }, [tripId])

  return { tripMeetingPoints, loading, error, refetch: fetchTripMeetingPoints }
}

export function useUpdateTripMeetingPoints() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTripMeetingPoints = async (
    tripId: string,
    meetingPointIds: string[],
    primaryMeetingPointId?: string
  ) => {
    try {
      setLoading(true)
      setError(null)

      await supabase
        .from('trip_meeting_points')
        .delete()
        .eq('trip_id', tripId)

      if (meetingPointIds.length > 0) {
        const tripMeetingPoints = meetingPointIds.map(mpId => ({
          trip_id: tripId,
          meeting_point_id: mpId,
          is_primary: mpId === primaryMeetingPointId
        }))

        const { error: insertError } = await supabase
          .from('trip_meeting_points')
          .insert(tripMeetingPoints)

        if (insertError) throw insertError
      }

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update trip meeting points'
      setError(errorMessage)
      console.error('Error updating trip meeting points:', err)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { updateTripMeetingPoints, loading, error }
}
