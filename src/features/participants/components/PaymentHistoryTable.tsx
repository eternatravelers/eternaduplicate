import React from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, Trash2, Receipt } from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'
import { PaymentInstallment } from '@/hooks/usePaymentInstallments'

interface PaymentHistoryTableProps {
  installments: PaymentInstallment[]
  onDelete?: (id: string) => void
  deleting?: boolean
  showActions?: boolean
}

export function PaymentHistoryTable({
  installments,
  onDelete,
  deleting = false,
  showActions = true
}: PaymentHistoryTableProps) {
  const getPaymentTypeBadge = (type: string) => {
    if (type === 'dp') {
      return <Badge variant="default" className="bg-blue-600">DP</Badge>
    }
    return <Badge variant="default" className="bg-green-600">Cicilan</Badge>
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-600">Terverifikasi</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      case 'rejected':
        return <Badge variant="destructive">Ditolak</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'transfer':
        return 'Transfer Bank'
      case 'cash':
        return 'Tunai'
      case 'ewallet':
        return 'E-Wallet'
      default:
        return method
    }
  }

  if (installments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 border rounded-lg bg-gray-50">
        <Receipt className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <h3 className="text-lg font-medium mb-2">Belum Ada Pembayaran</h3>
        <p className="text-sm">Riwayat pembayaran akan muncul di sini</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Metode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Bukti Transfer</TableHead>
            {showActions && <TableHead className="text-right">Aksi</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {installments.map((installment) => (
            <TableRow key={installment.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{formatShortDate(installment.payment_date)}</div>
                  {installment.notes && (
                    <div className="text-xs text-gray-500 mt-1">{installment.notes}</div>
                  )}
                </div>
              </TableCell>
              <TableCell>{getPaymentTypeBadge(installment.payment_type)}</TableCell>
              <TableCell>
                <span className="font-semibold text-green-600">
                  {formatCurrency(installment.amount)}
                </span>
              </TableCell>
              <TableCell>
                <span className="text-sm">{getPaymentMethodLabel(installment.payment_method)}</span>
              </TableCell>
              <TableCell>{getStatusBadge(installment.status)}</TableCell>
              <TableCell>
                {installment.proof_of_transfer_url ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(installment.proof_of_transfer_url, '_blank')}
                    className="h-8"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Lihat
                  </Button>
                ) : (
                  <span className="text-xs text-gray-400">Tidak ada</span>
                )}
              </TableCell>
              {showActions && (
                <TableCell className="text-right">
                  {onDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(installment.id)}
                      disabled={deleting}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="bg-gray-50 px-4 py-3 border-t">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">
            Total {installments.length} pembayaran
          </span>
          <div className="text-right">
            <div className="text-xs text-gray-500">Total Pembayaran</div>
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(installments.reduce((sum, p) => sum + (p.status === 'verified' ? p.amount : 0), 0))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
