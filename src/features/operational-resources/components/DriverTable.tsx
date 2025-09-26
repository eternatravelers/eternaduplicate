import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { UserCheck, Search, CreditCard as Edit, Trash2 } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface DriverTableProps {
  drivers: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  onEdit: (driver: any) => void
  onDelete: (id: string) => void
  deleting: boolean
}

export function DriverTable({
  drivers,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
  deleting
}: DriverTableProps) {
  const { isSuperAdmin } = useAuth()

  const filteredDrivers = drivers.filter(driver =>
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.license_number?.toLowerCase().includes(searchTerm.toLowerCase())
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-green-600" />
            <span>Daftar Driver</span>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredDrivers.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <UserCheck className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'Driver tidak ditemukan' : 'Belum ada driver'}
            </h3>
            <p className="text-sm mb-4">
              {searchTerm 
                ? 'Coba gunakan kata kunci yang berbeda'
                : 'Mulai dengan menambahkan driver pertama Anda'
              }
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Telepon</TableHead>
                <TableHead>Nomor SIM</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDrivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{driver.name}</div>
                  </TableCell>
                  <TableCell>{driver.phone || '-'}</TableCell>
                  <TableCell>
                    <div className="font-mono text-sm">
                      {driver.license_number || '-'}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(driver.status)}</TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {formatShortDate(driver.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(driver)}
                        title="Edit driver"
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
                              title="Hapus driver"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Driver</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus driver "{driver.name}"? 
                                Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi trip yang menggunakan driver ini.
                                <br /><br />
                                <strong>Detail Driver:</strong>
                                <br />• Nama: {driver.name}
                                <br />• Telepon: {driver.phone || 'N/A'}
                                <br />• Nomor SIM: {driver.license_number || 'N/A'}
                                <br />• Status: {driver.status}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onDelete(driver.id)}
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