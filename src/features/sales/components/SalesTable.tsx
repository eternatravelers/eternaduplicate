import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Users, Search, CreditCard as Edit, Trash2, TrendingUp, Award } from 'lucide-react'
import { Eye } from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { SalesParticipantsModal } from './SalesParticipantsModal'

interface SalesTableProps {
  salesPerformance: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  onEdit: (sales: any) => void
  onDelete: (id: string) => void
  deleting: boolean
}

export function SalesTable({
  salesPerformance,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
  deleting
}: SalesTableProps) {
  const { isSuperAdmin } = useAuth()

  const [showSalesParticipantsModal, setShowSalesParticipantsModal] = useState(false)
  const [selectedSalesId, setSelectedSalesId] = useState('')
  const [selectedSalesName, setSelectedSalesName] = useState('')

  const handleViewSalesParticipants = (sales: any) => {
    setSelectedSalesId(sales.id)
    setSelectedSalesName(sales.name)
    setShowSalesParticipantsModal(true)
  }

  const filteredSales = salesPerformance.filter(sales =>
    sales.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sales.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sales.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getPerformanceBadge = (totalRevenue: number) => {
    if (totalRevenue >= 50000000) {
      return <Badge className="bg-purple-100 text-purple-800">Top Performer</Badge>
    } else if (totalRevenue >= 20000000) {
      return <Badge className="bg-blue-100 text-blue-800">High Performer</Badge>
    } else if (totalRevenue >= 5000000) {
      return <Badge className="bg-green-100 text-green-800">Good Performer</Badge>
    } else if (totalRevenue > 0) {
      return <Badge className="bg-yellow-100 text-yellow-800">New Performer</Badge>
    } else {
      return <Badge variant="outline">No Sales</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Daftar Sales</span>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari sales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredSales.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'Sales tidak ditemukan' : 'Belum ada sales'}
            </h3>
            <p className="text-sm mb-4">
              {searchTerm 
                ? 'Coba gunakan kata kunci yang berbeda'
                : 'Mulai dengan menambahkan sales pertama Anda'
              }
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Total Peserta</TableHead>
                <TableHead>Total Deals</TableHead>
                <TableHead>Total Revenue</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sales) => (
                <TableRow key={sales.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">{sales.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {sales.email && (
                        <div className="text-gray-900">{sales.email}</div>
                      )}
                      {sales.phone && (
                        <div className="text-gray-500">{sales.phone}</div>
                      )}
                      {!sales.email && !sales.phone && (
                        <span className="text-gray-400">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-auto p-2 flex flex-col items-center space-y-1 hover:bg-blue-50"
                        onClick={() => handleViewSalesParticipants(sales)}
                        title="Lihat detail peserta"
                      >
                        <div className="flex items-center space-x-1">
                          <div className="font-medium text-blue-600">{sales.participantCount}</div>
                          <Eye className="h-3 w-3 text-blue-600" />
                        </div>
                        <div className="text-xs text-gray-500">peserta</div>
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium text-green-600">{sales.dealCount}</div>
                      <div className="text-xs text-gray-500">deals</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-purple-600">
                      {formatCurrency(sales.totalRevenue)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-center space-y-1">
                      {getPerformanceBadge(sales.totalRevenue)}
                      {sales.totalRevenue > 0 && (
                        <div className="flex items-center text-xs text-gray-500">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          <span>Avg: {formatCurrency(sales.dealCount > 0 ? sales.totalRevenue / sales.dealCount : 0)}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {formatShortDate(sales.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(sales)}
                        title="Edit sales"
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
                              title="Hapus sales"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Sales</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus sales "{sales.name}"? 
                                Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi data peserta yang terkait dengan sales ini.
                                <br /><br />
                                <strong>Detail Sales:</strong>
                                <br />• Nama: {sales.name}
                                <br />• Email: {sales.email || 'N/A'}
                                <br />• Telepon: {sales.phone || 'N/A'}
                                <br />• Total Peserta: {sales.participantCount}
                                <br />• Total Deals: {sales.dealCount}
                                <br />• Total Revenue: {formatCurrency(sales.totalRevenue)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onDelete(sales.id)}
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
      
      <SalesParticipantsModal
        isOpen={showSalesParticipantsModal}
        onClose={() => setShowSalesParticipantsModal(false)}
        salesId={selectedSalesId}
        salesName={selectedSalesName}
      />
    </Card>
  )
}