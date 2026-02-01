import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Bus = Database['public']['Tables']['buses']['Row']

type BusWithAssignments = Bus & {
  assignedTrips?: Array<{
    id: string
    name: string
    departure_date: string
    status: string
  }>
}

export function useBuses() {
  const [buses, setBuses] = useState<BusWithAssignments[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBuses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('buses')
        .select(`
          *,
          resource_schedules!resource_schedules_bus_id_fkey (
            meeting_point_name,
            trips (
              id,
              name,
              departure_date,
              status
            )
          )
        `)
        .order('bus_number', { ascending: true })

      if (error) throw error

      // Process data to include assigned trips with meeting points from resource_schedules
      const busesWithAssignments = data?.map(bus => {
        const tripMap = new Map()
        bus.resource_schedules?.forEach((rs: any) => {
          // Include trips that are not deleted or cancelled
          if (rs.trips && !['deleted', 'cancelled'].includes(rs.trips.status)) {
            const existingTrip = tripMap.get(rs.trips.id)
            if (existingTrip) {
              // If trip already exists, append meeting point to array
              if (rs.meeting_point_name && !existingTrip.meeting_points.includes(rs.meeting_point_name)) {
                existingTrip.meeting_points.push(rs.meeting_point_name)
              }
            } else {
              // Add new trip with meeting point
              tripMap.set(rs.trips.id, {
                ...rs.trips,
                meeting_points: rs.meeting_point_name ? [rs.meeting_point_name] : []
              })
            }
          }
        })
        // Sort trips by departure_date descending (newest first)
        const sortedTrips = Array.from(tripMap.values()).sort((a, b) =>
          new Date(b.departure_date).getTime() - new Date(a.departure_date).getTime()
        )
        return {
          ...bus,
          assignedTrips: sortedTrips
        }
      }) || []

      setBuses(busesWithAssignments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBuses()
  }, [])

  return { buses, loading, error, refetch: fetchBuses }
}

export function useCreateBus() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createBus = async (busData: Database['public']['Tables']['buses']['Insert']) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('buses')
        .insert([busData])
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

  return { createBus, loading, error }
}

export function useUpdateBus() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateBus = async (id: string, busData: Database['public']['Tables']['buses']['Update']) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('buses')
        .update(busData)
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

  return { updateBus, loading, error }
}

export function useDeleteBus() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteBus = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('buses')
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

  return { deleteBus, loading, error }
}