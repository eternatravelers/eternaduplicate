import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, Phone, Mail, MapPin, DollarSign, Filter } from 'lucide-react'
import { useParticipants } from '@/hooks/useParticipants'
import { formatCurrency, formatShortDate } from '@/lib/utils'

interface TripParticipantsTableProps {
  tripId: string
  tripName: string
}

export function TripParticipantsTable({ tripId, tripName }: TripParticipantsTableProps) {
  const { participants, loading } = useParticipants({ tripId })
  const [selectedMeetingPoint, setSelectedMeetingPoint] = useState<string>('all')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800">Dikonfirmasi</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getMeetingPointDisplay = (participant: any) => {
    if (participant.meeting_point_details) {
      return (
        <div>
          <div className="font-medium text-blue-600">{participant.meeting_point_details}</div>
          <div className="text-xs text-gray-500">Titik kumpul khusus</div>
        </div>
      )
    }
    if (participant.trips?.meeting_point) {
      return (
        <div>
          <div className="font-medium">{participant.trips.meeting_point}</div>
          <div className="text-xs text-gray-500">Titik kumpul default</div>
        </div>
      )
    }
    return <span className="text-gray-400">-</span>
  }

  // Get unique meeting points
  const meetingPoints = useMemo(() => {
    const points = new Set<string>()
    participants.forEach(p => {
      const meetingPoint = p.meeting_point_details || p.trips?.meeting_point
      if (meetingPoint) {
        points.add(meetingPoint)
      }
    })
    return Array.from(points).sort()
  }, [participants])

  // Filter participants by meeting point
  const filteredParticipants = useMemo(() => {
    if (selectedMeetingPoint === 'all') return participants
    if (selectedMeetingPoint === 'none') {
      return participants.filter(p => !p.meeting_point_details && !p.trips?.meeting_point)
    }
    return participants.filter(p => {
      const meetingPoint = p.meeting_point_details || p.trips?.meeting_point
      return meetingPoint === selectedMeetingPoint
    })
  }, [participants, selectedMeetingPoint])

  const totalParticipants = filteredParticipants.reduce((sum, p) => sum + (p.participant_count || 1), 0)
  const totalRevenue = filteredParticipants.reduce((sum, p) => sum + (p.package_price || 0), 0)
  const totalDP = filteredParticipants.reduce((sum, p) => sum + (p.dp_amount || 0), 0)

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-700">{totalParticipants}</div>
                <div className="text-sm text-blue-600">Total Peserta</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-700">{formatCurrency(totalRevenue)}</div>
                <div className="text-sm text-green-600">Total Revenue</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-700">{formatCurrency(totalDP)}</div>
                <div className="text-sm text-purple-600">Total DP</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-orange-600" />
              <div>
                <div className="text-2xl font-bold text-orange-700">{participants.length}</div>
                <div className="text-sm text-orange-600">Registrasi</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meeting Point Breakdown */}
      {meetingPoints.length > 0 && (
        <Card className="border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <MapPin className="h-5 w-5" />
              <span>Breakdown Meeting Point</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {meetingPoints.map(point => {
                const count = participants.filter(p => {
                  const meetingPoint = p.meeting_point_details || p.trips?.meeting_point
                  return meetingPoint === point
                }).length
                const peopleCount = participants
                  .filter(p => {
                    const meetingPoint = p.meeting_point_details || p.trips?.meeting_point
                    return meetingPoint === point
                  })
                  .reduce((sum, p) => sum + (p.participant_count || 1), 0)

                return (
                  <div
                    key={point}
                    className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                    onClick={() => setSelectedMeetingPoint(point)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-medium text-blue-900 mb-1">{point}</div>
                        <div className="text-sm text-blue-700">
                          {count} registrasi • {peopleCount} peserta
                        </div>
                      </div>
                      <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0 mt-1" />
                    </div>
                  </div>
                )
              })}
              {participants.some(p => !p.meeting_point_details && !p.trips?.meeting_point) && (
                <div
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => setSelectedMeetingPoint('none')}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-gray-700 mb-1">Tanpa Meeting Point</div>
                      <div className="text-sm text-gray-600">
                        {participants.filter(p => !p.meeting_point_details && !p.trips?.meeting_point).length} registrasi
                      </div>
                    </div>
                    <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0 mt-1" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Participants Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <span>Daftar Peserta - {tripName}</span>
              <Badge variant="outline">{participants.length} registrasi</Badge>
              {selectedMeetingPoint !== 'all' && (
                <Badge className="bg-blue-100 text-blue-800">
                  {filteredParticipants.length} tersaring
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select value={selectedMeetingPoint} onValueChange={setSelectedMeetingPoint}>
                <SelectTrigger className="w-64">
                  <SelectValue placeholder="Filter Meeting Point" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span>Semua Meeting Point</span>
                    </div>
                  </SelectItem>
                  {meetingPoints.map(point => (
                    <SelectItem key={point} value={point}>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span>{point}</span>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="none">
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-500">Tanpa Meeting Point</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredParticipants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">
                {selectedMeetingPoint === 'all' ? 'Belum ada peserta' : 'Tidak ada peserta'}
              </h3>
              <p className="text-sm">
                {selectedMeetingPoint === 'all'
                  ? 'Belum ada peserta yang terdaftar untuk trip ini'
                  : `Tidak ada peserta dengan meeting point "${selectedMeetingPoint === 'none' ? 'tanpa meeting point' : selectedMeetingPoint}"`
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Peserta</TableHead>
                  <TableHead>Kontak</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Harga</TableHead>
                  <TableHead>DP</TableHead>
                  <TableHead>Titik Kumpul</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Terdaftar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredParticipants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{participant.full_name}</div>
                        {participant.additional_requests && (
                          <div className="text-xs text-gray-500 max-w-xs truncate">
                            {participant.additional_requests}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center space-x-1">
                          <Mail className="h-3 w-3 text-gray-400" />
                          <span>{participant.email}</span>
                        </div>
                        <div className="flex items-center space-x-1 mt-1">
                          <Phone className="h-3 w-3 text-gray-400" />
                          <span>{participant.phone}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium text-blue-600">{participant.participant_count}</div>
                        <div className="text-xs text-gray-500">orang</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600">
                        {formatCurrency(participant.package_price)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-purple-600">
                        {formatCurrency(participant.dp_amount)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {getMeetingPointDisplay(participant)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {participant.sales?.name || (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(participant.status)}</TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {formatShortDate(participant.created_at)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}