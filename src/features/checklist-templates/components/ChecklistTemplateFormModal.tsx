import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { useCreateChecklistTemplate, useUpdateChecklistTemplate } from '@/hooks/useChecklistTemplates'

interface ChecklistTemplateFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  initialData?: any
  title: string
}

interface TemplateItem {
  id: string
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'pre-departure' | 'during-trip' | 'post-trip'
  days_before_departure: number | null
  sort_order: number
}

export function ChecklistTemplateFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  title
}: ChecklistTemplateFormModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('general')
  const [items, setItems] = useState<TemplateItem[]>([])

  const { createTemplate, loading: creating } = useCreateChecklistTemplate()
  const { updateTemplate, loading: updating } = useUpdateChecklistTemplate()

  const loading = creating || updating

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '')
      setDescription(initialData.description || '')
      setCategory(initialData.category || 'general')
      setItems(initialData.items?.map((item: any, index: number) => ({
        id: crypto.randomUUID(),
        title: item.title || '',
        description: item.description || '',
        priority: item.priority || 'medium',
        category: item.category || 'pre-departure',
        days_before_departure: item.days_before_departure || null,
        sort_order: index
      })) || [])
    } else {
      setName('')
      setDescription('')
      setCategory('general')
      setItems([])
    }
  }, [initialData, isOpen])

  const handleAddItem = () => {
    setItems([...items, {
      id: crypto.randomUUID(),
      title: '',
      description: '',
      priority: 'medium',
      category: 'pre-departure',
      days_before_departure: null,
      sort_order: items.length
    }])
  }

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(item => item.id !== id))
  }

  const handleItemChange = (id: string, field: keyof TemplateItem, value: any) => {
    setItems(items.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Nama template harus diisi')
      return
    }

    const templateData = {
      name: name.trim(),
      description: description.trim(),
      category,
      is_active: true
    }

    const itemsData = items.map((item, index) => ({
      title: item.title,
      description: item.description,
      priority: item.priority,
      category: item.category,
      days_before_departure: item.days_before_departure,
      sort_order: index
    }))

    let result
    if (initialData) {
      result = await updateTemplate(initialData.id, templateData, itemsData)
    } else {
      result = await createTemplate(templateData, itemsData)
    }

    if (!result.error) {
      onSuccess()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Template *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Standard Trip Checklist"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">Umum</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                  <SelectItem value="domestic">Domestik</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Deskripsikan template ini..."
              rows={2}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Checklist Items ({items.length})</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Item
              </Button>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
              {items.map((item, index) => {
                const priorityStyles = {
                  high: 'border-l-red-400 bg-red-50/40',
                  medium: 'border-l-yellow-400 bg-yellow-50/40',
                  low: 'border-l-green-400 bg-green-50/40',
                }
                return (
                  <div key={item.id} className={`border border-l-4 rounded-lg p-4 space-y-3 ${priorityStyles[item.priority]}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-semibold text-gray-700">Item #{index + 1}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-red-50 hover:text-red-600"
                        onClick={() => handleRemoveItem(item.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-600">Judul *</Label>
                        <Input
                          value={item.title}
                          onChange={(e) => handleItemChange(item.id, 'title', e.target.value)}
                          placeholder="e.g., Konfirmasi Peserta"
                          className="h-8 text-sm bg-white"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-600">Kategori</Label>
                        <Select
                          value={item.category}
                          onValueChange={(value) => handleItemChange(item.id, 'category', value)}
                        >
                          <SelectTrigger className="h-8 text-sm bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pre-departure">Pre-Departure</SelectItem>
                            <SelectItem value="during-trip">During Trip</SelectItem>
                            <SelectItem value="post-trip">Post-Trip</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium text-gray-600">Deskripsi</Label>
                      <Input
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        placeholder="Deskripsi singkat..."
                        className="h-8 text-sm bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-600">Prioritas</Label>
                        <Select
                          value={item.priority}
                          onValueChange={(value) => handleItemChange(item.id, 'priority', value)}
                        >
                          <SelectTrigger className="h-8 text-sm bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-gray-600">Hari Sebelum Keberangkatan</Label>
                        <Input
                          type="number"
                          value={item.days_before_departure || ''}
                          onChange={(e) => handleItemChange(item.id, 'days_before_departure',
                            e.target.value ? parseInt(e.target.value) : null
                          )}
                          placeholder="e.g., 7"
                          className="h-8 text-sm bg-white"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}

              {items.length === 0 && (
                <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg bg-gray-50/50">
                  <Plus className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm font-medium">Belum ada item</p>
                  <p className="text-xs mt-1">Klik "Tambah Item" untuk memulai</p>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : initialData ? 'Update' : 'Buat Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
