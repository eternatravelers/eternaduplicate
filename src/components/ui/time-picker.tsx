import React from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  label?: string
}

export function TimePicker({ value, onChange, disabled, label }: TimePickerProps) {
  // Parse current value (format: HH:mm)
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hours: '06', minutes: '00' }
    const match = timeStr.match(/(\d{1,2}):(\d{2})/)
    if (match) {
      return {
        hours: match[1].padStart(2, '0'),
        minutes: match[2]
      }
    }
    return { hours: '06', minutes: '00' }
  }

  const current = parseTime(value)

  const handleTimeChange = (type: 'hours' | 'minutes', newValue: string) => {
    const hours = type === 'hours' ? newValue : current.hours
    const minutes = type === 'minutes' ? newValue : current.minutes
    onChange(`${hours}:${minutes}`)
  }

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
  const minutes = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-700 block mb-1">Jam</label>
        <Select value={current.hours} onValueChange={(v) => handleTimeChange('hours', v)} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-64">
            {hours.map(h => (
              <SelectItem key={h} value={h}>{h}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-700 block mb-1">Menit</label>
        <Select value={current.minutes} onValueChange={(v) => handleTimeChange('minutes', v)} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {minutes.map(m => (
              <SelectItem key={m} value={m}>{m}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
