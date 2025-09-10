import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export interface TransactionCategory {
  id: string
  name: string
  type: 'Pemasukan' | 'Pengeluaran'
  parent_id: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  children?: TransactionCategory[]
}

export function useTransactionCategories() {
  const [categories, setCategories] = useState<TransactionCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('transaction_categories')
        .select('*')
        .eq('is_active', true)
        .order('type', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error

      // Organize categories with their children
      const parentCategories = data?.filter(cat => !cat.parent_id) || []
      const childCategories = data?.filter(cat => cat.parent_id) || []

      const organizedCategories = parentCategories.map(parent => ({
        ...parent,
        children: childCategories.filter(child => child.parent_id === parent.id)
      }))

      setCategories(organizedCategories)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  return { categories, loading, error, refetch: fetchCategories }
}

export function useCreateTransactionCategory() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCategory = async (categoryData: {
    name: string
    type: 'Pemasukan' | 'Pengeluaran'
    parent_id?: string | null
    description?: string
  }) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('transaction_categories')
        .insert([categoryData])
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

  return { createCategory, loading, error }
}

export function useUpdateTransactionCategory() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateCategory = async (id: string, categoryData: {
    name?: string
    description?: string
    is_active?: boolean
  }) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('transaction_categories')
        .update(categoryData)
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

  return { updateCategory, loading, error }
}

export function useDeleteTransactionCategory() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteCategory = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('transaction_categories')
        .update({ is_active: false })
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

  return { deleteCategory, loading, error }
}

// Helper function to get flat list of categories for select options
export function useFlatCategories(type?: 'Pemasukan' | 'Pengeluaran') {
  const { categories } = useTransactionCategories()
  
  const flatCategories = categories
    .filter(cat => !type || cat.type === type)
    .reduce((acc: Array<{id: string, name: string, type: string, isSubCategory: boolean}>, category) => {
      // Add parent category
      acc.push({
        id: category.id,
        name: category.name,
        type: category.type,
        isSubCategory: false
      })
      
      // Add child categories
      if (category.children) {
        category.children.forEach(child => {
          acc.push({
            id: child.id,
            name: `${category.name} → ${child.name}`,
            type: child.type,
            isSubCategory: true
          })
        })
      }
      
      return acc
    }, [])

  return flatCategories
}