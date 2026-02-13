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
          // Include trips that are not deleted or cancelled
          if (rs.trips && !['deleted', 'cancelled'].includes(rs.trips.status)) {
            uniqueTrips.set(rs.trips.id, rs.trips)
          }
        })
        // Sort trips by departure_date descending (newest first)
        const sortedTrips = Array.from(uniqueTrips.values()).sort((a, b) =>
          new Date(b.departure_date).getTime() - new Date(a.departure_date).getTime()
        )
        return {
          ...driver,
          assignedTrips: sortedTrips
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
    } catch (err: any) {
      let errorMessage = 'Gagal menambah driver'
      if (err?.message) errorMessage = err.message
      else if (err?.error_description) errorMessage = err.error_description
      else if (err?.details) errorMessage = err.details
      else if (err?.hint) errorMessage = err.hint
      setError(errorMessage)
      console.error('Error creating driver:', err)
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
    } catch (err: any) {
      let errorMessage = 'Gagal update driver'
      if (err?.message) errorMessage = err.message
      else if (err?.error_description) errorMessage = err.error_description
      else if (err?.details) errorMessage = err.details
      else if (err?.hint) errorMessage = err.hint
      setError(errorMessage)
      console.error('Error updating driver:', err)
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
    } catch (err: any) {
      let errorMessage = 'Gagal hapus driver'
      if (err?.message) errorMessage = err.message
      else if (err?.error_description) errorMessage = err.error_description
      else if (err?.details) errorMessage = err.details
      else if (err?.hint) errorMessage = err.hint
      setError(errorMessage)
      console.error('Error deleting driver:', err)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { deleteDriver, loading, error }
}