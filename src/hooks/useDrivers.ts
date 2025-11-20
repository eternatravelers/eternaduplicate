import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Driver = Database['public']['Tables']['drivers']['Row']

type DriverWithAssignments = Driver & {
  assignedTrips?: Array<{
    id: string
    name: string
    departure_date: string
    status: string
  }>
}

export function useDrivers() {
  const [drivers, setDrivers] = useState<DriverWithAssignments[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDrivers = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          resource_schedules!resource_schedules_driver_id_fkey (
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
      const driversWithAssignments = data?.map(driver => {
        const uniqueTrips = new Map()
        driver.resource_schedules?.forEach((rs: any) => {
          if (rs.trips && ['scheduled', 'confirmed', 'in_progress'].includes(rs.trips.status)) {
            uniqueTrips.set(rs.trips.id, rs.trips)
          }
        })
        return {
          ...driver,
          assignedTrips: Array.from(uniqueTrips.values())
        }
      }) || []

      setDrivers(driversWithAssignments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDrivers()
  }, [])

  return { drivers, loading, error, refetch: fetchDrivers }
}

export function useCreateDriver() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createDriver = async (driverData: Database['public']['Tables']['drivers']['Insert']) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('drivers')
        .insert([driverData])
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

  return { createDriver, loading, error }
}

export function useUpdateDriver() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateDriver = async (id: string, driverData: Database['public']['Tables']['drivers']['Update']) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('drivers')
        .update(driverData)
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

  return { updateDriver, loading, error }
}

export function useDeleteDriver() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteDriver = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('drivers')
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

  return { deleteDriver, loading, error }
}