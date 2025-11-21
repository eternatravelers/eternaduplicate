import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type ChecklistTemplate = Database['public']['Tables']['checklist_templates']['Row']
type ChecklistTemplateItem = Database['public']['Tables']['checklist_template_items']['Row']

export interface ChecklistTemplateWithItems extends ChecklistTemplate {
  items?: ChecklistTemplateItem[]
}

export function useChecklistTemplates() {
  const [templates, setTemplates] = useState<ChecklistTemplateWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: templatesData, error: templatesError } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (templatesError) throw templatesError

      const templatesWithItems = await Promise.all(
        (templatesData || []).map(async (template) => {
          const { data: items, error: itemsError } = await supabase
            .from('checklist_template_items')
            .select('*')
            .eq('template_id', template.id)
            .order('sort_order', { ascending: true })

          if (itemsError) {
            console.error('Error fetching items for template:', itemsError)
            return { ...template, items: [] }
          }

          return { ...template, items: items || [] }
        })
      )

      setTemplates(templatesWithItems)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  return { templates, loading, error, refetch: fetchTemplates }
}

export function useChecklistTemplate(templateId: string) {
  const [template, setTemplate] = useState<ChecklistTemplateWithItems | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTemplate = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: templateData, error: templateError } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (templateError) throw templateError

      const { data: items, error: itemsError } = await supabase
        .from('checklist_template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order', { ascending: true })

      if (itemsError) throw itemsError

      setTemplate({ ...templateData, items: items || [] })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (templateId) {
      fetchTemplate()
    }
  }, [templateId])

  return { template, loading, error, refetch: fetchTemplate }
}

export function useCreateChecklistTemplate() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTemplate = async (
    templateData: Database['public']['Tables']['checklist_templates']['Insert'],
    items: Database['public']['Tables']['checklist_template_items']['Insert'][]
  ) => {
    try {
      setLoading(true)
      setError(null)

      const { data: template, error: templateError } = await supabase
        .from('checklist_templates')
        .insert([templateData])
        .select()
        .single()

      if (templateError) throw templateError

      if (items.length > 0) {
        const itemsWithTemplateId = items.map(item => ({
          ...item,
          template_id: template.id
        }))

        const { error: itemsError } = await supabase
          .from('checklist_template_items')
          .insert(itemsWithTemplateId)

        if (itemsError) throw itemsError
      }

      return { data: template, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { createTemplate, loading, error }
}

export function useUpdateChecklistTemplate() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTemplate = async (
    templateId: string,
    templateData: Database['public']['Tables']['checklist_templates']['Update'],
    items?: Database['public']['Tables']['checklist_template_items']['Insert'][]
  ) => {
    try {
      setLoading(true)
      setError(null)

      const { data: template, error: templateError } = await supabase
        .from('checklist_templates')
        .update(templateData)
        .eq('id', templateId)
        .select()
        .single()

      if (templateError) throw templateError

      if (items !== undefined) {
        const { error: deleteError } = await supabase
          .from('checklist_template_items')
          .delete()
          .eq('template_id', templateId)

        if (deleteError) throw deleteError

        if (items.length > 0) {
          const itemsWithTemplateId = items.map(item => ({
            ...item,
            template_id: templateId
          }))

          const { error: itemsError } = await supabase
            .from('checklist_template_items')
            .insert(itemsWithTemplateId)

          if (itemsError) throw itemsError
        }
      }

      return { data: template, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { updateTemplate, loading, error }
}

export function useDeleteChecklistTemplate() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteTemplate = async (templateId: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error: deleteError } = await supabase
        .from('checklist_templates')
        .delete()
        .eq('id', templateId)

      if (deleteError) throw deleteError

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { deleteTemplate, loading, error }
}

export function useApplyChecklistTemplate() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const applyTemplate = async (templateId: string, tripId: string, tripDepartureDate?: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data: items, error: itemsError } = await supabase
        .from('checklist_template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order', { ascending: true })

      if (itemsError) throw itemsError

      const checklistItems = items.map(item => {
        const checklistItem: any = {
          trip_id: tripId,
          title: item.title,
          description: item.description,
          priority: item.priority,
          category: item.category,
          sort_order: item.sort_order,
          status: 'pending',
          completed: false
        }

        if (item.days_before_departure && tripDepartureDate) {
          const departureDate = new Date(tripDepartureDate)
          const deadlineDate = new Date(departureDate)
          deadlineDate.setDate(deadlineDate.getDate() - item.days_before_departure)
          checklistItem.deadline_date = deadlineDate.toISOString()
          checklistItem.days_before_departure = item.days_before_departure
        }

        return checklistItem
      })

      const { data, error: insertError } = await supabase
        .from('checklists')
        .insert(checklistItems)
        .select()

      if (insertError) throw insertError

      const { error: updateError } = await supabase
        .from('checklist_templates')
        .update({ usage_count: supabase.raw('usage_count + 1') })
        .eq('id', templateId)

      if (updateError) {
        console.error('Error updating template usage count:', updateError)
      }

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { applyTemplate, loading, error }
}

export function useDuplicateChecklistTemplate() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const duplicateTemplate = async (templateId: string, newName: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data: originalTemplate, error: templateError } = await supabase
        .from('checklist_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (templateError) throw templateError

      const { data: originalItems, error: itemsError } = await supabase
        .from('checklist_template_items')
        .select('*')
        .eq('template_id', templateId)
        .order('sort_order', { ascending: true })

      if (itemsError) throw itemsError

      const { data: newTemplate, error: newTemplateError } = await supabase
        .from('checklist_templates')
        .insert([{
          name: newName,
          description: originalTemplate.description,
          category: originalTemplate.category,
          is_active: true,
          usage_count: 0
        }])
        .select()
        .single()

      if (newTemplateError) throw newTemplateError

      if (originalItems && originalItems.length > 0) {
        const newItems = originalItems.map(item => ({
          template_id: newTemplate.id,
          title: item.title,
          description: item.description,
          priority: item.priority,
          category: item.category,
          days_before_departure: item.days_before_departure,
          sort_order: item.sort_order
        }))

        const { error: newItemsError } = await supabase
          .from('checklist_template_items')
          .insert(newItems)

        if (newItemsError) throw newItemsError
      }

      return { data: newTemplate, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { duplicateTemplate, loading, error }
}
