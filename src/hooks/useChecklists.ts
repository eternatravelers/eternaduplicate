import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'
import { useAuth } from './useAuth'

type Checklist = Database['public']['Tables']['checklists']['Row']
type ChecklistComment = Database['public']['Tables']['checklist_comments']['Row']
type ChecklistHistory = Database['public']['Tables']['checklist_history']['Row']

export function useChecklists(tripId: string, filterOptions?: {
  status?: string
  assignedToMe?: boolean
  category?: string
}) {
  const [checklists, setChecklists] = useState<Checklist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const fetchChecklists = async () => {
    try {
      setLoading(true)
      setError(null)
      let query = supabase
        .from('checklists')
        .select('*')
        .eq('trip_id', tripId)

      // Apply filters
      if (filterOptions?.status) {
        query = query.eq('status', filterOptions.status)
      }

      if (filterOptions?.assignedToMe && user) {
        query = query.eq('assigned_to', user.id)
      }

      if (filterOptions?.category) {
        query = query.eq('category', filterOptions.category)
      }

      query = query
        .order('days_before_departure', { ascending: false, nullsFirst: false })
        .order('sort_order', { ascending: true })
        .order('priority', { ascending: false })

      const { data, error } = await query

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId, filterOptions?.status, filterOptions?.assignedToMe, filterOptions?.category])

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

      const { error, data, count } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id)
        .select()

      if (error) {
        const errorMsg = error.message || error.hint || JSON.stringify(error)
        throw new Error(errorMsg)
      }

      return { error: null, success: true, deletedCount: count }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : (typeof err === 'object' ? JSON.stringify(err) : String(err))
      setError(errorMessage)
      return { error: errorMessage, success: false }
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

// Hook for checklist comments
export function useChecklistComments(checklistId: string) {
  const [comments, setComments] = useState<ChecklistComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('checklist_comments')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('created_at', { ascending: true })

      if (error) throw error

      setComments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (checklistId) {
      fetchComments()
    }
  }, [checklistId])

  return { comments, loading, error, refetch: fetchComments }
}

// Hook for adding comments
export function useAddChecklistComment() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const addComment = async (checklistId: string, comment: string, mentions: string[] = []) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('checklist_comments')
        .insert([{
          checklist_id: checklistId,
          user_id: user?.id,
          comment,
          mentions
        }])
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

  return { addComment, loading, error }
}

// Hook for checklist history/audit trail
export function useChecklistHistory(checklistId: string) {
  const [history, setHistory] = useState<ChecklistHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('checklist_history')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('created_at', { ascending: false })

      if (error) throw error

      setHistory(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (checklistId) {
      fetchHistory()
    }
  }, [checklistId])

  return { history, loading, error, refetch: fetchHistory }
}

// Hook for bulk checklist operations
export function useBulkChecklistOperations() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  const bulkComplete = async (checklistIds: string[]) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('checklists')
        .update({
          completed: true,
          completed_by: user?.id,
          completed_at: new Date().toISOString(),
          status: 'completed'
        })
        .in('id', checklistIds)
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

  const bulkAssign = async (checklistIds: string[], assignedTo: string, assignedRole?: string) => {
    try {
      setLoading(true)
      setError(null)

      const updateData: any = { assigned_to: assignedTo }
      if (assignedRole) {
        updateData.assigned_role = assignedRole
      }

      const { data, error } = await supabase
        .from('checklists')
        .update(updateData)
        .in('id', checklistIds)
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

  const bulkUpdateStatus = async (checklistIds: string[], status: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('checklists')
        .update({ status })
        .in('id', checklistIds)
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

  return { bulkComplete, bulkAssign, bulkUpdateStatus, loading, error }
}

// Hook for checklist assignment
export function useAssignChecklist() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const assignChecklist = async (checklistId: string, assignedTo: string, assignedRole?: string) => {
    try {
      setLoading(true)
      setError(null)

      const updateData: any = { assigned_to: assignedTo }
      if (assignedRole) {
        updateData.assigned_role = assignedRole
      }

      const { data, error } = await supabase
        .from('checklists')
        .update(updateData)
        .eq('id', checklistId)
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

  return { assignChecklist, loading, error }
}

// Hook for updating checklist notes
export function useUpdateChecklistNotes() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateNotes = async (checklistId: string, notes: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('checklists')
        .update({ notes })
        .eq('id', checklistId)
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

  return { updateNotes, loading, error }
}