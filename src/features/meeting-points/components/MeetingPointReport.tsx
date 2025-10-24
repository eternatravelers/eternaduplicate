import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileText, Download, Printer, Users, MapPin, Bus, Clock } from 'lucide-react'
import { useMeetingPointSummary } from '@/hooks/useMeetingPointSummary'
import { usePickupSchedules } from '@/hooks/usePickupSchedules'
import { useMeetingPointAssignments } from '@/hooks/useMeetingPointAssignments'
import { useParticipants } from '@/hooks/useParticipants'
import { formatCurrency } from '@/lib/utils'

interface MeetingPointReportProps {
  tripId: string
  tripName: string
}

export function MeetingPointReport({ tripId, tripName }: MeetingPointReportProps) {
  const { summary, loading: summaryLoading } = useMeetingPointSummary(tripId)
  const { schedules, loading: schedulesLoading } = usePickupSchedules(tripId)
  const { assignments, loading: assignmentsLoading } = useMeetingPointAssignments(tripId)
  const { participants } = useParticipants({ tripId })

  const handlePrint = () => {
    window.print()
  }

  const handleExportCSV = () => {
    const headers = ['Meeting Point', 'Jumlah Peserta', 'Registrasi', 'Waktu Pickup', 'Bus', 'Driver', 'Status']

    const rows = summary.map(item => {
      const schedule = schedules.find(s => s.meeting_point_name === item.meeting_point_name)
      const assignment = assignments.find(a => a.meeting_point_name === item.meeting_point_name)

      return [
        item.meeting_point_name,
        item.participant_count,
        item.registration_count,
        schedule?.pickup_time || '-',
        assignment?.buses?.bus_number || '-',
        assignment?.drivers?.name || '-',
        schedule?.status || '-'
      ]
    })

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `meeting-point-report-${tripName}-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-'
    return timeString.substring(0, 5)
  }

  const totalParticipants = summary.reduce((sum, s) => sum + s.participant_count, 0)
  const totalRegistrations = summary.reduce((sum, s) => sum + s.registration_count, 0)

  if (summaryLoading || schedulesLoading || assignmentsLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-64 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="print:shadow-none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <span>Laporan Meeting Point - {tripName}</span>
            </CardTitle>
            <div className="flex items-center space-x-2 print:hidden">
              <Button size="sm" variant="outline" onClick={handleExportCSV}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button size="sm" variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 print:grid-cols-3">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <MapPin className="h-6 w-6 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-700">{summary.length}</div>
                  <div className="text-sm text-blue-600">Meeting Points</div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center space-x-3">
                <Users className="h-6 w-6 text-green-600" />
                <div>
                  <div className="text-2xl font-bold text-green-700">{totalParticipants}</div>
                  <div className="text-sm text-green-600">Total Peserta</div>
                </div>
              </div>
            </div>
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center space-x-3">
                <Bus className="h-6 w-6 text-orange-600" />
                <div>
                  <div className="text-2xl font-bold text-orange-700">{totalRegistrations}</div>
                  <div className="text-sm text-orange-600">Registrasi</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Rekapitulasi Per Meeting Point</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Meeting Point</TableHead>
                  <TableHead className="text-center">Peserta</TableHead>
                  <TableHead className="text-center">Registrasi</TableHead>
                  <TableHead>Waktu Pickup</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.map((item) => {
                  const schedule = schedules.find(s => s.meeting_point_name === item.meeting_point_name)
                  const assignment = assignments.find(a => a.meeting_point_name === item.meeting_point_name)

                  return (
                    <TableRow key={item.meeting_point_name}>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{item.meeting_point_name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-semibold text-blue-600">{item.participant_count}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-gray-600">{item.registration_count}</div>
                      </TableCell>
                      <TableCell>
                        {schedule ? (
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{formatTime(schedule.pickup_time)}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">Belum dijadwalkan</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {assignment?.buses ? (
                          <div>
                            <div className="font-medium">{assignment.buses.bus_number}</div>
                            <div className="text-xs text-gray-500">
                              Kapasitas: {assignment.capacity_available}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Belum ditentukan</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {assignment?.drivers?.name || (
                          <span className="text-gray-400">Belum ditentukan</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {schedule ? (
                          <Badge
                            variant={schedule.status === 'scheduled' ? 'default' : 'outline'}
                            className={
                              schedule.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : schedule.status === 'in_progress'
                                ? 'bg-orange-100 text-orange-800'
                                : ''
                            }
                          >
                            {schedule.status}
                          </Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="text-xs text-gray-500 pt-4 border-t print:block hidden">
            <p>Dicetak pada: {new Date().toLocaleString('id-ID')}</p>
            <p>Trip: {tripName}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
