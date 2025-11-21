import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft,
  Calendar,
  Users,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Info
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { useTripReadiness } from '@/hooks/useTripReadiness'
import { ReadinessBreakdownCard } from '../components/ReadinessBreakdownCard'
import { ActionItemsList } from '../components/ActionItemsList'

interface TripReadinessPageProps {
  tripId: string
  onBack: () => void
  onNavigateToMeetingPoints?: () => void
  onNavigateToCostPlans?: () => void
  onNavigateToResourceScheduling?: () => void
}

export function TripReadinessPage({
  tripId,
  onBack,
  onNavigateToMeetingPoints,
  onNavigateToCostPlans,
  onNavigateToResourceScheduling
}: TripReadinessPageProps) {
  const { data, loading, error, refetch } = useTripReadiness(tripId)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <div className="text-gray-600">Loading readiness data...</div>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Alert className="bg-red-50 border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            {error || 'Failed to load trip readiness data'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const { trip, readinessBreakdown, actionItems, buses, drivers, tourLeaders, meetingPoints, costPlan, checklists } = data

  const daysUntilDeparture = differenceInDays(new Date(trip.departure_date), new Date())

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getReadinessLabel = (score: number) => {
    if (score >= 80) return 'Siap'
    if (score >= 50) return 'Perlu Perhatian'
    return 'Belum Siap'
  }

  const getQuotaColor = () => {
    if (!trip.quota || !trip.confirmed_participant_count) return 'text-gray-500'
    const percentage = (trip.confirmed_participant_count / trip.quota) * 100
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-orange-600'
    return 'text-gray-600'
  }

  const getQuotaPercentage = () => {
    if (!trip.quota || !trip.confirmed_participant_count) return 0
    return Math.round((trip.confirmed_participant_count / trip.quota) * 100)
  }

  const handleActionClick = (action: string) => {
    switch (action) {
      case 'assign-bus':
      case 'assign-driver':
      case 'assign-tour-leader':
        // Redirect to Resource Scheduling page for proper assignment with conflict prevention
        if (onNavigateToResourceScheduling) {
          onNavigateToResourceScheduling()
        }
        break
      case 'set-cost-plan':
        if (onNavigateToCostPlans) onNavigateToCostPlans()
        break
      case 'configure-meeting-points':
        if (onNavigateToMeetingPoints) onNavigateToMeetingPoints()
        break
      case 'complete-checklists':
        // Scroll to checklist section
        document.getElementById('checklist-section')?.scrollIntoView({ behavior: 'smooth' })
        break
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trips
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{trip.name}</h1>
            <p className="text-sm text-gray-600">Status Kesiapan Operasional</p>
          </div>
        </div>
        <Badge className="text-base px-4 py-2">
          {trip.status}
        </Badge>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-blue-600 font-medium">Keberangkatan</div>
                <div className="text-3xl font-bold text-blue-700">
                  {daysUntilDeparture > 0 ? `H-${daysUntilDeparture}` : daysUntilDeparture === 0 ? 'Hari Ini' : 'Berlalu'}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {format(new Date(trip.departure_date), 'dd MMMM yyyy')}
                </div>
              </div>
              <Calendar className="h-12 w-12 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-green-600 font-medium">Peserta</div>
                <div className={`text-3xl font-bold ${getQuotaColor()}`}>
                  {trip.confirmed_participant_count || 0}/{trip.quota || '-'}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  {getQuotaPercentage()}% terisi
                </div>
              </div>
              <Users className="h-12 w-12 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-orange-600 font-medium">Kesiapan</div>
                <div className={`text-3xl font-bold ${getReadinessColor(trip.readiness_score || 0)}`}>
                  {trip.readiness_score || 0}%
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  {getReadinessLabel(trip.readiness_score || 0)}
                </div>
              </div>
              <CheckCircle2 className="h-12 w-12 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overall Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-600" />
              <span className="font-semibold">Skor Kesiapan Operasional</span>
            </div>
            <span className={`text-2xl font-bold ${getReadinessColor(trip.readiness_score || 0)}`}>
              {trip.readiness_score || 0}/100
            </span>
          </div>
          <Progress value={trip.readiness_score || 0} className="h-4 mb-2" />
          <div className="text-xs text-gray-500">
            Berdasarkan: Bus (20%), Driver (20%), Tour Leader (20%), Cost Plan (15%), Meeting Points (15%), Checklist (10%)
          </div>
        </CardContent>
      </Card>

      {/* Info Alert */}
      {trip.readiness_score < 80 && (
        <Alert className="bg-yellow-50 border-yellow-200">
          <Info className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-900">
            <strong>Action Required:</strong> Trip belum mencapai kesiapan optimal (80%). Periksa item di bawah untuk meningkatkan skor kesiapan.
          </AlertDescription>
        </Alert>
      )}

      {/* Action Items */}
      {actionItems.length > 0 && (
        <ActionItemsList items={actionItems} onActionClick={handleActionClick} />
      )}

      {/* Readiness Breakdown */}
      <div>
        <h2 className="text-xl font-bold mb-4">Detail Kesiapan per Kategori</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <ReadinessBreakdownCard
            category="bus"
            data={readinessBreakdown.bus}
            details={buses}
            detailType="bus"
            onAction={() => {
              setResourceFilter('bus')
              setIsResourcesModalOpen(true)
            }}
          />

          <ReadinessBreakdownCard
            category="driver"
            data={readinessBreakdown.driver}
            details={drivers}
            detailType="driver"
            onAction={() => {
              setResourceFilter('driver')
              setIsResourcesModalOpen(true)
            }}
          />

          <ReadinessBreakdownCard
            category="tourLeader"
            data={readinessBreakdown.tourLeader}
            details={tourLeaders}
            detailType="tourLeader"
            onAction={() => {
              setResourceFilter('tourLeader')
              setIsResourcesModalOpen(true)
            }}
          />

          <ReadinessBreakdownCard
            category="costPlan"
            data={readinessBreakdown.costPlan}
            details={costPlan ? [costPlan] : []}
            detailType="costPlan"
            onAction={() => {
              if (onNavigateToCostPlans) onNavigateToCostPlans()
            }}
          />

          <ReadinessBreakdownCard
            category="meetingPoints"
            data={readinessBreakdown.meetingPoints}
            details={meetingPoints}
            detailType="meetingPoint"
            onAction={() => {
              if (onNavigateToMeetingPoints) onNavigateToMeetingPoints()
            }}
          />

          <div id="checklist-section">
            <ReadinessBreakdownCard
              category="checklist"
              data={readinessBreakdown.checklist}
              details={checklists}
              detailType="checklist"
            />
          </div>
        </div>
      </div>

    </div>
  )
}
