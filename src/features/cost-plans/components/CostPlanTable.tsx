import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Calculator, Search, Edit, Copy, Trash2, Eye } from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'

interface CostPlanTableProps {
  costPlans: any[]
  searchTerm: string
  setSearchTerm: (term: string) => void
  onEdit: (costPlan: any) => void
  onDuplicate: (costPlan: any) => void
  onDelete: (id: string) => void
  deleting: boolean
}

export function CostPlanTable({
  costPlans,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDuplicate,
  onDelete,
  deleting
}: CostPlanTableProps) {
  const { isSuperAdmin } = useAuth()

  const filteredCostPlans = costPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCategoryPreview = (categories: any[]) => {
    if (!categories || categories.length === 0) return 'Tidak ada kategori'
    
    const preview = categories.slice(0, 2).map(cat => cat.name).join(', ')
    const remaining = categories.length - 2
    
    return remaining > 0 ? `${preview} +${remaining} lainnya` : preview
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="h-5 w-5 text-green-600" />
            <span>Daftar Rencana Biaya</span>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari rencana biaya..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredCostPlans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Calculator className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium mb-2">
              {searchTerm ? 'Rencana biaya tidak ditemukan' : 'Belum ada rencana biaya'}
            </h3>
            <p className="text-sm mb-4">
              {searchTerm 
                ? 'Coba gunakan kata kunci yang berbeda'
                : 'Mulai dengan menambahkan rencana biaya pertama Anda'
              }
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Rencana</TableHead>
                <TableHead>Perkiraan Peserta</TableHead>
                <TableHead>Total Biaya</TableHead>
                <TableHead>Biaya per Orang</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCostPlans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">{plan.name}</div>
                      <Badge variant="outline" className="mt-1 text-green-600 border-green-200">
                        Template
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <div className="font-medium">{plan.estimated_participants}</div>
                      <div className="text-xs text-gray-500">orang</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-green-600">
                      {formatCurrency(plan.total_cost || 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-blue-600">
                      {formatCurrency(plan.cost_per_person || 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      {getCategoryPreview(plan.categories)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {formatShortDate(plan.created_at)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onEdit(plan)}
                        title="Edit rencana biaya"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        onClick={() => onDuplicate(plan)}
                        title="Duplikasi rencana biaya"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                      {isSuperAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Hapus rencana biaya"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Rencana Biaya</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus rencana biaya "{plan.name}"? 
                                Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi trip yang menggunakan rencana biaya ini.
                                <br /><br />
                                <strong>Detail Rencana Biaya:</strong>
                                <br />• Nama: {plan.name}
                                <br />• Perkiraan Peserta: {plan.estimated_participants} orang
                                <br />• Total Biaya: {formatCurrency(plan.total_cost || 0)}
                                <br />• Biaya per Orang: {formatCurrency(plan.cost_per_person || 0)}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => onDelete(plan.id)}
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