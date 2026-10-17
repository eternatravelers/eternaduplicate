import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface TimePickerProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  label?: string
}

export function TimePicker({ value, onChange, disabled, label }: TimePickerProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  return (
    <div className="space-y-1">
      {label && <Label className="text-sm font-medium text-gray-700">{label}</Label>}
      <Input
        type="time"
        value={value || '06:00'}
        onChange={handleChange}
        disabled={disabled}
        className="w-full"
      />
    </div>
  )
}
