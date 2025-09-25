import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { History, Trash2, RotateCcw, UserX } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import { useParticipantAuditLog } from '@/hooks/useParticipants'

interface ParticipantAuditLogProps {
  participantId?: string
}

export function ParticipantAuditLog({ participantId }: ParticipantAuditLogProps) {
  const { auditLog, loading } = useParticipantAuditLog(participantId)

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'deleted':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <Trash2 className="h-3 w-3 mr-1" />
            Dihapus
          </Badge>
        )
      case 'restored':
        return (
          <Badge className="bg-green-100 text-green-800">
            <RotateCcw className="h-3 w-3 mr-1" />
            Dipulihkan
          </Badge>
        )
      case 'permanently_deleted':
        return (
          <Badge className="bg-red-100 text-red-800">
            <UserX className="h-3 w-3 mr-1" />
            Hapus Permanen
          </Badge>
        )
      default:
        return <Badge variant="outline">{action}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Riwayat Audit</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5 text-blue-600" />
          <span>Riwayat Audit Peserta</span>
          <Badge variant="outline">{auditLog.length} aktivitas</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {auditLog.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">Belum ada aktivitas audit</h3>
            <p className="text-sm">
              {participantId 
                ? 'Belum ada aktivitas penghapusan untuk peserta ini'
                : 'Belum ada aktivitas penghapusan peserta'
              }
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Peserta</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Dilakukan Oleh</TableHead>
                <TableHead>Alasan</TableHead>
                <TableHead>Tanggal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLog.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {log.participant_data?.full_name || 'Unknown Participant'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {log.participant_data?.email || 'No email'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getActionBadge(log.action)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{log.performed_by_user_name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      {log.reason ? (
                        <div className="text-sm text-gray-700 truncate" title={log.reason}>
                          {log.reason}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {formatShortDate(log.created_at)}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}