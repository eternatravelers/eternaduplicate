import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { SalesOverviewCards } from '../components/SalesOverviewCards'
import { SalesForm } from '../components/SalesForm'
import { useSales, useCreateSales, useUpdateSales } from '@/hooks/useSales'
import { useParticipants } from '@/hooks/useParticipants'

export function SalesPage() {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingSales, setEditingSales] = useState<string | null>(null)
  
  const { sales, loading, refetch } = useSales()
  const { participants } = useParticipants()
  const { createSales, loading: creating } = useCreateSales()
  const { updateSales, loading: updating } = useUpdateSales()

  const handleSubmit = async (formData: any) => {
    const { data, error } = editingSales 
      ? await updateSales(editingSales, formData)
      : await createSales(formData)

    if (!error) {
      setShowAddForm(false)
      setEditingSales(null)
      refetch()
    }
  }

  const handleEdit = (sale: any) => {
    setEditingSales(sale.id)
    setShowAddForm(true)
  }

  const handleAddNew = () => {
    setEditingSales(null)
    setShowAddForm(true)
  }

  const handleCancel = () => {
    setShowAddForm(false)
    setEditingSales(null)
  }

  // Calculate sales performance
  const salesPerformance = sales.map(sale => {
    const saleParticipants = participants.filter(p => p.sales_id === sale.id)
    const totalRevenue = saleParticipants.reduce((sum, p) => sum + p.package_price, 0)
    const totalParticipants = saleParticipants.reduce((sum, p) => sum + p.participant_count, 0)
    
    return {
      ...sale,
      participantCount: totalParticipants,
      dealCount: saleParticipants.length,
      totalRevenue
    }
  }).sort((a, b) => b.totalRevenue - a.totalRevenue)

  const totalSalesRevenue = salesPerformance.reduce((sum, s) => sum + s.totalRevenue, 0)
  const totalDeals = salesPerformance.reduce((sum, s) => sum + s.dealCount, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Manajemen Sales</h1>
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
          <h1 className="text-3xl font-bold">Manajemen Sales</h1>
          <p className="text-gray-600 mt-2">Kelola tim sales dan pantau performa mereka</p>
        </div>
        <Button onClick={handleAddNew} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Tambah Sales
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="management">Management</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <SalesOverviewCards
            salesCount={sales.length}
            totalSalesRevenue={totalSalesRevenue}
            totalDeals={totalDeals}
          />
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {/* Performance content will be implemented later */}
          <div className="text-center py-8 text-gray-500">
            Performance analytics coming soon...
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          {showAddForm && (
            <SalesForm
              initialData={editingSales ? sales.find(s => s.id === editingSales) : undefined}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              creating={creating}
              updating={updating}
              editingSales={editingSales}
            />
          )}
          
          {/* Sales list will be implemented later */}
          <div className="text-center py-8 text-gray-500">
            Sales list table coming soon...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}