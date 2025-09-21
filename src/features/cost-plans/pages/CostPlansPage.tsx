import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CostPlanStatsCards } from '../components/CostPlanStatsCards'
import { useCostPlans, useCreateCostPlan, useUpdateCostPlan, useDeleteCostPlan } from '@/hooks/useCostPlans'
import { useAuth } from '@/hooks/useAuth'

export function CostPlansPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCostPlan, setEditingCostPlan] = useState<string | null>(null)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  const { costPlans, loading, refetch } = useCostPlans()
  const { createCostPlan, loading: creating } = useCreateCostPlan()
  const { updateCostPlan, loading: updating } = useUpdateCostPlan()
  const { deleteCostPlan, loading: deleting } = useDeleteCostPlan()
  const { isSuperAdmin } = useAuth()

  const handleSubmit = async (formData: any) => {
    const { data, error } = editingCostPlan 
      ? await updateCostPlan(editingCostPlan, formData)
      : await createCostPlan(formData)

    if (!error) {
      setShowAddForm(false)
      setEditingCostPlan(null)
      setIsDuplicating(false)
      refetch()
    }
  }

  const handleAddNew = () => {
    setEditingCostPlan(null)
    setIsDuplicating(false)
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingCostPlan(null)
    setIsDuplicating(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Rencana Biaya</h1>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rencana Biaya</h1>
          <p className="text-gray-600 mt-2">Kelola template biaya untuk trip Anda</p>
        </div>
        <Button onClick={handleAddNew} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Rencana Biaya
        </Button>
      </div>

      <CostPlanStatsCards costPlans={costPlans} />

      {/* Form and table components will be implemented later */}
      <div className="text-center py-8 text-gray-500">
        Cost plan form and table coming soon...
      </div>
    </div>
  )
}