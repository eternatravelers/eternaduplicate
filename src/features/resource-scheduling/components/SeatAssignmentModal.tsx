import React, { useState, useEffect, useMemo } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Users, UserPlus, Trash2, AlertCircle, CheckCircle2, Search, Bus, RefreshCw, MapPin } from 'lucide-react'
import { useBusPassengerAssignments, useBulkSavePassengerAssignments } from '@/hooks/useBusPassengerAssignments'
import { useBusRouteStops } from '@/hooks/useBusRouteStops'
import { useParticipants } from '@/hooks/useParticipants'

type FilterMode = 'name' | 'meeting_point'

interface AssignmentDraft {
  tempId: string
  participant_id: string
  participant_name: string
  participant_slot: number
  participant_total_slots: number
  seat_number: string
  boarding_stop_id: string
  notes: string
}

interface SeatAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  resourceScheduleId: string
  tripId: string
  busPlateNumber?: string
  busCapacity?: number
  tripName?: string
  onSaved?: () => void
}

function generateTempId() {
  return Math.random().toString(36).slice(2)
}

export function SeatAssignmentModal({
  isOpen,
  onClose,
  resourceScheduleId,
  tripId,
  busPlateNumber,
  busCapacity,
  tripName,
  onSaved
}: SeatAssignmentModalProps) {
  const { assignments, loading: assignmentsLoading, refetch } = useBusPassengerAssignments(resourceScheduleId)
  const { stops, refetch: refetchStops } = useBusRouteStops(resourceScheduleId)
  const { participants: allParticipants } = useParticipants({ tripId })
  const { bulkSave, loading: saving } = useBulkSavePassengerAssignments()

  const [drafts, setDrafts] = useState<AssignmentDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState('')
  const [filterMode, setFilterMode] = useState<FilterMode>('name')
  const [selectedMeetingPoint, setSelectedMeetingPoint] = useState<string>('all')

  useEffect(() => {
    if (isOpen) {
      refetch()
      refetchStops()
      setSaved(false)
      setError(null)
      setSearch('')
      setFilterMode('name')
      setSelectedMeetingPoint('all')
      setDrafts([])
    }
  }, [isOpen])

  useEffect(() => {
    if (isOpen && assignments.length > 0) {
      const slotCountByParticipant: Record<string, number> = {}
      assignments.forEach(a => {
        slotCountByParticipant[a.participant_id] = (slotCountByParticipant[a.participant_id] || 0) + 1
      })
      const slotIndexByParticipant: Record<string, number> = {}
      setDrafts(assignments.map(a => {
        slotIndexByParticipant[a.participant_id] = (slotIndexByParticipant[a.participant_id] || 0) + 1
        return {
          tempId: a.id,
          participant_id: a.participant_id,
          participant_name: a.participants?.full_name || '',
          participant_slot: slotIndexByParticipant[a.participant_id],
          participant_total_slots: slotCountByParticipant[a.participant_id],
          seat_number: a.seat_number || '',
          boarding_stop_id: a.boarding_stop_id || '',
          notes: a.notes || ''
        }
      }))
    }
  }, [assignments])

  const activeParticipants = useMemo(() => allParticipants, [allParticipants])

  const assignedParticipantIds = useMemo(() =>
    new Set(drafts.map(d => d.participant_id)),
    [drafts]
  )

  const uniqueMeetingPoints = useMemo(() => {
    const seen = new Set<string>()
    const points: string[] = []
    for (const p of activeParticipants) {
      if (p.meeting_point_details && !seen.has(p.meeting_point_details)) {
        seen.add(p.meeting_point_details)
        points.push(p.meeting_point_details)
      }
    }
    return points.sort()
  }, [activeParticipants])

  const unassignedParticipants = useMemo(() => {
    return activeParticipants.filter(p => {
      if (assignedParticipantIds.has(p.id)) return false
      if (filterMode === 'name') {
        return search === '' || p.full_name.toLowerCase().includes(search.toLowerCase())
      } else {
        const matchesMp = selectedMeetingPoint === 'all' || p.meeting_point_details === selectedMeetingPoint
        const matchesSearch = search === '' || p.full_name.toLowerCase().includes(search.toLowerCase())
        return matchesMp && matchesSearch
      }
    })
  }, [activeParticipants, assignedParticipantIds, filterMode, search, selectedMeetingPoint])

  const addParticipant = (participantId: string) => {
    const p = activeParticipants.find(ap => ap.id === participantId)
    if (!p) return
    const count = p.participant_count || 1
    const existingSeatNumbers = drafts.map(d => parseInt(d.seat_number)).filter(n => !isNaN(n))
    let nextSeat = existingSeatNumbers.length > 0 ? Math.max(...existingSeatNumbers) + 1 : 1
    const newSlots = Array.from({ length: count }, (_, i) => ({
      tempId: generateTempId(),
      participant_id: participantId,
      participant_name: p.full_name,
      participant_slot: i + 1,
      participant_total_slots: count,
      seat_number: String(nextSeat + i),
      boarding_stop_id: '',
      notes: ''
    }))
    setDrafts(prev => [...prev, ...newSlots])
  }

  const removeParticipant = (participantId: string) => {
    setDrafts(prev => prev.filter(d => d.participant_id !== participantId))
  }

  const updateDraft = (tempId: string, field: keyof AssignmentDraft, value: string) => {
    setDrafts(prev => prev.map(d => d.tempId === tempId ? { ...d, [field]: value } : d))
  }

  const autoAssign = () => {
    const unassigned = activeParticipants.filter(p => !assignedParticipantIds.has(p.id))
    const existingSeatNumbers = drafts.map(d => parseInt(d.seat_number)).filter(n => !isNaN(n))
    let nextSeat = existingSeatNumbers.length > 0 ? Math.max(...existingSeatNumbers) + 1 : 1
    const newDrafts: AssignmentDraft[] = []
    for (const p of unassigned) {
      const count = p.participant_count || 1
      for (let i = 0; i < count; i++) {
        newDrafts.push({
          tempId: generateTempId(),
          participant_id: p.id,
          participant_name: p.full_name,
          participant_slot: i + 1,
          participant_total_slots: count,
          seat_number: String(nextSeat),
          boarding_stop_id: '',
          notes: ''
        })
        nextSeat++
      }
    }
    setDrafts(prev => [...prev, ...newDrafts])
  }

  const handleSave = async () => {
    setError(null)

    const { error: saveError } = await bulkSave(
      resourceScheduleId,
      drafts.map(d => ({
        participant_id: d.participant_id,
        seat_number: d.seat_number || null,
        boarding_stop_id: d.boarding_stop_id || null,
        notes: d.notes || null
      }))
    )

    if (saveError) {
      setError(saveError)
      return
    }

    setSaved(true)
    await refetch()
    onSaved?.()
    setTimeout(() => {
      onClose()
      setSaved(false)
    }, 800)
  }

  const assignedCount = drafts.length
  const assignedRegistrants = useMemo(() => {
    const seen = new Set<string>()
    drafts.forEach(d => seen.add(d.participant_id))
    return seen.size
  }, [drafts])
  const capacityPercent = busCapacity ? Math.round((assignedCount / busCapacity) * 100) : 0
  const isOverCapacity = busCapacity ? assignedCount > busCapacity : false

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Assign Penumpang ke Bus</span>
          </DialogTitle>
          <div className="flex flex-wrap gap-2 mt-1">
            {busPlateNumber && <Badge variant="outline" className="text-xs"><Bus className="h-3 w-3 mr-1" />{busPlateNumber}</Badge>}
            {tripName && <Badge variant="secondary" className="text-xs">{tripName}</Badge>}
            {busCapacity && (
              <Badge
                variant="outline"
                className={`text-xs ${isOverCapacity ? 'border-red-300 text-red-700 bg-red-50' : 'border-green-300 text-green-700 bg-green-50'}`}
              >
                {assignedCount}/{busCapacity} kursi {isOverCapacity ? '(melebihi kapasitas!)' : ''}
              </Badge>
            )}
            {assignedRegistrants > 0 && (
              <Badge variant="outline" className="text-xs border-gray-300 text-gray-500">
                {assignedRegistrants} pendaftar
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {saved && (
            <Alert className="border-green-300 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-700">Assignment berhasil disimpan!</AlertDescription>
            </Alert>
          )}

          {isOverCapacity && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Jumlah penumpang melebihi kapasitas bus ({busCapacity} kursi). Harap kurangi penumpang.</AlertDescription>
            </Alert>
          )}

          {/* Add Participants Section */}
          <div className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-sm font-semibold text-gray-700">Tambah Penumpang</Label>
              {unassignedParticipants.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={autoAssign}
                  className="h-7 text-xs gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Auto Assign Semua
                </Button>
              )}
            </div>

            {/* Filter mode toggle */}
            <div className="flex gap-1 mb-2 p-0.5 bg-gray-200 rounded-md w-fit">
              <button
                type="button"
                onClick={() => { setFilterMode('name'); setSearch('') }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  filterMode === 'name'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Search className="h-3 w-3" />
                Cari Nama
              </button>
              <button
                type="button"
                onClick={() => { setFilterMode('meeting_point'); setSearch('') }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all ${
                  filterMode === 'meeting_point'
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MapPin className="h-3 w-3" />
                Meeting Point
              </button>
            </div>

            {/* Search / filter inputs */}
            {filterMode === 'name' ? (
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  placeholder="Cari nama peserta..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-8 pl-8 text-sm"
                />
              </div>
            ) : (
              <div className="space-y-2 mb-2">
                <Select value={selectedMeetingPoint} onValueChange={setSelectedMeetingPoint}>
                  <SelectTrigger className="h-8 text-sm bg-white">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                      <SelectValue placeholder="Pilih meeting point..." />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="text-gray-600">Semua Meeting Point</span>
                    </SelectItem>
                    {uniqueMeetingPoints.map(mp => {
                      const count = activeParticipants.filter(
                        p => p.meeting_point_details === mp && !assignedParticipantIds.has(p.id)
                      ).length
                      return (
                        <SelectItem key={mp} value={mp}>
                          <div className="flex items-center justify-between gap-3 w-full">
                            <span>{mp}</span>
                            {count > 0 && (
                              <span className="text-xs text-gray-400 ml-2">{count} belum assign</span>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
                  <Input
                    placeholder="Saring nama dalam meeting point..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 pl-8 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="max-h-36 overflow-y-auto space-y-1">
              {unassignedParticipants.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-2">
                  {search || selectedMeetingPoint !== 'all' ? 'Tidak ada peserta yang cocok' : 'Semua peserta sudah di-assign'}
                </div>
              ) : (
                unassignedParticipants.map(p => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between py-1.5 px-2 bg-white rounded border text-sm hover:bg-blue-50 cursor-pointer transition-colors"
                    onClick={() => addParticipant(p.id)}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="font-medium text-gray-800 truncate">{p.full_name}</span>
                      {(p.participant_count || 1) > 1 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0 flex-shrink-0 bg-amber-100 text-amber-700 border-amber-200">
                          {p.participant_count} orang
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {p.meeting_point_details && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <MapPin className="h-3 w-3" />
                          {p.meeting_point_details}
                        </span>
                      )}
                      <UserPlus className="h-3.5 w-3.5 text-blue-500" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Assigned Passengers */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-gray-700">
                Penumpang Assigned ({assignedCount} kursi{assignedRegistrants !== assignedCount ? `, ${assignedRegistrants} pendaftar` : ''})
              </Label>
              {busCapacity && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${isOverCapacity ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(capacityPercent, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{capacityPercent}%</span>
                </div>
              )}
            </div>

            {assignmentsLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded" />)}
              </div>
            ) : drafts.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm border-2 border-dashed rounded-lg">
                Belum ada penumpang. Klik nama peserta di atas untuk menambahkan.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {drafts.map((draft, index) => {
                  const isFirstSlot = draft.participant_slot === 1
                  return (
                    <div
                      key={draft.tempId}
                      className={`border rounded-lg p-3 bg-white flex items-start gap-3 ${!isFirstSlot ? 'border-l-4 border-l-amber-300 ml-4' : ''}`}
                    >
                      <div className="flex items-center justify-center w-7 h-7 bg-blue-50 rounded-full text-blue-700 font-bold text-xs flex-shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm text-gray-800">{draft.participant_name}</span>
                          {draft.participant_total_slots > 1 && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50">
                              peserta {draft.participant_slot}/{draft.participant_total_slots}
                            </Badge>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">No. Kursi</Label>
                            <Input
                              value={draft.seat_number}
                              onChange={(e) => updateDraft(draft.tempId, 'seat_number', e.target.value)}
                              placeholder="mis. 1, 2A, dll"
                              className="h-7 text-xs"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs text-gray-500">Naik di Stop</Label>
                            <Select
                              value={draft.boarding_stop_id || 'none'}
                              onValueChange={(val) => updateDraft(draft.tempId, 'boarding_stop_id', val === 'none' ? '' : val)}
                            >
                              <SelectTrigger className="h-7 text-xs">
                                <SelectValue placeholder="Pilih stop" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">-</SelectItem>
                                {stops.map(s => (
                                  <SelectItem key={s.id} value={s.id}>
                                    Stop {s.stop_order}: {s.meeting_point_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                      {isFirstSlot && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParticipant(draft.participant_id)}
                          className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                          title={`Hapus semua ${draft.participant_total_slots} slot untuk ${draft.participant_name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!isFirstSlot && <div className="w-7 flex-shrink-0" />}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2 border-t">
            <Button
              onClick={handleSave}
              disabled={saving || isOverCapacity}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Menyimpan...' : 'Simpan Assignment'}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Batal
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
