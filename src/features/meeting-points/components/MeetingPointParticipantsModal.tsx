import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Users, Phone, Mail, MapPin } from 'lucide-react'
import { useParticipants } from '@/hooks/useParticipants'
import { formatCurrency } from '@/lib/utils'

interface MeetingPointParticipantsModalProps {
  isOpen: boolean
  onClose: () => void
  tripId: string
  meetingPointName: string
}

export function MeetingPointParticipantsModal({
  isOpen,
  onClose,
  tripId,
  meetingPointName
}: MeetingPointParticipantsModalProps) {
  const { participants, loading } = useParticipants({ tripId })

  const filteredParticipants = participants.filter(p => {
    const participantMeetingPoint = p.meeting_point_details || p.trips?.meeting_point
    return participantMeetingPoint === meetingPointName
  })

  const totalParticipants = filteredParticipants.reduce(
    (sum, p) => sum + (p.participant_count || 1),
    0
  )

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MapPin className="h-5 w-5 text-blue-600" />
            <span>Peserta di {meetingPointName}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center">
            <div className="animate-pulse">Loading...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold text-blue-700">{totalParticipants}</div>
                  <div className="text-sm text-blue-600">Total Peserta</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold text-gray-700">
                  {filteredParticipants.length}
                </div>
                <div className="text-sm text-gray-600">Registrasi</div>
              </div>
            </div>

            {filteredParticipants.length === 0 ? (
              <div className="text-center py-12 space-y-4">
                <div className="flex justify-center">
                  <div className="bg-gray-50 p-6 rounded-full">
                    <Users className="h-16 w-16 text-gray-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-gray-900">Tidak Ada Peserta</h3>
                  <p className="text-sm text-gray-600 max-w-sm mx-auto">
                    Belum ada peserta yang terdaftar di meeting point ini. Tambahkan peserta terlebih dahulu untuk melanjutkan operasi.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    onClose()
                    window.location.href = '/participants'
                  }}
                  className="mt-4"
                >
                  Tambah Peserta
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Peserta</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead className="text-center">Jumlah</TableHead>
                    <TableHead>Harga Paket</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {participant.full_name}
                          </div>
                          {participant.additional_requests && (
                            <div className="text-xs text-gray-500 mt-1">
                              {participant.additional_requests}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-1">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{participant.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            <span className="text-gray-600">{participant.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="font-medium text-blue-600">
                          {participant.participant_count}
                        </div>
                        <div className="text-xs text-gray-500">orang</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-green-600">
                          {formatCurrency(participant.package_price)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {participant.sales?.name || (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(participant.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
