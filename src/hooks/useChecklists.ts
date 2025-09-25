import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { useAuth } from './useAuth'

type Checklist = Database['public']['Tables']['checklists']['Row']

export function useChecklists(tripId: string) {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchChecklists = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('checklists')
        .select('*')
        .eq('trip_id', tripId)
        .order('category', { ascending: true })
        .order('priority', { ascending: false })

      if (error) throw error

      setChecklists(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChecklists()
  }, [tripId])

  return { checklists, loading, error, refetch: fetchChecklists }
}

export function useCreateChecklist() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createChecklist = async (checklistData: Database['public']['Tables']['checklists']['Insert']) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('checklists')
        .insert([checklistData])
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

  return { createChecklist, loading, error }
}

export function useUpdateChecklist() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const updateChecklist = async (id: string, checklistData: Database['public']['Tables']['checklists']['Update']) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('checklists')
        .update(checklistData)
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

  const toggleChecklistItem = async (id: string, completed: boolean) => {
    const updateData: Database['public']['Tables']['checklists']['Update'] = {
      completed,
      completed_by: completed ? user?.id || null : null,
      completed_at: completed ? new Date().toISOString() : null
    }

    return updateChecklist(id, updateData)
  }

  return { updateChecklist, toggleChecklistItem, loading, error }
}

export function useDeleteChecklist() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteChecklist = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('checklists')
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

  return { deleteChecklist, loading, error }
}

// Hook to initialize default checklist items for a new trip
export function useInitializeDefaultChecklist() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializeDefaultChecklist = async (tripId: string) => {
    try {
      setLoading(true)
      setError(null)

      const defaultItems: Database['public']['Tables']['checklists']['Insert'][] = [
        // Pre-departure checklist
        {
          trip_id: tripId,
          title: 'Konfirmasi Peserta',
          description: 'Pastikan semua peserta sudah dikonfirmasi dan melunasi pembayaran',
          priority: 'high',
          category: 'pre-departure'
        },
        {
          trip_id: tripId,
          title: 'Persiapan Kendaraan',
          description: 'Cek kondisi bus, bahan bakar, dan kelengkapan kendaraan',
          priority: 'high',
          category: 'pre-departure'
        },
        {
          trip_id: tripId,
          title: 'Briefing Tour Leader',
          description: 'Briefing tour leader tentang itinerary dan informasi penting',
          priority: 'high',
          category: 'pre-departure'
        },
        {
          trip_id: tripId,
          title: 'Persiapan Dokumen',
          description: 'Siapkan dokumen trip, daftar peserta, dan kontak darurat',
          priority: 'medium',
          category: 'pre-departure'
        },
        {
          trip_id: tripId,
          title: 'Konfirmasi Akomodasi',
          description: 'Konfirmasi booking hotel dan fasilitas akomodasi',
          priority: 'medium',
          category: 'pre-departure'
        },
        
        // During trip checklist
        {
          trip_id: tripId,
          title: 'Absensi Keberangkatan',
          description: 'Cek kehadiran semua peserta di titik kumpul',
          priority: 'high',
          category: 'during-trip'
        },
        {
          trip_id: tripId,
          title: 'Safety Briefing',
          description: 'Berikan safety briefing kepada semua peserta',
          priority: 'high',
          category: 'during-trip'
        },
        {
          trip_id: tripId,
          title: 'Update Progress',
          description: 'Update progress trip secara berkala',
          priority: 'medium',
          category: 'during-trip'
        },
        {
          trip_id: tripId,
          title: 'Dokumentasi',
          description: 'Ambil foto dan video untuk dokumentasi trip',
          priority: 'low',
          category: 'during-trip'
        },
        
        // Post-trip checklist
        {
          trip_id: tripId,
          title: 'Absensi Kepulangan',
          description: 'Pastikan semua peserta kembali dengan selamat',
          priority: 'high',
          category: 'post-trip'
        },
        {
          trip_id: tripId,
          title: 'Evaluasi Trip',
          description: 'Kumpulkan feedback dari peserta dan tour leader',
          priority: 'medium',
          category: 'post-trip'
        },
        {
          trip_id: tripId,
          title: 'Laporan Keuangan',
          description: 'Buat laporan keuangan trip dan rekonsiliasi',
          priority: 'medium',
          category: 'post-trip'
        }
      ]

      const { data, error } = await supabase
        .from('checklists')
        .insert(defaultItems)
        .select()

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

  return { initializeDefaultChecklist, loading, error }
}