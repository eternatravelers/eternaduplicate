import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface MeetingPointSummary {
  meeting_point_name: string
  participant_count: number
  registration_count: number
  has_pickup_schedule: boolean
  has_transportation_assigned: boolean
}

export function useMeetingPointSummary(tripId: string | null) {
  const [summary, setSummary] = useState<MeetingPointSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSummary = async () => {
    if (!tripId) {
      setSummary([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: rpcError } = await supabase
        .rpc('get_meeting_point_summary', { p_trip_id: tripId })

      if (rpcError) throw rpcError

      setSummary(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch meeting point summary')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [tripId])

  return { summary, loading, error, refetch: fetchSummary }
}
