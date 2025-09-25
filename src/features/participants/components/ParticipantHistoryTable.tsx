import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Users, Search, Edit, Eye, MapPin, Trash2, History } from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { DeleteParticipantDialog } from './DeleteParticipantDialog'
import { useAuth } from '@/hooks/useAuth'
import { ParticipantPermissionsGuard } from './ParticipantPermissionsGuard'

interface ParticipantHistoryTableProps {
  participants: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  filterStatus: string
  setFilterStatus: (status: string) => void
  onEdit: (participant: any) => void
  onDelete: (id: string, reason?: string, permanent?: boolean) => Promise<void>
  deleting: boolean
}

export function ParticipantHistoryTable({
  participants,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  onEdit,
  onDelete,
  deleting
}: ParticipantHistoryTableProps) {
  const { isAdmin, isSuperAdmin } = useAuth()

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || participant.status === filterStatus
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registered':
        return <Badge variant="default">Terdaftar</Badge>
      case 'confirmed':
        return <Badge className="bg-green-500">Dikonfirmasi</Badge>
      case 'cancelled':
        return <Badge variant="destructive">Dibatalkan</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Riwayat Pendaftaran</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari peserta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="registered">Terdaftar</SelectItem>
                <SelectItem value="confirmed">Dikonfirmasi</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Trip</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Harga</TableHead>
              <TableHead>DP</TableHead>
              <TableHead>Titik Kumpul</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Bukti Transfer</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{participant.full_name}</div>
                    <div className="text-sm text-gray-500">{participant.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  {participant.trips?.name || 'N/A'}
                </TableCell>
                <TableCell>{participant.participant_count} orang</TableCell>
                <TableCell>{formatCurrency(participant.package_price)}</TableCell>
                <TableCell>{formatCurrency(participant.dp_amount)}</TableCell>
                <TableCell>
                  {getMeetingPointDisplay(participant)}
                </TableCell>
                <TableCell>{getStatusBadge(participant.status)}</TableCell>
                <TableCell>
                  {participant.proof_of_transfer_url ? (
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(participant.proof_of_transfer_url!, '_blank')}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Lihat
                      </Button>
                      <Badge variant="outline" className="text-green-600 border-green-200">
                        Ada
                      </Badge>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-gray-500">
                      Belum ada
                    </Badge>
                  )}
                </TableCell>
                <TableCell>{formatShortDate(participant.created_at)}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      onClick={() => onEdit(participant)}
                      title="Edit peserta"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    
                    <ParticipantPermissionsGuard requiredRole="admin">
                      <DeleteParticipantDialog
                        participant={participant}
                        onDelete={onDelete}
                        deleting={deleting}
                      />
                    </ParticipantPermissionsGuard>
                  </div>
                <TableHead className="w-32">Aksi</TableHead>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {filteredParticipants.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>
              {searchTerm || filterStatus !== 'all' 
                ? 'Tidak ada peserta yang ditemukan dengan filter tersebut' 
                : 'Belum ada peserta yang terdaftar'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}