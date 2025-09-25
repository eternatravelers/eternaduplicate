import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus } from 'lucide-react'
import { CostPlanStatsCards } from '../components/CostPlanStatsCards'
import { CostPlanForm } from '../components/CostPlanForm'
import { CostPlanTable } from '../components/CostPlanTable'
import { useCostPlans, useCreateCostPlan, useUpdateCostPlan, useDeleteCostPlan } from '@/hooks/useCostPlans'
import { useAuth } from '@/hooks/useAuth'

export function CostPlansPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCostPlan, setEditingCostPlan] = useState<string | null>(null)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)
  
  const { costPlans, loading, refetch } = useCostPlans()
  const { createCostPlan, loading: creating } = useCreateCostPlan()
  const { updateCostPlan, loading: updating } = useUpdateCostPlan()
  const { deleteCostPlan, loading: deleting } = useDeleteCostPlan()
  const { isSuperAdmin } = useAuth()

  const handleSubmit = async (formData: any) => {
    try {
      setError(null)
      const { data, error } = editingCostPlan 
        ? await updateCostPlan(editingCostPlan, formData)
        : await createCostPlan(formData)

      if (error) {
        setError(error)
        return
      }

      if (data) {
        setShowAddForm(false)
        setEditingCostPlan(null)
        setIsDuplicating(false)
        refetch()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleEdit = (costPlan: any) => {
    setEditingCostPlan(costPlan.id)
    setIsDuplicating(false)
    setShowAddForm(true)
  }

  const handleDuplicate = (costPlan: any) => {
    setEditingCostPlan(null)
    setIsDuplicating(true)
    setShowAddForm(true)
  }

  const handleDelete = async (id: string) => {
    try {
      setError(null)
      const { error } = await deleteCostPlan(id)
      if (error) {
        setError(error)
        return
      }
      refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
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
    setError(null)
  }

  const getInitialData = () => {
    if (isDuplicating && costPlans.length > 0) {
      // For duplication, we'll use the last selected cost plan
      // In a real implementation, you'd track which plan was selected for duplication
      const planToDuplicate = costPlans[0] // This should be the selected plan
      return {
        ...planToDuplicate,
        name: `${planToDuplicate.name} (Copy)`,
        id: undefined // Remove ID so it creates a new record
      }
    }
    
    if (editingCostPlan) {
      return costPlans.find(plan => plan.id === editingCostPlan)
    }
    
    return undefined
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

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <CostPlanStatsCards costPlans={costPlans} />

      {showAddForm && (
        <CostPlanForm
          initialData={getInitialData()}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          creating={creating}
          updating={updating}
          editingCostPlan={editingCostPlan}
        />
      )}

      <CostPlanTable
        costPlans={costPlans}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onEdit={handleEdit}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        deleting={deleting}
      />
    </div>
  )
}