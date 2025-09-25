import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Calculator, Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CostPlanCategory {
  name: string
  amount: number
  notes: string
}

interface CostPlanFormProps {
  initialData?: any
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  creating: boolean
  updating: boolean
  editingCostPlan: string | null
}

export function CostPlanForm({
  initialData,
  onSubmit,
  onCancel,
  creating,
  updating,
  editingCostPlan
}: CostPlanFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    estimated_participants: '' as number | '',
    categories: [] as CostPlanCategory[]
  })

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        estimated_participants: initialData.estimated_participants || '',
        categories: initialData.categories || []
      })
    } else {
      // Reset form for new cost plan
      setFormData({
        name: '',
        estimated_participants: '',
        categories: [{ name: '', amount: 0, notes: '' }]
      })
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Filter out empty categories
    const validCategories = formData.categories.filter(cat => 
      cat.name.trim() !== '' && cat.amount > 0
    )

    const submitData = {
      name: formData.name,
      estimated_participants: formData.estimated_participants === '' ? 1 : Number(formData.estimated_participants),
      categories: validCategories
    }

    await onSubmit(submitData)
  }

  const addCategory = () => {
    setFormData(prev => ({
      ...prev,
      categories: [...prev.categories, { name: '', amount: 0, notes: '' }]
    }))
  }

  const removeCategory = (index: number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter((_, i) => i !== index)
    }))
  }

  const updateCategory = (index: number, field: keyof CostPlanCategory, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.map((cat, i) => 
        i === index ? { ...cat, [field]: value } : cat
      )
    }))
  }

  // Calculate totals
  const totalCost = formData.categories.reduce((sum, cat) => sum + (cat.amount || 0), 0)
  const estimatedParticipants = Number(formData.estimated_participants) || 1
  const costPerPerson = estimatedParticipants > 0 ? totalCost / estimatedParticipants : 0

  return (
    <Card className="border-green-200 shadow-lg">
      <CardHeader className="bg-green-50">
        <CardTitle className="flex items-center space-x-2 text-green-800">
          <Calculator className="h-5 w-5" />
          <span>{editingCostPlan ? 'Edit Rencana Biaya' : 'Tambah Rencana Biaya Baru'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nama Rencana Biaya <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Contoh: Paket Wisata Bali 3D2N"
                required
                className="focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estimated_participants" className="text-sm font-medium">
                Perkiraan Jumlah Peserta <span className="text-red-500">*</span>
              </Label>
              <Input
                id="estimated_participants"
                type="number"
                min="1"
                value={formData.estimated_participants}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value)
                  setFormData(prev => ({ ...prev, estimated_participants: isNaN(val) ? '' : val }))
                }}
                placeholder="Contoh: 20"
                required
                className="focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>

          {/* Categories Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Kategori Biaya</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addCategory}
                className="text-green-600 border-green-200 hover:bg-green-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Kategori
              </Button>
            </div>

            <div className="space-y-3">
              {formData.categories.map((category, index) => (
                <div key={index} className="p-4 border rounded-lg bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                    <div className="md:col-span-4">
                      <Label htmlFor={`category-name-${index}`} className="text-sm">
                        Nama Kategori
                      </Label>
                      <Input
                        id={`category-name-${index}`}
                        value={category.name}
                        onChange={(e) => updateCategory(index, 'name', e.target.value)}
                        placeholder="Contoh: Transportasi"
                        className="mt-1"
                      />
                    </div>

                    <div className="md:col-span-3">
                      <Label htmlFor={`category-amount-${index}`} className="text-sm">
                        Jumlah (Rp)
                      </Label>
                      <Input
                        id={`category-amount-${index}`}
                        type="number"
                        min="0"
                        value={category.amount}
                        onChange={(e) => updateCategory(index, 'amount', parseFloat(e.target.value) || 0)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>

                    <div className="md:col-span-4">
                      <Label htmlFor={`category-notes-${index}`} className="text-sm">
                        Catatan
                      </Label>
                      <Input
                        id={`category-notes-${index}`}
                        value={category.notes}
                        onChange={(e) => updateCategory(index, 'notes', e.target.value)}
                        placeholder="Catatan opsional..."
                        className="mt-1"
                      />
                    </div>

                    <div className="md:col-span-1 flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCategory(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 mt-6"
                        disabled={formData.categories.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Summary Section */}
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="font-semibold text-green-800 mb-3">Ringkasan Biaya</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Biaya:</span>
                <div className="font-bold text-lg text-green-700">
                  {formatCurrency(totalCost)}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Perkiraan Peserta:</span>
                <div className="font-bold text-lg">
                  {estimatedParticipants} orang
                </div>
              </div>
              <div>
                <span className="text-gray-600">Biaya per Orang:</span>
                <div className="font-bold text-lg text-blue-700">
                  {formatCurrency(costPerPerson)}
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={creating || updating}
              className="bg-green-600 hover:bg-green-700"
            >
              {creating || updating ? 'Menyimpan...' : editingCostPlan ? 'Update Rencana Biaya' : 'Simpan Rencana Biaya'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="border-gray-300"
            >
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}