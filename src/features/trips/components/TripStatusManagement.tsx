import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Users,
  Calendar,
  ArrowRight,
  Info
} from 'lucide-react'
import { useTripStatusValidation } from '@/hooks/useTripStatusValidation'
import { format, differenceInDays } from 'date-fns'

interface TripStatusManagementProps {
  trip: any
  onStatusChange: (newStatus: string) => Promise<void>
  updating: boolean
}

export function TripStatusManagement({ trip, onStatusChange, updating }: TripStatusManagementProps) {
  const { validateStatusTransition, validating } = useTripStatusValidation()
  const [showTransitionDialog, setShowTransitionDialog] = useState(false)
  const [targetStatus, setTargetStatus] = useState<string>('')
  const [transitionError, setTransitionError] = useState<string | null>(null)

  const daysUntilDeparture = differenceInDays(new Date(trip.departure_date), new Date())

  const statusFlow = {
    draft: { next: ['open'], label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
    open: { next: ['confirmed', 'cancelled'], label: 'Terbuka', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
    confirmed: { next: ['ongoing', 'cancelled'], label: 'Terkonfirmasi', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
    ongoing: { next: ['completed'], label: 'Berjalan', color: 'bg-orange-100 text-orange-800', icon: Clock },
    completed: { next: [], label: 'Selesai', color: 'bg-purple-100 text-purple-800', icon: CheckCircle2 },
    cancelled: { next: [], label: 'Dibatalkan', color: 'bg-red-100 text-red-800', icon: XCircle },
    active: { next: ['open', 'cancelled'], label: 'Aktif (Legacy)', color: 'bg-green-100 text-green-800', icon: CheckCircle2 }
  }

  const currentStatus = statusFlow[trip.status as keyof typeof statusFlow] || statusFlow.draft
  const StatusIcon = currentStatus.icon

  const handleStatusTransition = async (newStatus: string) => {
    setTransitionError(null)

    const validation = await validateStatusTransition(trip.id, trip.status, newStatus)

    if (!validation.isValid) {
      setTransitionError(validation.errorMessage || 'Transisi status tidak valid')
      return
    }

    setTargetStatus(newStatus)
    setShowTransitionDialog(true)
  }

  const confirmStatusChange = async () => {
    try {
      await onStatusChange(targetStatus)
      setShowTransitionDialog(false)
      setTargetStatus('')
      setTransitionError(null)
    } catch (error) {
      setTransitionError(error instanceof Error ? error.message : 'Gagal mengubah status')
    }
  }

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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Status & Kesiapan Trip</span>
            <Badge className={currentStatus.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {currentStatus.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-blue-600">Keberangkatan</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {daysUntilDeparture > 0 ? `H-${daysUntilDeparture}` : daysUntilDeparture === 0 ? 'Hari Ini' : 'Berlalu'}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {format(new Date(trip.departure_date), 'dd MMM yyyy')}
                    </div>
                  </div>
                  <Calendar className="h-10 w-10 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-green-600">Peserta</div>
                    <div className={`text-2xl font-bold ${getQuotaColor()}`}>
                      {trip.confirmed_participant_count || 0}/{trip.quota || '-'}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      {getQuotaPercentage()}% terisi
                    </div>
                  </div>
                  <Users className="h-10 w-10 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-orange-600">Kesiapan</div>
                    <div className={`text-2xl font-bold ${getReadinessColor(trip.readiness_score || 0)}`}>
                      {trip.readiness_score || 0}%
                    </div>
                    <div className="text-xs text-orange-600 mt-1">
                      {getReadinessLabel(trip.readiness_score || 0)}
                    </div>
                  </div>
                  <CheckCircle2 className="h-10 w-10 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Skor Kesiapan Operasional</span>
              <span className={`text-sm font-bold ${getReadinessColor(trip.readiness_score || 0)}`}>
                {trip.readiness_score || 0}/100
              </span>
            </div>
            <Progress value={trip.readiness_score || 0} className="h-3" />
            <div className="text-xs text-gray-500 mt-1">
              Bus, Driver, Tour Leader, Cost Plan, Meeting Points, Checklist
            </div>
          </div>

          {trip.status === 'draft' && (
            <Alert className="bg-blue-50 border-blue-200">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Status Draft:</strong> Trip masih dalam persiapan. Ubah ke status "Open" untuk mulai menerima pendaftaran peserta.
                <div className="mt-2 text-sm">
                  <strong>Requirement untuk Open:</strong> Minimal 1 bus, 1 driver, 1 tour leader, dan 1 meeting point
                </div>
              </AlertDescription>
            </Alert>
          )}

          {trip.status === 'open' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>Status Open:</strong> Trip terbuka untuk pendaftaran.
                {trip.can_accept_registrations ?
                  ' Masih menerima peserta baru.' :
                  ' Pendaftaran ditutup (quota penuh atau tidak eligible).'}
                <div className="mt-2 text-sm">
                  <strong>Untuk Konfirmasi:</strong> Tunggu H-7 dan minimal 80% quota terisi
                </div>
              </AlertDescription>
            </Alert>
          )}

          {trip.status === 'confirmed' && daysUntilDeparture > 0 && (
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900">
                <strong>Status Confirmed:</strong> Trip sudah dikonfirmasi dan siap berangkat.
                Pastikan semua checklist selesai sebelum keberangkatan.
              </AlertDescription>
            </Alert>
          )}

          {transitionError && (
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-900">
                {transitionError}
              </AlertDescription>
            </Alert>
          )}

          {currentStatus.next.length > 0 && (
            <div className="space-y-3">
              <div className="text-sm font-medium">Aksi Status Tersedia:</div>
              <div className="flex flex-wrap gap-2">
                {currentStatus.next.map((nextStatus) => {
                  const nextStatusInfo = statusFlow[nextStatus as keyof typeof statusFlow]
                  const NextIcon = nextStatusInfo.icon

                  return (
                    <Button
                      key={nextStatus}
                      onClick={() => handleStatusTransition(nextStatus)}
                      disabled={validating || updating}
                      variant={nextStatus === 'cancelled' ? 'destructive' : 'default'}
                      className="flex items-center"
                    >
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Ubah ke {nextStatusInfo.label}
                      <NextIcon className="h-4 w-4 ml-2" />
                    </Button>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showTransitionDialog} onOpenChange={setShowTransitionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Perubahan Status</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan mengubah status trip dari <strong>{currentStatus.label}</strong> ke{' '}
              <strong>{statusFlow[targetStatus as keyof typeof statusFlow]?.label}</strong>.
              {targetStatus === 'cancelled' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="text-red-900 font-semibold">Peringatan!</div>
                  <div className="text-red-800 text-sm mt-1">
                    Membatalkan trip akan berdampak pada semua peserta yang sudah terdaftar.
                    Pastikan Anda sudah mengkomunikasikan pembatalan ini.
                  </div>
                </div>
              )}
              {targetStatus === 'open' && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="text-blue-900 font-semibold">Informasi</div>
                  <div className="text-blue-800 text-sm mt-1">
                    Membuka trip akan mengaktifkan pendaftaran peserta dan auto-generate checklist operasional.
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmStatusChange}
              disabled={updating}
              className={targetStatus === 'cancelled' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              {updating ? 'Mengubah...' : 'Ya, Ubah Status'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
