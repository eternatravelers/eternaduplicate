import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface BusRouteStop {
  id: string
  resource_schedule_id: string
  meeting_point_id: string | null
  meeting_point_name: string
  stop_order: number
  arrival_time: string
  departure_time: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export function useBusRouteStops(resourceScheduleId: string | null) {
  const [stops, setStops] = useState<BusRouteStop[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStops = async () => {
    if (!resourceScheduleId) {
      setStops([])
      return
    }

    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('bus_route_stops')
        .select('*')
        .eq('resource_schedule_id', resourceScheduleId)
        .order('stop_order', { ascending: true })

      if (fetchError) throw fetchError

      setStops(data || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal memuat data rute'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStops()
  }, [resourceScheduleId])

  return { stops, loading, error, refetch: fetchStops }
}

export function useCreateBusRouteStop() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createStop = async (stopData: Omit<BusRouteStop, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: createError } = await supabase
        .from('bus_route_stops')
        .insert([stopData])
        .select()
        .single()

      if (createError) throw createError

      return { data, error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal membuat stop rute'
      setError(msg)
      return { data: null, error: msg }
    } finally {
      setLoading(false)
    }
  }

  return { createStop, loading, error }
}

export function useUpdateBusRouteStop() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateStop = async (id: string, stopData: Partial<BusRouteStop>) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: updateError } = await supabase
        .from('bus_route_stops')
        .update(stopData)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError

      return { data, error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengupdate stop rute'
      setError(msg)
      return { data: null, error: msg }
    } finally {
      setLoading(false)
    }
  }

  return { updateStop, loading, error }
}

export function useDeleteBusRouteStop() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteStop = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('bus_route_stops')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError

      return { error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menghapus stop rute'
      setError(msg)
      return { error: msg }
    } finally {
      setLoading(false)
    }
  }

  return { deleteStop, loading, error }
}

export function useBulkSaveBusRouteStops() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const bulkSave = async (
    resourceScheduleId: string,
    stops: Array<Omit<BusRouteStop, 'id' | 'created_at' | 'updated_at'>>
  ) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('bus_route_stops')
        .delete()
        .eq('resource_schedule_id', resourceScheduleId)

      if (deleteError) throw deleteError

      if (stops.length > 0) {
        const { error: insertError } = await supabase
          .from('bus_route_stops')
          .insert(stops.map((s, i) => ({ ...s, stop_order: i + 1, resource_schedule_id: resourceScheduleId })))

        if (insertError) throw insertError
      }

      return { error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan rute'
      setError(msg)
      return { error: msg }
    } finally {
      setLoading(false)
    }
  }

  return { bulkSave, loading, error }
}
