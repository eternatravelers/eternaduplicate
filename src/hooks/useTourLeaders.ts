import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type TourLeader = Database['public']['Tables']['tour_leaders']['Row']

type TourLeaderWithAssignments = TourLeader & {
  assignedTrips?: Array<{
    id: string
    name: string
    departure_date: string
    status: string
  }>
}

export function useTourLeaders() {
  const [tourLeaders, setTourLeaders] = useState<TourLeaderWithAssignments[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTourLeaders = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tour_leaders')
        .select(`
          *,
          resource_schedules!resource_schedules_tour_leader_id_fkey (
            trips (
              id,
              name,
              departure_date,
              status
            )
          )
        `)
        .order('name', { ascending: true })

      if (error) throw error

      // Process data to include assigned trips from resource_schedules
      const tourLeadersWithAssignments = data?.map(tl => {
        const uniqueTrips = new Map()
        tl.resource_schedules?.forEach((rs: any) => {
          if (rs.trips && ['scheduled', 'confirmed', 'in_progress'].includes(rs.trips.status)) {
            uniqueTrips.set(rs.trips.id, rs.trips)
          }
        })
        return {
          ...tl,
          assignedTrips: Array.from(uniqueTrips.values())
        }
      }) || []

      setTourLeaders(tourLeadersWithAssignments)
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

      // Get tour leaders with their trips through resource_schedules
      const { data: tourLeaders, error: tlError } = await supabase
        .from('tour_leaders')
        .select(`
          *,
          resource_schedules!resource_schedules_tour_leader_id_fkey (
            trips (
              id,
              name,
              departure_date,
              status,
              participants!left (
                id,
                participant_count
              )
            )
          )
        `)

      if (tlError) throw tlError

      const performanceData = tourLeaders?.map(tl => {
        // Extract unique trips from resource_schedules
        const uniqueTrips = new Map()
        tl.resource_schedules?.forEach((rs: any) => {
          if (rs.trips && ['scheduled', 'confirmed', 'in_progress'].includes(rs.trips.status)) {
            uniqueTrips.set(rs.trips.id, rs.trips)
          }
        })
        const trips = Array.from(uniqueTrips.values())
        
        const activeTrips = trips.filter(t => t.status === 'active')
        const completedTrips = trips.filter(t => t.status === 'completed')
        const totalParticipants = trips.reduce((sum, trip) => {
          return sum + (trip.participants?.reduce((pSum, p) => pSum + p.participant_count, 0) || 0)
        }, 0) || 0

        const upcomingTrips = activeTrips.filter(t => 
          new Date(t.departure_date) >= new Date()
        ).length

        return {
          ...tl,
          totalTrips: trips.length,
          activeTrips: activeTrips.length,
          completedTrips: completedTrips.length,
          upcomingTrips,
          totalParticipants,
          avgParticipantsPerTrip: trips.length ? totalParticipants / trips.length : 0,
          lastTripDate: trips.length ? 
            Math.max(...trips.map(t => new Date(t.departure_date).getTime())) : null
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