import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ChevronDown, ChevronUp, X, Search, Filter } from 'lucide-react'

export interface TripFilterState {
  search: string
  statuses: string[]
  dateFrom: string
  dateTo: string
  readinessLevel: 'all' | 'ready' | 'needs-attention' | 'not-ready'
  quotaStatus: 'all' | 'available' | 'almost-full' | 'full'
  sortBy: 'date-asc' | 'date-desc' | 'name-asc' | 'name-desc' | 'readiness-desc' | 'participants-desc'
}

interface TripFiltersProps {
  filters: TripFilterState
  onFiltersChange: (filters: TripFilterState) => void
  activeFiltersCount: number
}

export function TripFilters({ filters, onFiltersChange, activeFiltersCount }: TripFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'open', label: 'Open' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'ongoing', label: 'Ongoing' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const handleStatusToggle = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status]

    onFiltersChange({ ...filters, statuses: newStatuses })
  }

  const handleReset = () => {
    onFiltersChange({
      search: '',
      statuses: [],
      dateFrom: '',
      dateTo: '',
      readinessLevel: 'all',
      quotaStatus: 'all',
      sortBy: 'date-asc'
    })
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Always visible: Search and Toggle */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search trips by name..."
                value={filters.search}
                onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="default" className="ml-1">
                  {activeFiltersCount}
                </Badge>
              )}
              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="text-red-600 hover:text-red-700"
              >
                <X className="h-4 w-4 mr-1" />
                Reset
              </Button>
            )}
          </div>

          {/* Collapsible Filter Panel */}
          {isExpanded && (
            <div className="pt-4 border-t space-y-6 animate-in slide-in-from-top-2 duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Status Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Status</Label>
                  <div className="space-y-2">
                    {statusOptions.map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`status-${option.value}`}
                          checked={filters.statuses.includes(option.value)}
                          onCheckedChange={() => handleStatusToggle(option.value)}
                        />
                        <label
                          htmlFor={`status-${option.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Date Range Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Departure Date</Label>
                  <div className="space-y-2">
                    <div>
                      <Label htmlFor="date-from" className="text-xs text-gray-600">From</Label>
                      <Input
                        id="date-from"
                        type="date"
                        value={filters.dateFrom}
                        onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="date-to" className="text-xs text-gray-600">To</Label>
                      <Input
                        id="date-to"
                        type="date"
                        value={filters.dateTo}
                        onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Readiness Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Readiness Level</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'All Trips' },
                      { value: 'ready', label: 'Ready (≥80%)' },
                      { value: 'needs-attention', label: 'Needs Attention (50-79%)' },
                      { value: 'not-ready', label: 'Not Ready (<50%)' }
                    ].map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`readiness-${option.value}`}
                          name="readiness"
                          value={option.value}
                          checked={filters.readinessLevel === option.value}
                          onChange={(e) => onFiltersChange({ ...filters, readinessLevel: e.target.value as any })}
                          className="cursor-pointer"
                        />
                        <label
                          htmlFor={`readiness-${option.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quota Status Filter */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Quota Status</Label>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'All' },
                      { value: 'available', label: 'Has Availability' },
                      { value: 'almost-full', label: 'Almost Full (≥80%)' },
                      { value: 'full', label: 'Full' }
                    ].map(option => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id={`quota-${option.value}`}
                          name="quota"
                          value={option.value}
                          checked={filters.quotaStatus === option.value}
                          onChange={(e) => onFiltersChange({ ...filters, quotaStatus: e.target.value as any })}
                          className="cursor-pointer"
                        />
                        <label
                          htmlFor={`quota-${option.value}`}
                          className="text-sm cursor-pointer"
                        >
                          {option.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div className="pt-4 border-t">
                <Label className="text-sm font-semibold mb-3 block">Sort By</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { value: 'date-asc', label: 'Departure: Nearest First' },
                    { value: 'date-desc', label: 'Departure: Farthest First' },
                    { value: 'name-asc', label: 'Name: A-Z' },
                    { value: 'name-desc', label: 'Name: Z-A' },
                    { value: 'readiness-desc', label: 'Readiness: High-Low' },
                    { value: 'participants-desc', label: 'Participants: Most First' }
                  ].map(option => (
                    <Button
                      key={option.value}
                      variant={filters.sortBy === option.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onFiltersChange({ ...filters, sortBy: option.value as any })}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
