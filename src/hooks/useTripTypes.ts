import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface TripType {
  id: string
  name: string
  created_at: string
  updated_at: string
}

export function useTripTypes() {
  const [tripTypes, setTripTypes] = useState<TripType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTripTypes = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('trip_types')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      setTripTypes(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTripTypes()
  }, [])

  return { tripTypes, loading, error, refetch: fetchTripTypes }
}

export function useCreateTripType() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTripType = async (name: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('trip_types')
        .insert([{ name }])
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

  return { createTripType, loading, error }
}

export function useDeleteTripType() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteTripType = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('trip_types')
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

  return { deleteTripType, loading, error }
}