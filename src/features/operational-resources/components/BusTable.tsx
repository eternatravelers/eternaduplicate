import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Bus, Search, Edit, Trash2 } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface BusTableProps {
  buses: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  onEdit: (bus: any) => void
  onDelete: (id: string) => void
  deleting: boolean
}

export function BusTable({
  buses,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
  deleting
}: BusTableProps) {
  const { isSuperAdmin } = useAuth()

  const filteredBuses = buses.filter(bus =>
    bus.plate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.model?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Aktif</Badge>
      case 'maintenance':
        return <Badge className="bg-yellow-100 text-yellow-800">Maintenance</Badge>
      case 'inactive':
        return <Badge variant="secondary">Tidak Aktif</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Bus className="h-5 w-5 text-blue-600" />
            <span>Daftar Bus</span>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari bus..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredBuses.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bus className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'Bus tidak ditemukan' : 'Belum ada bus'}
            </h3>
            <p className="text-sm mb-4">
              {searchTerm 
                ? 'Coba gunakan kata kunci yang berbeda'
                : 'Mulai dengan menambahkan bus pertama Anda'
              }
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nomor Plat</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Kapasitas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBuses.map((bus) => (
                <TableRow key={bus.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{bus.plate_number}</div>
                  </TableCell>
                  <TableCell>{bus.model || '-'}</TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{bus.capacity || '-'}</div>
                      {bus.capacity && (
                        <div className="text-xs text-gray-500">penumpang</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(bus.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {formatShortDate(bus.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(bus)}
                        title="Edit bus"
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
                              title="Hapus bus"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Bus</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus bus "{bus.plate_number}"? 
                                Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi trip yang menggunakan bus ini.
                                <br /><br />
                                <strong>Detail Bus:</strong>
                                <br />• Nomor Plat: {bus.plate_number}
                                <br />• Model: {bus.model || 'N/A'}
                                <br />• Kapasitas: {bus.capacity || 'N/A'} penumpang
                                <br />• Status: {bus.status}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onDelete(bus.id)}
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