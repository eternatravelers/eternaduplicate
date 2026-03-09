import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, CheckSquare, FileText, Copy, CreditCard as Edit2, Trash2, MoreVertical, ListChecks } from 'lucide-react'
import {
  useChecklistTemplates,
  useDeleteChecklistTemplate,
  useDuplicateChecklistTemplate
} from '@/hooks/useChecklistTemplates'
import { ChecklistTemplateFormModal } from '../components/ChecklistTemplateFormModal'

export function ChecklistTemplatesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)

  const { templates, loading, refetch } = useChecklistTemplates()
  const { deleteTemplate, loading: deleting } = useDeleteChecklistTemplate()
  const { duplicateTemplate, loading: duplicating } = useDuplicateChecklistTemplate()

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalItems = templates.reduce((sum, t) => sum + (t.items?.length || 0), 0)
  const avgItemsPerTemplate = templates.length > 0 ? Math.round(totalItems / templates.length) : 0
  const mostUsedTemplate = templates.reduce((prev, current) =>
    (current.usage_count || 0) > (prev.usage_count || 0) ? current : prev
  , templates[0])

  const handleEdit = (template: any) => {
    setSelectedTemplate(template)
    setIsEditModalOpen(true)
  }

  const handleDuplicate = async (template: any) => {
    const newName = `${template.name} (Copy)`
    const { error } = await duplicateTemplate(template.id, newName)
    if (!error) {
      refetch()
    }
  }

  const handleDeleteClick = (templateId: string) => {
    setTemplateToDelete(templateId)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!templateToDelete) return

    const { error } = await deleteTemplate(templateToDelete)
    if (!error) {
      refetch()
    }
    setDeleteConfirmOpen(false)
    setTemplateToDelete(null)
  }

  const handleFormSuccess = () => {
    setIsCreateModalOpen(false)
    setIsEditModalOpen(false)
    setSelectedTemplate(null)
    refetch()
  }

  const getCategoryBadge = (category: string | null) => {
    const categoryMap: Record<string, { label: string; color: string }> = {
      general: { label: 'Umum', color: 'bg-blue-100 text-blue-800' },
      international: { label: 'International', color: 'bg-sky-100 text-sky-800' },
      domestic: { label: 'Domestik', color: 'bg-green-100 text-green-800' },
      adventure: { label: 'Adventure', color: 'bg-orange-100 text-orange-800' }
    }

    const cat = categoryMap[category || 'general']
    return <Badge className={cat.color}>{cat.label}</Badge>
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Template Checklist</h1>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Template Checklist Operasional</h1>
          <p className="text-gray-600 mt-2">Kelola template checklist untuk mempercepat setup trip</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Buat Template
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Template
            </CardTitle>
            <ListChecks className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates.length}</div>
            <p className="text-xs text-gray-500">Template aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Item
            </CardTitle>
            <CheckSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-gray-500">Checklist items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Rata-rata Item
            </CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgItemsPerTemplate}</div>
            <p className="text-xs text-gray-500">Per template</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Paling Sering Digunakan
            </CardTitle>
            <Copy className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mostUsedTemplate?.usage_count || 0}x</div>
            <p className="text-xs text-gray-500 truncate">{mostUsedTemplate?.name || '-'}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Template</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Cari template..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ListChecks className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">Belum ada template</p>
              <p className="text-sm">Buat template pertama Anda untuk memulai</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Template</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-center">Jumlah Item</TableHead>
                  <TableHead className="text-center">Digunakan</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-gray-600">
                      {template.description || '-'}
                    </TableCell>
                    <TableCell>{getCategoryBadge(template.category)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{template.items?.length || 0} item</Badge>
                    </TableCell>
                    <TableCell className="text-center text-gray-600">
                      {template.usage_count || 0}x
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(template)}>
                            <Edit2 className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(template)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplikat
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(template.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ChecklistTemplateFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleFormSuccess}
        title="Buat Template Baru"
      />

      <ChecklistTemplateFormModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedTemplate(null)
        }}
        onSuccess={handleFormSuccess}
        initialData={selectedTemplate}
        title="Edit Template"
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Template akan dihapus permanen. Checklist yang sudah dibuat dari template ini tidak akan terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleting}
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
