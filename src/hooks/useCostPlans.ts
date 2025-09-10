import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type CostPlan = Database['public']['Tables']['cost_plans']['Row']

interface CostPlanCategory {
  name: string
  amount: number
  notes: string
}

interface CostPlanData {
  name: string
  estimated_participants: number | string
  categories: CostPlanCategory[]
}

export function useCostPlans() {
  const [costPlans, setCostPlans] = useState<CostPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCostPlans = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('cost_plans')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setCostPlans(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCostPlans()
  }, [])

  return { costPlans, loading, error, refetch: fetchCostPlans }
}

export function useCreateCostPlan() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCostPlan = async (costPlanData: CostPlanData) => {
    try {
      setLoading(true)
      setError(null)

      // Convert estimated_participants to number, default to 1 if empty
      const estimatedParticipants = typeof costPlanData.estimated_participants === 'string' && costPlanData.estimated_participants === '' 
        ? 1 
        : Number(costPlanData.estimated_participants) || 1

      // Calculate totals
      const totalCost = costPlanData.categories.reduce((sum, cat) => sum + (cat.amount || 0), 0)
      const costPerPerson = estimatedParticipants > 0 
        ? totalCost / estimatedParticipants 
        : 0

      const { data, error } = await supabase
        .from('cost_plans')
        .insert([{
          name: costPlanData.name,
          estimated_participants: estimatedParticipants,
          categories: costPlanData.categories,
          total_cost: totalCost,
          cost_per_person: costPerPerson
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

  return { createCostPlan, loading, error }
}

export function useUpdateCostPlan() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateCostPlan = async (id: string, costPlanData: Partial<CostPlanData>) => {
    try {
      setLoading(true)
      setError(null)

      let updateData: any = { ...costPlanData }

      // Convert estimated_participants to number if provided
      if (costPlanData.estimated_participants !== undefined) {
        const estimatedParticipants = typeof costPlanData.estimated_participants === 'string' && costPlanData.estimated_participants === '' 
          ? 1 
          : Number(costPlanData.estimated_participants) || 1
        updateData.estimated_participants = estimatedParticipants
      }

      // Calculate totals if categories are provided
      if (costPlanData.categories) {
        const totalCost = costPlanData.categories.reduce((sum, cat) => sum + (cat.amount || 0), 0)
        const estimatedParticipants = updateData.estimated_participants || 1
        const costPerPerson = estimatedParticipants > 0 
          ? totalCost / estimatedParticipants
          : 0

        updateData.total_cost = totalCost
        updateData.cost_per_person = costPerPerson
      }

      const { data, error } = await supabase
        .from('cost_plans')
        .update(updateData)
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

  return { updateCostPlan, loading, error }
}

export function useDeleteCostPlan() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteCostPlan = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase
        .from('cost_plans')
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

  return { deleteCostPlan, loading, error }
}