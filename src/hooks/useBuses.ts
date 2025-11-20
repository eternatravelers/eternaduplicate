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

      // Process data to include assigned trips from resource_schedules
      const busesWithAssignments = data?.map(bus => {
        const uniqueTrips = new Map()
        bus.resource_schedules?.forEach((rs: any) => {
          if (rs.trips && ['scheduled', 'confirmed', 'in_progress'].includes(rs.trips.status)) {
            uniqueTrips.set(rs.trips.id, rs.trips)
          }
        })
        return {
          ...bus,
          assignedTrips: Array.from(uniqueTrips.values())
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