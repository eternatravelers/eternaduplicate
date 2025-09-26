import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { UserCheck, Search, CreditCard as Edit, Trash2, Award } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface TourLeaderTableProps {
  tourLeaders: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  onEdit: (tourLeader: any) => void
  onDelete: (id: string) => void
  deleting: boolean
}

export function TourLeaderTable({
  tourLeaders,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
  deleting
}: TourLeaderTableProps) {
  const { isSuperAdmin } = useAuth()

  const filteredTourLeaders = tourLeaders.filter(tourLeader =>
    tourLeader.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tourLeader.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tourLeader.specialization?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>
      case 'on_leave':
        return <Badge className="bg-yellow-100 text-yellow-800">Cuti</Badge>
      case 'inactive':
        return <Badge variant="secondary">Tidak Aktif</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getExperienceBadge = (years: number) => {
    if (years >= 10) {
      return <Badge className="bg-purple-100 text-purple-800">Senior</Badge>
    } else if (years >= 5) {
      return <Badge className="bg-blue-100 text-blue-800">Berpengalaman</Badge>
    } else if (years >= 2) {
      return <Badge className="bg-green-100 text-green-800">Junior</Badge>
    } else {
      return <Badge variant="outline">Pemula</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-purple-600" />
            <span>Daftar Tour Leader</span>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari tour leader..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 focus:ring-purple-500 focus:border-purple-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredTourLeaders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'Tour leader tidak ditemukan' : 'Belum ada tour leader'}
            </h3>
            <p className="text-sm mb-4">
              {searchTerm 
                ? 'Coba gunakan kata kunci yang berbeda'
                : 'Mulai dengan menambahkan tour leader pertama Anda'
              }
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Spesialisasi</TableHead>
                <TableHead>Pengalaman</TableHead>
                <TableHead>Sertifikasi</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTourLeaders.map((tourLeader) => (
                <TableRow key={tourLeader.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{tourLeader.name}</div>
                      {tourLeader.bio && (
                        <div className="text-xs text-gray-500 max-w-xs truncate">
                          {tourLeader.bio}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {tourLeader.email && (
                        <div className="text-gray-900">{tourLeader.email}</div>
                      )}
                      {tourLeader.phone && (
                        <div className="text-gray-500">{tourLeader.phone}</div>
                      )}
                      {!tourLeader.email && !tourLeader.phone && (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tourLeader.specialization ? (
                      <div className="text-sm text-gray-700">
                        {tourLeader.specialization}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center space-y-1">
                      <div className="font-medium">{tourLeader.experience_years} tahun</div>
                      {getExperienceBadge(tourLeader.experience_years)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {tourLeader.certification ? (
                      <div className="flex items-center space-x-1">
                        <Award className="h-3 w-3 text-yellow-600" />
                        <span className="text-sm text-gray-700">{tourLeader.certification}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(tourLeader.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {formatShortDate(tourLeader.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(tourLeader)}
                        title="Edit tour leader"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {isSuperAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Hapus tour leader"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Tour Leader</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus tour leader "{tourLeader.name}"? 
                                Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi trip yang menggunakan tour leader ini.
                                <br /><br />
                                <strong>Detail Tour Leader:</strong>
                                <br />• Nama: {tourLeader.name}
                                <br />• Email: {tourLeader.email || 'N/A'}
                                <br />• Telepon: {tourLeader.phone || 'N/A'}
                                <br />• Spesialisasi: {tourLeader.specialization || 'N/A'}
                                <br />• Pengalaman: {tourLeader.experience_years} tahun
                                <br />• Status: {tourLeader.status}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onDelete(tourLeader.id)}
                                disabled={deleting}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                {deleting ? 'Menghapus...' : 'Hapus'}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
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