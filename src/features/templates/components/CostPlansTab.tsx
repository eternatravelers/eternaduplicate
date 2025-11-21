import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus } from 'lucide-react'
import { CostPlanStatsCards } from '@/features/cost-plans/components/CostPlanStatsCards'
import { CostPlanForm } from '@/features/cost-plans/components/CostPlanForm'
import { CostPlanTable } from '@/features/cost-plans/components/CostPlanTable'
import { useCostPlans, useCreateCostPlan, useUpdateCostPlan, useDeleteCostPlan } from '@/hooks/useCostPlans'

export function CostPlansTab() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCostPlan, setEditingCostPlan] = useState<string | null>(null)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { costPlans, loading, refetch } = useCostPlans()
  const { createCostPlan, loading: creating } = useCreateCostPlan()
  const { updateCostPlan, loading: updating } = useUpdateCostPlan()
  const { deleteCostPlan, loading: deleting } = useDeleteCostPlan()

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
      const planToDuplicate = costPlans[0]
      return {
        ...planToDuplicate,
        name: `${planToDuplicate.name} (Copy)`,
        id: undefined
      }
    }

    if (editingCostPlan) {
      return costPlans.find(plan => plan.id === editingCostPlan)
    }

    return undefined
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-32 bg-gray-200 rounded-lg"></div>
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-gray-600">Template biaya untuk perencanaan keuangan trip</p>
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
