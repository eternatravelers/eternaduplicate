import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CheckSquare, Clock, AlertTriangle, CheckCircle, User, Calendar,
  MessageSquare, History, Filter, MoreVertical, Edit2, Trash2, UserPlus,
  Check, X, CalendarClock, AlertCircle, Plus, FileText
} from 'lucide-react'
import {
  useChecklists,
  useUpdateChecklist,
  useInitializeDefaultChecklist,
  useChecklistComments,
  useAddChecklistComment,
  useChecklistHistory,
  useCreateChecklist,
  useDeleteChecklist,
  useUpdateChecklistNotes
} from '@/hooks/useChecklists'
import { useChecklistTemplates, useApplyChecklistTemplate } from '@/hooks/useChecklistTemplates'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { formatDistanceToNow, format, isPast, isFuture } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface EnhancedChecklistManagerProps {
  tripId: string
  tripName: string
  tripDepartureDate?: string
}

export function EnhancedChecklistManager({ tripId, tripName, tripDepartureDate }: EnhancedChecklistManagerProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [selectedChecklistForDetails, setSelectedChecklistForDetails] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')
  const [showAddForm, setShowAddForm] = useState<string | null>(null)
  const [editingChecklist, setEditingChecklist] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [checklistToDelete, setChecklistToDelete] = useState<string | null>(null)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [newChecklistForm, setNewChecklistForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    days_before_departure: '',
    deadline_date: ''
  })
  const [editChecklistForm, setEditChecklistForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as 'high' | 'medium' | 'low',
    days_before_departure: '',
    deadline_date: ''
  })

  const filterOptions = useMemo(() => ({
    status: filterStatus === 'all' ? undefined : filterStatus,
  }), [filterStatus])

  const { checklists, loading, refetch } = useChecklists(tripId, filterOptions)
  const { toggleChecklistItem, updateChecklist, loading: updating } = useUpdateChecklist()
  const { initializeDefaultChecklist, loading: initializing } = useInitializeDefaultChecklist()
  const { createChecklist, loading: creating } = useCreateChecklist()
  const { deleteChecklist, loading: deleting } = useDeleteChecklist()
  const { updateNotes } = useUpdateChecklistNotes()
  const { addComment } = useAddChecklistComment()
  const { comments, refetch: refetchComments } = useChecklistComments(selectedChecklistForDetails?.id || '')
  const { history } = useChecklistHistory(selectedChecklistForDetails?.id || '')
  const { templates } = useChecklistTemplates()
  const { applyTemplate, loading: applyingTemplate } = useApplyChecklistTemplate()

  const handleToggleItem = async (id: string, completed: boolean) => {
    const { error } = await toggleChecklistItem(id, !completed)
    if (!error) {
      refetch()
    }
  }

  const handleInitializeChecklist = async () => {
    const { error } = await initializeDefaultChecklist(tripId)
    if (!error) {
      refetch()
    }
  }

  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) return

    const { error } = await applyTemplate(selectedTemplateId, tripId, tripDepartureDate)
    if (!error) {
      setShowTemplateDialog(false)
      setSelectedTemplateId('')
      refetch()
    }
  }

  const handleAddChecklist = async (category: string) => {
    if (!newChecklistForm.title.trim()) return

    const checklistData: any = {
      trip_id: tripId,
      title: newChecklistForm.title,
      description: newChecklistForm.description,
      priority: newChecklistForm.priority,
      category,
      status: 'pending',
      completed: false
    }

    if (newChecklistForm.days_before_departure) {
      checklistData.days_before_departure = parseInt(newChecklistForm.days_before_departure)
    }

    if (newChecklistForm.deadline_date) {
      checklistData.deadline_date = newChecklistForm.deadline_date
    }

    const { error } = await createChecklist(checklistData)
    if (!error) {
      setNewChecklistForm({
        title: '',
        description: '',
        priority: 'medium',
        days_before_departure: '',
        deadline_date: ''
      })
      setShowAddForm(null)
      refetch()
    }
  }

  const handleDeleteClick = (id: string) => {
    setChecklistToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!checklistToDelete) return

    try {
      const result = await deleteChecklist(checklistToDelete)

      if (result.error) {
        alert(`Error menghapus checklist: ${result.error}`)
      } else {
        refetch()
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      alert(`Error: ${err}`)
    } finally {
      setDeleteConfirmOpen(false)
      setChecklistToDelete(null)
    }
  }

  const handleShowDetails = (checklist: any) => {
    setSelectedChecklistForDetails(checklist)
    setNotesValue(checklist.notes || '')
    setEditingNotes(false)
    setEditingChecklist(false)
    setEditChecklistForm({
      title: checklist.title || '',
      description: checklist.description || '',
      priority: checklist.priority || 'medium',
      days_before_departure: checklist.days_before_departure?.toString() || '',
      deadline_date: checklist.deadline_date || ''
    })
    setShowDetailsDialog(true)
  }

  const handleSaveChecklistEdit = async () => {
    if (!selectedChecklistForDetails || !editChecklistForm.title.trim()) return

    const updateData: any = {
      title: editChecklistForm.title,
      description: editChecklistForm.description,
      priority: editChecklistForm.priority,
    }

    if (editChecklistForm.days_before_departure) {
      updateData.days_before_departure = parseInt(editChecklistForm.days_before_departure)
    } else {
      updateData.days_before_departure = null
    }

    if (editChecklistForm.deadline_date) {
      updateData.deadline_date = editChecklistForm.deadline_date
    } else {
      updateData.deadline_date = null
    }

    const { error } = await updateChecklist(selectedChecklistForDetails.id, updateData)
    if (!error) {
      setEditingChecklist(false)
      refetch()
      setShowDetailsDialog(false)
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedChecklistForDetails) return

    const { error } = await addComment(selectedChecklistForDetails.id, newComment)
    if (!error) {
      setNewComment('')
      refetchComments()
    }
  }

  const handleSaveNotes = async () => {
    if (!selectedChecklistForDetails) return

    const { error } = await updateNotes(selectedChecklistForDetails.id, notesValue)
    if (!error) {
      setEditingNotes(false)
      refetch()
    }
  }

  const getChecklistByCategory = (category: 'pre-departure' | 'during-trip' | 'post-trip') => {
    return checklists.filter(item => item.category === category)
  }

  const getCompletionStats = (category: 'pre-departure' | 'during-trip' | 'post-trip') => {
    const items = getChecklistByCategory(category)
    const completed = items.filter(item => item.completed).length
    const total = items.length
    const percentage = total > 0 ? (completed / total) * 100 : 0

    return { completed, total, percentage }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Selesai</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Proses</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Terlambat</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-800"><X className="h-3 w-3 mr-1" />Batal</Badge>
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    }
  }

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Tinggi</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Sedang</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Rendah</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const getDeadlineBadge = (deadlineDate: string | null) => {
    if (!deadlineDate) return null

    const deadline = new Date(deadlineDate)
    const now = new Date()
    const isOverdue = isPast(deadline) && !isFuture(deadline)

    return (
      <div className={`flex items-center space-x-1 text-xs ${isOverdue ? 'text-red-600' : 'text-gray-600'}`}>
        <CalendarClock className="h-3 w-3" />
        <span>
          {isOverdue ? 'Terlambat ' : ''}
          {formatDistanceToNow(deadline, { addSuffix: true, locale: localeId })}
        </span>
      </div>
    )
  }

  const renderChecklistItem = (item: any) => {
    const hasNotes = item.notes && item.notes.trim().length > 0
    const isOverdue = item.status === 'overdue'

    return (
      <div
        key={item.id}
        className={`flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
          isOverdue ? 'border-red-200 bg-red-50' : ''
        }`}
      >
        <Checkbox
          checked={item.completed}
          onCheckedChange={() => handleToggleItem(item.id, item.completed)}
          disabled={updating}
          className="mt-1"
        />
        <div className="flex-1 space-y-2">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {item.title}
                </h4>
                {item.days_before_departure && (
                  <Badge variant="outline" className="text-xs">
                    H-{item.days_before_departure}
                  </Badge>
                )}
                {getPriorityBadge(item.priority)}
              </div>
              <p className={`text-sm mb-2 ${item.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                {item.description}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {getStatusBadge(item.status)}
                {item.deadline_date && getDeadlineBadge(item.deadline_date)}
                {hasNotes && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Edit2 className="h-3 w-3" />
                    <span>Notes</span>
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleShowDetails(item)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => handleDeleteClick(item.id)}
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleShowDetails(item)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Details & Komentar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShowDetails(item)}>
                    <History className="h-4 w-4 mr-2" />
                    Lihat History
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderChecklistSection = (category: 'pre-departure' | 'during-trip' | 'post-trip', title: string, icon: any) => {
    const items = getChecklistByCategory(category)
    const stats = getCompletionStats(category)
    const Icon = icon

    if (items.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Belum ada checklist</h3>
              <p className="text-sm mb-4">
                Inisialisasi checklist default atau gunakan template
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleInitializeChecklist}
                  disabled={initializing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {initializing ? 'Menginisialisasi...' : 'Inisialisasi Checklist'}
                </Button>
                <Button
                  onClick={() => setShowTemplateDialog(true)}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Gunakan Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {stats.completed}/{stats.total}
              </Badge>
              <div className="text-sm text-gray-600">
                {stats.percentage.toFixed(0)}%
              </div>
            </div>
          </div>
          <Progress value={stats.percentage} className="mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map(renderChecklistItem)}

            {/* Add new checklist form */}
            {showAddForm === category ? (
              <div className="p-4 border-2 border-dashed border-blue-300 rounded-lg bg-blue-50/50 space-y-3">
                <div>
                  <Label htmlFor="title">Judul Checklist *</Label>
                  <Input
                    id="title"
                    value={newChecklistForm.title}
                    onChange={(e) => setNewChecklistForm({ ...newChecklistForm, title: e.target.value })}
                    placeholder="Misal: Konfirmasi Bus & Sopir"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={newChecklistForm.description}
                    onChange={(e) => setNewChecklistForm({ ...newChecklistForm, description: e.target.value })}
                    placeholder="Detail tambahan tentang checklist ini"
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="priority">Prioritas</Label>
                    <Select
                      value={newChecklistForm.priority}
                      onValueChange={(value: any) => setNewChecklistForm({ ...newChecklistForm, priority: value })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high">Tinggi</SelectItem>
                        <SelectItem value="medium">Sedang</SelectItem>
                        <SelectItem value="low">Rendah</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="days">Deadline (H-X)</Label>
                    <Select
                      value={newChecklistForm.days_before_departure || 'none'}
                      onValueChange={(value) => setNewChecklistForm({ ...newChecklistForm, days_before_departure: value === 'none' ? '' : value, deadline_date: '' })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Pilih..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Tidak ada</SelectItem>
                        <SelectItem value="30">H-30</SelectItem>
                        <SelectItem value="14">H-14</SelectItem>
                        <SelectItem value="7">H-7</SelectItem>
                        <SelectItem value="3">H-3</SelectItem>
                        <SelectItem value="1">H-1</SelectItem>
                        <SelectItem value="0">Hari-H</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAddChecklist(category)}
                    disabled={creating || !newChecklistForm.title.trim()}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    {creating ? 'Menambah...' : 'Tambah'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddForm(null)
                      setNewChecklistForm({
                        title: '',
                        description: '',
                        priority: 'medium',
                        days_before_departure: '',
                        deadline_date: ''
                      })
                    }}
                    variant="outline"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Batal
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(category)}
                className="w-full border-dashed"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Checklist Baru
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  const allStats = {
    preDeparture: getCompletionStats('pre-departure'),
    duringTrip: getCompletionStats('during-trip'),
    postTrip: getCompletionStats('post-trip')
  }

  const overallCompletion = checklists.length > 0
    ? (checklists.filter(c => c.completed).length / checklists.length) * 100
    : 0

  return (
    <div className="space-y-6">
      {/* Header with overall stats */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <CheckSquare className="h-5 w-5" />
              <span>Checklist Operasional - {tripName}</span>
            </CardTitle>
            <Badge className="bg-blue-600 text-white text-lg px-4 py-1">
              {overallCompletion.toFixed(0)}% Selesai
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-blue-200">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-blue-700">
                  {allStats.preDeparture.percentage.toFixed(0)}%
                </div>
                <div className="text-sm text-blue-600 mt-1">Pre-Departure</div>
                <div className="text-xs text-gray-500 mt-1">
                  {allStats.preDeparture.completed}/{allStats.preDeparture.total} items
                </div>
              </CardContent>
            </Card>
            <Card className="border-green-200">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-700">
                  {allStats.duringTrip.percentage.toFixed(0)}%
                </div>
                <div className="text-sm text-green-600 mt-1">During Trip</div>
                <div className="text-xs text-gray-500 mt-1">
                  {allStats.duringTrip.completed}/{allStats.duringTrip.total} items
                </div>
              </CardContent>
            </Card>
            <Card className="border-purple-200">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-purple-700">
                  {allStats.postTrip.percentage.toFixed(0)}%
                </div>
                <div className="text-sm text-purple-600 mt-1">Post-Trip</div>
                <div className="text-xs text-gray-500 mt-1">
                  {allStats.postTrip.completed}/{allStats.postTrip.total} items
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="in_progress">Dalam Proses</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
                <SelectItem value="overdue">Terlambat</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Checklist sections */}
      <Tabs defaultValue="pre-departure" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pre-departure">
            <Clock className="h-4 w-4 mr-2" />
            Pre-Departure
          </TabsTrigger>
          <TabsTrigger value="during-trip">
            <CheckCircle className="h-4 w-4 mr-2" />
            During Trip
          </TabsTrigger>
          <TabsTrigger value="post-trip">
            <CheckSquare className="h-4 w-4 mr-2" />
            Post-Trip
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pre-departure">
          {renderChecklistSection('pre-departure', 'Persiapan Sebelum Keberangkatan', Clock)}
        </TabsContent>

        <TabsContent value="during-trip">
          {renderChecklistSection('during-trip', 'Selama Perjalanan', CheckCircle)}
        </TabsContent>

        <TabsContent value="post-trip">
          {renderChecklistSection('post-trip', 'Setelah Trip Selesai', CheckSquare)}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center space-x-2">
                <CheckSquare className="h-5 w-5" />
                <span>{selectedChecklistForDetails?.title}</span>
              </DialogTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditingChecklist(!editingChecklist)}
              >
                {editingChecklist ? 'Batalkan' : 'Edit Checklist'}
              </Button>
            </div>
          </DialogHeader>

          {selectedChecklistForDetails && (
            <div className="space-y-6">
              {editingChecklist ? (
                <div className="space-y-4 p-4 border rounded-lg bg-blue-50/50">
                  <div>
                    <Label htmlFor="edit-title">Judul Checklist *</Label>
                    <Input
                      id="edit-title"
                      value={editChecklistForm.title}
                      onChange={(e) => setEditChecklistForm({ ...editChecklistForm, title: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-description">Deskripsi</Label>
                    <Textarea
                      id="edit-description"
                      value={editChecklistForm.description}
                      onChange={(e) => setEditChecklistForm({ ...editChecklistForm, description: e.target.value })}
                      className="mt-1"
                      rows={2}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="edit-priority">Prioritas</Label>
                      <Select
                        value={editChecklistForm.priority}
                        onValueChange={(value: any) => setEditChecklistForm({ ...editChecklistForm, priority: value })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">Tinggi</SelectItem>
                          <SelectItem value="medium">Sedang</SelectItem>
                          <SelectItem value="low">Rendah</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-days">Deadline (H-X)</Label>
                      <Select
                        value={editChecklistForm.days_before_departure || 'none'}
                        onValueChange={(value) => setEditChecklistForm({ ...editChecklistForm, days_before_departure: value === 'none' ? '' : value, deadline_date: '' })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Pilih..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Tidak ada</SelectItem>
                          <SelectItem value="30">H-30</SelectItem>
                          <SelectItem value="14">H-14</SelectItem>
                          <SelectItem value="7">H-7</SelectItem>
                          <SelectItem value="3">H-3</SelectItem>
                          <SelectItem value="1">H-1</SelectItem>
                          <SelectItem value="0">Hari-H</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button
                    onClick={handleSaveChecklistEdit}
                    disabled={updating || !editChecklistForm.title.trim()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {updating ? 'Menyimpan...' : 'Simpan Perubahan'}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Details */}
                  <div>
                    <h4 className="font-semibold mb-2">Deskripsi</h4>
                    <p className="text-sm text-gray-600">{selectedChecklistForDetails.description || 'Tidak ada deskripsi'}</p>
                  </div>

                  {/* Status Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Status</h4>
                      {getStatusBadge(selectedChecklistForDetails.status)}
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Prioritas</h4>
                      {getPriorityBadge(selectedChecklistForDetails.priority)}
                    </div>
                  </div>

                  {/* Deadline info */}
                  {(selectedChecklistForDetails.days_before_departure || selectedChecklistForDetails.deadline_date) && (
                    <div>
                      <h4 className="font-semibold mb-2">Deadline</h4>
                      <div className="flex gap-2 items-center">
                        {selectedChecklistForDetails.days_before_departure && (
                          <Badge variant="outline">
                            H-{selectedChecklistForDetails.days_before_departure}
                          </Badge>
                        )}
                        {selectedChecklistForDetails.deadline_date && getDeadlineBadge(selectedChecklistForDetails.deadline_date)}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Notes Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">Catatan Internal</h4>
                  <Button size="sm" variant="outline" onClick={() => setEditingNotes(!editingNotes)}>
                    {editingNotes ? 'Batalkan' : 'Edit'}
                  </Button>
                </div>
                {editingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Tambahkan catatan internal..."
                      rows={4}
                    />
                    <Button size="sm" onClick={handleSaveNotes}>
                      Simpan Catatan
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded">
                    {selectedChecklistForDetails.notes || 'Belum ada catatan'}
                  </p>
                )}
              </div>

              {/* Comments Section */}
              <div>
                <h4 className="font-semibold mb-2">Komentar</h4>
                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                  {comments.length === 0 ? (
                    <p className="text-sm text-gray-500 text-center py-4">Belum ada komentar</p>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="p-3 bg-gray-50 rounded">
                        <p className="text-sm">{comment.comment}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(comment.created_at), 'dd MMM yyyy HH:mm')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Tulis komentar..."
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <Button onClick={handleAddComment}>Kirim</Button>
                </div>
              </div>

              {/* History */}
              {history.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">History Perubahan</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {history.map((entry) => (
                      <div key={entry.id} className="text-xs text-gray-600 p-2 bg-gray-50 rounded">
                        <span className="font-medium">{entry.action}</span> - {' '}
                        {format(new Date(entry.created_at), 'dd MMM yyyy HH:mm')}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Checklist?</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus checklist ini? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChecklistToDelete(null)}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Apply Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Gunakan Template Checklist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pilih Template</Label>
              <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih template..." />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name} ({template.items?.length || 0} items)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedTemplateId && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Template akan menambahkan {templates.find(t => t.id === selectedTemplateId)?.items?.length || 0} checklist items ke trip ini.
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
              Batal
            </Button>
            <Button
              onClick={handleApplyTemplate}
              disabled={!selectedTemplateId || applyingTemplate}
            >
              {applyingTemplate ? 'Menerapkan...' : 'Terapkan Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
