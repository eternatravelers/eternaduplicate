import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Plus, Trash2, MapPin, Clock, GripVertical, AlertCircle, CheckCircle2, Route } from 'lucide-react'
import { useBusRouteStops, useBulkSaveBusRouteStops, type BusRouteStop } from '@/hooks/useBusRouteStops'
import { useMeetingPoints } from '@/hooks/useMeetingPoints'

interface StopDraft {
  tempId: string
  meeting_point_id: string | null
  meeting_point_name: string
  arrival_time: string
  departure_time: string
  notes: string
}

interface BusRouteStopsManagerProps {
  isOpen: boolean
  onClose: () => void
  resourceScheduleId: string
  busPlateNumber?: string
  tripName?: string
  onSaved?: () => void
}

function generateTempId() {
  return Math.random().toString(36).slice(2)
}

export function BusRouteStopsManager({
  isOpen,
  onClose,
  resourceScheduleId,
  busPlateNumber,
  tripName,
  onSaved
}: BusRouteStopsManagerProps) {
  const { stops, loading: stopsLoading, refetch } = useBusRouteStops(resourceScheduleId)
  const { bulkSave, loading: saving } = useBulkSaveBusRouteStops()
  const { meetingPoints } = useMeetingPoints()

  const [draftStops, setDraftStops] = useState<StopDraft[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setSaved(false)
      setError(null)
      if (stops.length > 0) {
        setDraftStops(stops.map(s => ({
          tempId: s.id,
          meeting_point_id: s.meeting_point_id,
          meeting_point_name: s.meeting_point_name,
          arrival_time: s.arrival_time,
          departure_time: s.departure_time || '',
          notes: s.notes || ''
        })))
      } else {
        setDraftStops([])
      }
    }
  }, [isOpen, stops])

  const addStop = () => {
    setDraftStops(prev => [...prev, {
      tempId: generateTempId(),
      meeting_point_id: null,
      meeting_point_name: '',
      arrival_time: '',
      departure_time: '',
      notes: ''
    }])
  }

  const removeStop = (tempId: string) => {
    setDraftStops(prev => prev.filter(s => s.tempId !== tempId))
  }

  const updateStop = (tempId: string, field: keyof StopDraft, value: string | null) => {
    setDraftStops(prev => prev.map(s => {
      if (s.tempId !== tempId) return s
      if (field === 'meeting_point_id') {
        const mp = meetingPoints.find(m => m.id === value)
        return {
          ...s,
          meeting_point_id: value,
          meeting_point_name: mp?.name || s.meeting_point_name
        }
      }
      return { ...s, [field]: value ?? '' }
    }))
  }

  const moveStop = (index: number, direction: 'up' | 'down') => {
    setDraftStops(prev => {
      const next = [...prev]
      const swapIdx = direction === 'up' ? index - 1 : index + 1
      if (swapIdx < 0 || swapIdx >= next.length) return prev
      const temp = next[index]
      next[index] = next[swapIdx]
      next[swapIdx] = temp
      return next
    })
  }

  const validateTimes = () => {
    for (let i = 1; i < draftStops.length; i++) {
      const prev = draftStops[i - 1]
      const curr = draftStops[i]
      if (prev.arrival_time && curr.arrival_time) {
        if (curr.arrival_time <= prev.arrival_time) {
          return `Stop ${i + 1} (${curr.meeting_point_name || 'Stop ' + (i + 1)}) harus lebih lambat dari stop sebelumnya`
        }
      }
    }
    return null
  }

  const handleSave = async () => {
    setError(null)

    for (const s of draftStops) {
      if (!s.meeting_point_name.trim()) {
        setError('Semua stop harus memiliki nama meeting point')
        return
      }
      if (!s.arrival_time) {
        setError('Semua stop harus memiliki waktu tiba')
        return
      }
    }

    const timeError = validateTimes()
    if (timeError) {
      setError(timeError)
      return
    }

    const stopsToSave = draftStops.map((s, i) => ({
      resource_schedule_id: resourceScheduleId,
      meeting_point_id: s.meeting_point_id,
      meeting_point_name: s.meeting_point_name.trim(),
      stop_order: i + 1,
      arrival_time: s.arrival_time,
      departure_time: s.departure_time || null,
      notes: s.notes || null
    }))

    const { error: saveError } = await bulkSave(resourceScheduleId, stopsToSave)
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Route className="h-5 w-5 text-blue-600" />
            <span>Setup Rute Bus</span>
          </DialogTitle>
          {(busPlateNumber || tripName) && (
            <div className="flex gap-2 mt-1">
              {busPlateNumber && <Badge variant="outline">{busPlateNumber}</Badge>}
              {tripName && <Badge variant="secondary">{tripName}</Badge>}
            </div>
          )}
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
              <AlertDescription className="text-green-700">Rute berhasil disimpan!</AlertDescription>
            </Alert>
          )}

          <div className="text-sm text-gray-500">
            Tambahkan titik-titik jemput secara berurutan. Bus akan melewati setiap stop sesuai urutannya.
          </div>

          {stopsLoading ? (
            <div className="animate-pulse space-y-3">
              {[1, 2].map(i => <div key={i} className="h-20 bg-gray-100 rounded-lg" />)}
            </div>
          ) : (
            <div className="space-y-3">
              {draftStops.map((stop, index) => (
                <div
                  key={stop.tempId}
                  className="border rounded-lg p-4 bg-white shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-gray-300" />
                      <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-xs font-semibold">
                        Stop {index + 1}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {index > 0 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveStop(index, 'up')}
                          className="h-7 px-2 text-xs"
                        >
                          &uarr;
                        </Button>
                      )}
                      {index < draftStops.length - 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => moveStop(index, 'down')}
                          className="h-7 px-2 text-xs"
                        >
                          &darr;
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStop(stop.tempId)}
                        className="h-7 px-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                        Meeting Point *
                      </Label>
                      <Select
                        value={stop.meeting_point_id || 'manual'}
                        onValueChange={(val) => updateStop(stop.tempId, 'meeting_point_id', val === 'manual' ? null : val)}
                      >
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue placeholder="Pilih meeting point" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manual">Input manual</SelectItem>
                          {meetingPoints.filter(mp => mp.is_active).map(mp => (
                            <SelectItem key={mp.id} value={mp.id}>{mp.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {(!stop.meeting_point_id || stop.meeting_point_id === 'manual') && (
                        <Input
                          placeholder="Nama meeting point..."
                          value={stop.meeting_point_name}
                          onChange={(e) => updateStop(stop.tempId, 'meeting_point_name', e.target.value)}
                          className="h-8 text-sm"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-green-500" />
                          Jam Tiba *
                        </Label>
                        <Input
                          type="time"
                          value={stop.arrival_time}
                          onChange={(e) => updateStop(stop.tempId, 'arrival_time', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-orange-500" />
                          Jam Berangkat
                        </Label>
                        <Input
                          type="time"
                          value={stop.departure_time}
                          onChange={(e) => updateStop(stop.tempId, 'departure_time', e.target.value)}
                          className="h-8 text-sm"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs">Catatan</Label>
                      <Textarea
                        placeholder="Catatan untuk stop ini..."
                        value={stop.notes}
                        onChange={(e) => updateStop(stop.tempId, 'notes', e.target.value)}
                        rows={1}
                        className="text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addStop}
                className="w-full border-dashed border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Stop
              </Button>
            </div>
          )}

          {draftStops.length > 1 && (
            <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600 space-y-1">
              <div className="font-medium text-gray-700">Ringkasan Rute:</div>
              {draftStops.map((s, i) => (
                <div key={s.tempId} className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="font-medium">{s.meeting_point_name || '(belum diisi)'}</span>
                  {s.arrival_time && (
                    <span className="text-gray-400">— tiba {s.arrival_time}</span>
                  )}
                  {s.departure_time && (
                    <span className="text-gray-400">, berangkat {s.departure_time}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-2 border-t">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Menyimpan...' : 'Simpan Rute'}
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
