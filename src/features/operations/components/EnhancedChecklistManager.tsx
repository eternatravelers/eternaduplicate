import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  CheckSquare, Clock, AlertTriangle, CheckCircle, User, Calendar,
  MessageSquare, History, Filter, MoreVertical, Edit2, Trash2, UserPlus,
  Check, X, CalendarClock, AlertCircle
} from 'lucide-react'
import {
  useChecklists,
  useUpdateChecklist,
  useInitializeDefaultChecklist,
  useChecklistComments,
  useAddChecklistComment,
  useChecklistHistory,
  useBulkChecklistOperations,
  useAssignChecklist,
  useUpdateChecklistNotes
} from '@/hooks/useChecklists'
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
import { formatDistanceToNow, format, isPast, isFuture } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

interface EnhancedChecklistManagerProps {
  tripId: string
  tripName: string
  tripDepartureDate?: string
}

export function EnhancedChecklistManager({ tripId, tripName, tripDepartureDate }: EnhancedChecklistManagerProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterAssignedToMe, setFilterAssignedToMe] = useState(false)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [selectedChecklistForDetails, setSelectedChecklistForDetails] = useState<any>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [editingNotes, setEditingNotes] = useState(false)
  const [notesValue, setNotesValue] = useState('')

  const filterOptions = {
    status: filterStatus === 'all' ? undefined : filterStatus,
    assignedToMe: filterAssignedToMe
  }

  const { checklists, loading, refetch } = useChecklists(tripId, filterOptions)
  const { toggleChecklistItem, updateChecklist, loading: updating } = useUpdateChecklist()
  const { initializeDefaultChecklist, loading: initializing } = useInitializeDefaultChecklist()
  const { bulkComplete, bulkAssign } = useBulkChecklistOperations()
  const { assignChecklist } = useAssignChecklist()
  const { updateNotes } = useUpdateChecklistNotes()
  const { addComment } = useAddChecklistComment()
  const { comments, refetch: refetchComments } = useChecklistComments(selectedChecklistForDetails?.id || '')
  const { history } = useChecklistHistory(selectedChecklistForDetails?.id || '')

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

  const handleToggleSelection = (id: string) => {
    const newSelection = new Set(selectedItems)
    if (newSelection.has(id)) {
      newSelection.delete(id)
    } else {
      newSelection.add(id)
    }
    setSelectedItems(newSelection)
    setShowBulkActions(newSelection.size > 0)
  }

  const handleBulkComplete = async () => {
    const { error } = await bulkComplete(Array.from(selectedItems))
    if (!error) {
      setSelectedItems(new Set())
      setShowBulkActions(false)
      refetch()
    }
  }

  const handleShowDetails = (checklist: any) => {
    setSelectedChecklistForDetails(checklist)
    setNotesValue(checklist.notes || '')
    setEditingNotes(false)
    setShowDetailsDialog(true)
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
    const isSelected = selectedItems.has(item.id)
    const hasNotes = item.notes && item.notes.trim().length > 0
    const isOverdue = item.status === 'overdue'

    return (
      <div
        key={item.id}
        className={`flex items-start space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
          isOverdue ? 'border-red-200 bg-red-50' : ''
        } ${isSelected ? 'bg-blue-50 border-blue-300' : ''}`}
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
              </div>
              <p className={`text-sm mb-2 ${item.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                {item.description}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {getPriorityBadge(item.priority)}
                {getStatusBadge(item.status)}
                {item.deadline_date && getDeadlineBadge(item.deadline_date)}
                {item.assigned_to && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>Assigned</span>
                  </Badge>
                )}
                {hasNotes && (
                  <Badge variant="outline" className="flex items-center space-x-1">
                    <Edit2 className="h-3 w-3" />
                    <span>Notes</span>
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {showBulkActions && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => handleToggleSelection(item.id)}
                />
              )}
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
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Notes
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleShowDetails(item)}>
                    <History className="h-4 w-4 mr-2" />
                    Lihat History
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleSelection(item.id)}>
                    {isSelected ? (
                      <>
                        <X className="h-4 w-4 mr-2" />
                        Batalkan Pilih
                      </>
                    ) : (
                      <>
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Pilih Item
                      </>
                    )}
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
                Inisialisasi checklist default untuk trip ini
              </p>
              <Button
                onClick={handleInitializeChecklist}
                disabled={initializing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {initializing ? 'Menginisialisasi...' : 'Inisialisasi Checklist'}
              </Button>
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

      {/* Filters and bulk actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex gap-2 flex-wrap">
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
              <Button
                variant={filterAssignedToMe ? 'default' : 'outline'}
                onClick={() => setFilterAssignedToMe(!filterAssignedToMe)}
                size="sm"
              >
                <User className="h-4 w-4 mr-2" />
                Tugas Saya
              </Button>
              <Button
                variant={showBulkActions ? 'default' : 'outline'}
                onClick={() => {
                  setShowBulkActions(!showBulkActions)
                  if (showBulkActions) {
                    setSelectedItems(new Set())
                  }
                }}
                size="sm"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Mode Pilih Multiple
              </Button>
            </div>

            {showBulkActions && selectedItems.size > 0 && (
              <div className="flex gap-2">
                <Badge variant="outline" className="px-3 py-1">
                  {selectedItems.size} item terpilih
                </Badge>
                <Button size="sm" onClick={handleBulkComplete}>
                  <Check className="h-4 w-4 mr-2" />
                  Selesaikan Semua
                </Button>
                <Button size="sm" variant="outline" onClick={() => setSelectedItems(new Set())}>
                  Batalkan
                </Button>
              </div>
            )}
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
            <DialogTitle className="flex items-center space-x-2">
              <CheckSquare className="h-5 w-5" />
              <span>{selectedChecklistForDetails?.title}</span>
            </DialogTitle>
          </DialogHeader>

          {selectedChecklistForDetails && (
            <div className="space-y-6">
              {/* Details */}
              <div>
                <h4 className="font-semibold mb-2">Deskripsi</h4>
                <p className="text-sm text-gray-600">{selectedChecklistForDetails.description}</p>
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
    </div>
  )
}
