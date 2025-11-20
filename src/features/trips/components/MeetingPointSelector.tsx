import React, { useState, useEffect } from 'react'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { MapPin, Navigation, Star } from 'lucide-react'
import { useMeetingPoints } from '@/hooks/useMeetingPoints'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface MeetingPointSelectorProps {
  selectedMeetingPointIds: string[]
  primaryMeetingPointId?: string
  onChange: (selectedIds: string[], primaryId?: string) => void
}

export function MeetingPointSelector({
  selectedMeetingPointIds,
  primaryMeetingPointId,
  onChange
}: MeetingPointSelectorProps) {
  const { meetingPoints, loading } = useMeetingPoints()
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedMeetingPointIds)
  const [localPrimaryId, setLocalPrimaryId] = useState<string | undefined>(primaryMeetingPointId)

  useEffect(() => {
    setLocalSelectedIds(selectedMeetingPointIds)
  }, [selectedMeetingPointIds])

  useEffect(() => {
    setLocalPrimaryId(primaryMeetingPointId)
  }, [primaryMeetingPointId])

  const handleToggleMeetingPoint = (id: string, checked: boolean) => {
    let newSelectedIds: string[]
    let newPrimaryId = localPrimaryId

    if (checked) {
      newSelectedIds = [...localSelectedIds, id]
      if (newSelectedIds.length === 1) {
        newPrimaryId = id
      }
    } else {
      newSelectedIds = localSelectedIds.filter(mpId => mpId !== id)
      if (newPrimaryId === id) {
        newPrimaryId = newSelectedIds[0] || undefined
      }
    }

    setLocalSelectedIds(newSelectedIds)
    setLocalPrimaryId(newPrimaryId)
    onChange(newSelectedIds, newPrimaryId)
  }

  const handleSetPrimary = (id: string) => {
    setLocalPrimaryId(id)
    onChange(localSelectedIds, id)
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Meeting Points</Label>
        <div className="animate-pulse h-32 bg-gray-100 rounded-lg"></div>
      </div>
    )
  }

  if (meetingPoints.length === 0) {
    return (
      <div className="space-y-2">
        <Label>Meeting Points</Label>
        <Alert>
          <Navigation className="h-4 w-4" />
          <AlertDescription>
            Belum ada meeting point tersedia. Silakan tambahkan meeting point di menu <strong>Master Meeting Points</strong> terlebih dahulu.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-base font-semibold flex items-center space-x-2">
          <Navigation className="h-4 w-4" />
          <span>Meeting Points untuk Trip</span>
        </Label>
        <p className="text-sm text-gray-600 mt-1">
          Pilih satu atau lebih meeting point yang tersedia untuk trip ini. Tandai satu sebagai meeting point utama.
        </p>
      </div>

      {localSelectedIds.length === 0 && (
        <Alert variant="destructive">
          <MapPin className="h-4 w-4" />
          <AlertDescription>
            Minimal pilih satu meeting point untuk trip ini.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {meetingPoints.map((mp) => {
          const isSelected = localSelectedIds.includes(mp.id)
          const isPrimary = localPrimaryId === mp.id

          return (
            <Card
              key={mp.id}
              className={`transition-all ${
                isSelected
                  ? isPrimary
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-green-300 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleToggleMeetingPoint(mp.id, checked as boolean)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-sm truncate">{mp.name}</h4>
                      {isPrimary && (
                        <Badge variant="default" className="text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    {mp.address && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        <MapPin className="h-3 w-3 inline mr-1" />
                        {mp.address}
                      </p>
                    )}
                    {isSelected && !isPrimary && (
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                        onClick={() => handleSetPrimary(mp.id)}
                      >
                        Jadikan Primary
                      </button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
