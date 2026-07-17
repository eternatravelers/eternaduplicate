import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
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

  const getPriorityBadge = (priority: string) => {
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    }
    return <Badge className={colors[priority as keyof typeof colors]}>{priority}</Badge>
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
              {items.map((item, index) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-600">Item #{index + 1}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(item.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Judul *</Label>
                      <Input
                        value={item.title}
                        onChange={(e) => handleItemChange(item.id, 'title', e.target.value)}
                        placeholder="e.g., Konfirmasi Peserta"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Kategori</Label>
                      <Select
                        value={item.category}
                        onValueChange={(value) => handleItemChange(item.id, 'category', value)}
                      >
                        <SelectTrigger>
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

                  <div className="space-y-2">
                    <Label>Deskripsi</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                      placeholder="Deskripsi singkat..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Prioritas</Label>
                      <Select
                        value={item.priority}
                        onValueChange={(value) => handleItemChange(item.id, 'priority', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Hari Sebelum Keberangkatan</Label>
                      <Input
                        type="number"
                        value={item.days_before_departure || ''}
                        onChange={(e) => handleItemChange(item.id, 'days_before_departure',
                          e.target.value ? parseInt(e.target.value) : null
                        )}
                        placeholder="e.g., 7"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-8 text-gray-500 border-2 border-dashed rounded-lg">
                  <p className="text-sm">Belum ada item. Klik "Tambah Item" untuk memulai.</p>
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
