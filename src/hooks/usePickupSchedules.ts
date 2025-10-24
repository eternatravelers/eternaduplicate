import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type PickupSchedule = Database['public']['Tables']['pickup_schedules']['Row']
type PickupScheduleInsert = Database['public']['Tables']['pickup_schedules']['Insert']
type PickupScheduleUpdate = Database['public']['Tables']['pickup_schedules']['Update']

export function usePickupSchedules(tripId: string | null) {
  const [schedules, setSchedules] = useState<PickupSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchedules = async () => {
    if (!tripId) {
      setSchedules([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('pickup_schedules')
        .select('*')
        .eq('trip_id', tripId)
        .order('pickup_time', { ascending: true })

      if (fetchError) throw fetchError

      setSchedules(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch pickup schedules')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [tripId])

  return { schedules, loading, error, refetch: fetchSchedules }
}

export function useCreatePickupSchedule() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createSchedule = async (scheduleData: PickupScheduleInsert) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: insertError } = await supabase
        .from('pickup_schedules')
        .insert([scheduleData])
        .select()
        .single()

      if (insertError) throw insertError

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create pickup schedule'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { createSchedule, loading, error }
}

export function useUpdatePickupSchedule() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateSchedule = async (id: string, scheduleData: PickupScheduleUpdate) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: updateError } = await supabase
        .from('pickup_schedules')
        .update(scheduleData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update pickup schedule'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { updateSchedule, loading, error }
}

export function useDeletePickupSchedule() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteSchedule = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('pickup_schedules')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete pickup schedule'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { deleteSchedule, loading, error }
}
