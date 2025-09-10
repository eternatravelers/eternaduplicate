import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type TourLeader = Database['public']['Tables']['tour_leaders']['Row']

export function useTourLeaders() {
  const [tourLeaders, setTourLeaders] = useState<TourLeader[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTourLeaders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tour_leaders')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      setTourLeaders(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTourLeaders()
  }, [])

  return { tourLeaders, loading, error, refetch: fetchTourLeaders }
}

export function useCreateTourLeader() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTourLeader = async (tourLeaderData: Database['public']['Tables']['tour_leaders']['Insert']) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('tour_leaders')
        .insert([tourLeaderData])
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

  return { createTourLeader, loading, error }
}

export function useUpdateTourLeader() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTourLeader = async (id: string, tourLeaderData: Database['public']['Tables']['tour_leaders']['Update']) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('tour_leaders')
        .update(tourLeaderData)
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

  return { updateTourLeader, loading, error }
}

export function useDeleteTourLeader() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteTourLeader = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('tour_leaders')
        .delete()
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { deleteTourLeader, loading, error }
}

// Hook for tour leader performance analytics
export function useTourLeaderPerformance() {
  const [performance, setPerformance] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPerformance = async () => {
    try {
      setLoading(true)
      
      // Get tour leaders with their trip counts and participant counts
      const { data: tourLeaders, error: tlError } = await supabase
        .from('tour_leaders')
        .select(`
          *,
          trips!left (
            id,
            name,
            departure_date,
            status,
            participants!left (
              id,
              participant_count
            )
          )
        `)

      if (tlError) throw tlError

      const performanceData = tourLeaders?.map(tl => {
        const activeTrips = tl.trips?.filter(t => t.status === 'active') || []
        const completedTrips = tl.trips?.filter(t => t.status === 'completed') || []
        const totalParticipants = tl.trips?.reduce((sum, trip) => {
          return sum + (trip.participants?.reduce((pSum, p) => pSum + p.participant_count, 0) || 0)
        }, 0) || 0

        const upcomingTrips = activeTrips.filter(t => 
          new Date(t.departure_date) >= new Date()
        ).length

        return {
          ...tl,
          totalTrips: tl.trips?.length || 0,
          activeTrips: activeTrips.length,
          completedTrips: completedTrips.length,
          upcomingTrips,
          totalParticipants,
          avgParticipantsPerTrip: tl.trips?.length ? totalParticipants / tl.trips.length : 0,
          lastTripDate: tl.trips?.length ? 
            Math.max(...tl.trips.map(t => new Date(t.departure_date).getTime())) : null
        }
      }) || []

      setPerformance(performanceData.sort((a, b) => b.totalTrips - a.totalTrips))
    } catch (err) {
      console.error('Error fetching tour leader performance:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPerformance()
  }, [])

  return { performance, loading, refetch: fetchPerformance }
}