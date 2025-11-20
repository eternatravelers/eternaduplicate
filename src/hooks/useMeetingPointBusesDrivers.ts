import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export function useAssignBusToMeetingPoint() {
  const [loading, setLoading] = useState(false)

  const assignBus = async (assignmentId: string, busId: string, capacity: number) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('meeting_point_buses')
        .insert({
          assignment_id: assignmentId,
          bus_id: busId,
          assigned_capacity: capacity
        })

      return { error: error?.message || null }
    } catch (err) {
      return { error: 'Gagal menambahkan bus' }
    } finally {
      setLoading(false)
    }
  }

  return { assignBus, loading }
}

export function useRemoveBusFromMeetingPoint() {
  const [loading, setLoading] = useState(false)

  const removeBus = async (busAssignmentId: string, assignmentId: string, capacity: number) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('meeting_point_buses')
        .delete()
        .eq('id', busAssignmentId)

      return { error: error?.message || null }
    } catch (err) {
      return { error: 'Gagal menghapus bus' }
    } finally {
      setLoading(false)
    }
  }

  return { removeBus, loading }
}

export function useGetMeetingPointBuses() {
  const fetchBuses = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('meeting_point_buses')
        .select(`
          id,
          assigned_capacity,
          buses (
            id,
            bus_number,
            type,
            capacity,
            plate_number
          )
        `)
        .eq('assignment_id', assignmentId)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching buses:', err)
      return []
    }
  }

  return { fetchBuses }
}

export function useAssignDriverToMeetingPoint() {
  const [loading, setLoading] = useState(false)

  const assignDriver = async (assignmentId: string, driverId: string, busId?: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('meeting_point_drivers')
        .insert({
          assignment_id: assignmentId,
          driver_id: driverId,
          bus_id: busId || null
        })

      return { error: error?.message || null }
    } catch (err) {
      return { error: 'Gagal menambahkan driver' }
    } finally {
      setLoading(false)
    }
  }

  return { assignDriver, loading }
}

export function useRemoveDriverFromMeetingPoint() {
  const [loading, setLoading] = useState(false)

  const removeDriver = async (driverAssignmentId: string) => {
    setLoading(true)
    try {
      const { error } = await supabase
        .from('meeting_point_drivers')
        .delete()
        .eq('id', driverAssignmentId)

      return { error: error?.message || null }
    } catch (err) {
      return { error: 'Gagal menghapus driver' }
    } finally {
      setLoading(false)
    }
  }

  return { removeDriver, loading }
}

export function useGetMeetingPointDrivers() {
  const fetchDrivers = async (assignmentId: string) => {
    try {
      const { data, error } = await supabase
        .from('meeting_point_drivers')
        .select(`
          id,
          bus_id,
          drivers (
            id,
            name,
            phone,
            license_number
          )
        `)
        .eq('assignment_id', assignmentId)

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('Error fetching drivers:', err)
      return []
    }
  }

  return { fetchDrivers }
}
