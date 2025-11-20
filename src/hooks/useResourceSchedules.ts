import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface ResourceSchedule {
  id: string
  resource_type: 'bus' | 'driver' | 'tour_leader'
  resource_id: string
  trip_id: string
  meeting_point_id?: string
  meeting_point_name?: string
  pickup_datetime: string
  return_datetime: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'
  capacity_allocated: number
  notes?: string
  created_by?: string
  created_at: string
  updated_at: string
  trips?: {
    name: string
    departure_date: string
    return_date: string
  }
  buses?: {
    plate_number: string
    model: string
    capacity: number
  }
  drivers?: {
    name: string
    license_number: string
  }
  tour_leaders?: {
    name: string
    experience_years: number
  }
}

export function useResourceSchedules(filters?: {
  resourceType?: string
  resourceId?: string
  tripId?: string
  startDate?: string
  endDate?: string
  status?: string
}) {
  const [schedules, setSchedules] = useState<ResourceSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('resource_schedules')
        .select(`
          *,
          trips:trip_id(name, departure_date, return_date),
          buses:resource_id(plate_number, model, capacity),
          drivers:resource_id(name, license_number),
          tour_leaders:resource_id(name, experience_years)
        `)
        .order('pickup_datetime', { ascending: true })

      if (filters?.resourceType) {
        query = query.eq('resource_type', filters.resourceType)
      }
      if (filters?.resourceId) {
        query = query.eq('resource_id', filters.resourceId)
      }
      if (filters?.tripId) {
        query = query.eq('trip_id', filters.tripId)
      }
      if (filters?.startDate) {
        query = query.gte('pickup_datetime', filters.startDate)
      }
      if (filters?.endDate) {
        query = query.lte('return_datetime', filters.endDate)
      }
      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      const { data, error: fetchError } = await query

      if (fetchError) throw fetchError

      setSchedules(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch schedules'
      setError(errorMessage)
      console.error('Error fetching resource schedules:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [
    filters?.resourceType,
    filters?.resourceId,
    filters?.tripId,
    filters?.startDate,
    filters?.endDate,
    filters?.status
  ])

  return { schedules, loading, error, refetch: fetchSchedules }
}

export function useCreateResourceSchedule() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSchedule = async (scheduleData: Partial<ResourceSchedule>) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: createError } = await supabase
        .from('resource_schedules')
        .insert([scheduleData])
        .select()
        .single()

      if (createError) throw createError

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create schedule'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { createSchedule, loading, error }
}

export function useUpdateResourceSchedule() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateSchedule = async (id: string, scheduleData: Partial<ResourceSchedule>) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: updateError } = await supabase
        .from('resource_schedules')
        .update(scheduleData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update schedule'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { updateSchedule, loading, error }
}

export function useDeleteResourceSchedule() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteSchedule = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('resource_schedules')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete schedule'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { deleteSchedule, loading, error }
}

export function useCheckResourceConflict() {
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkConflict = async (
    resourceType: string,
    resourceId: string,
    pickupDatetime: string,
    returnDatetime: string,
    excludeScheduleId?: string
  ) => {
    try {
      setChecking(true)
      setError(null)

      const { data: isAvailable, error: checkError } = await supabase.rpc(
        'check_resource_time_conflict',
        {
          p_resource_type: resourceType,
          p_resource_id: resourceId,
          p_pickup_datetime: pickupDatetime,
          p_return_datetime: returnDatetime,
          p_exclude_schedule_id: excludeScheduleId || null
        }
      )

      if (checkError) throw checkError

      if (!isAvailable) {
        const { data: conflicts, error: conflictError } = await supabase.rpc(
          'get_conflicting_schedules',
          {
            p_resource_type: resourceType,
            p_resource_id: resourceId,
            p_pickup_datetime: pickupDatetime,
            p_return_datetime: returnDatetime,
            p_exclude_schedule_id: excludeScheduleId || null
          }
        )

        if (conflictError) throw conflictError

        return {
          hasConflict: true,
          conflicts: conflicts || []
        }
      }

      return {
        hasConflict: false,
        conflicts: []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to check conflict'
      setError(errorMessage)
      return {
        hasConflict: false,
        conflicts: []
      }
    } finally {
      setChecking(false)
    }
  }

  return { checkConflict, checking, error }
}

export function useResourceScheduleByResource(
  resourceType: string,
  resourceId: string,
  startDate?: string,
  endDate?: string
) {
  const [schedules, setSchedules] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = async () => {
    if (!resourceType || !resourceId) {
      setSchedules([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase.rpc(
        'get_resource_schedule',
        {
          p_resource_type: resourceType,
          p_resource_id: resourceId,
          p_start_date: startDate || null,
          p_end_date: endDate || null
        }
      )

      if (fetchError) throw fetchError

      setSchedules(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch resource schedule'
      setError(errorMessage)
      console.error('Error fetching resource schedule:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [resourceType, resourceId, startDate, endDate])

  return { schedules, loading, error, refetch: fetchSchedules }
}

export function useTripResourceSummary(tripId: string) {
  const [summary, setSummary] = useState<any[]>([])
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

      const { data, error: fetchError } = await supabase.rpc(
        'get_trip_resource_summary',
        { p_trip_id: tripId }
      )

      if (fetchError) throw fetchError

      setSummary(data || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch trip resource summary'
      setError(errorMessage)
      console.error('Error fetching trip resource summary:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSummary()
  }, [tripId])

  return { summary, loading, error, refetch: fetchSummary }
}
