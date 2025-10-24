import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Wallet, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PaymentSummaryCardProps {
  packagePrice: number
  totalPaid: number
  remainingPayment: number
  paymentStatus: string
  paymentPercentage: number
  installmentCount: number
}

export function PaymentSummaryCard({
  packagePrice,
  totalPaid,
  remainingPayment,
  paymentStatus,
  paymentPercentage,
  installmentCount
}: PaymentSummaryCardProps) {
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'lunas':
        return {
          label: 'Lunas',
          color: 'bg-green-600',
          icon: <CheckCircle className="h-5 w-5" />,
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        }
      case 'cicilan_berjalan':
        return {
          label: 'Cicilan Berjalan',
          color: 'bg-blue-600',
          icon: <TrendingUp className="h-5 w-5" />,
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        }
      case 'dp_dibayar':
        return {
          label: 'DP Dibayar',
          color: 'bg-yellow-600',
          icon: <Wallet className="h-5 w-5" />,
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        }
      case 'belum_bayar':
        return {
          label: 'Belum Bayar',
          color: 'bg-red-600',
          icon: <AlertCircle className="h-5 w-5" />,
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        }
      default:
        return {
          label: status,
          color: 'bg-gray-600',
          icon: <Wallet className="h-5 w-5" />,
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200'
        }
    }
  }

  const statusInfo = getStatusInfo(paymentStatus)

  return (
    <Card className={`${statusInfo.borderColor} border-2`}>
      <CardHeader className={statusInfo.bgColor}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {statusInfo.icon}
            <span>Ringkasan Pembayaran</span>
          </div>
          <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Total Harga Paket</div>
            <div className="text-2xl font-bold">{formatCurrency(packagePrice)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Jumlah Pembayaran</div>
            <div className="text-lg font-medium text-gray-500">{installmentCount}x pembayaran</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Progress Pembayaran</span>
            <span className="text-sm font-semibold">{paymentPercentage.toFixed(1)}%</span>
          </div>
          <Progress value={paymentPercentage} className="h-3" />
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Sudah Dibayar</div>
            <div className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</div>
          </div>
          <div className="space-y-1">
            <div className="text-sm text-gray-600">Sisa Pembayaran</div>
            <div className="text-xl font-bold text-red-600">{formatCurrency(remainingPayment)}</div>
          </div>
        </div>

        {paymentStatus === 'lunas' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-green-800">Pembayaran Lunas</div>
              <div className="text-sm text-green-600">Peserta telah menyelesaikan seluruh pembayaran</div>
            </div>
          </div>
        )}

        {paymentStatus !== 'lunas' && remainingPayment > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-yellow-600 flex-shrink-0" />
            <div>
              <div className="font-semibold text-yellow-800">Menunggu Pelunasan</div>
              <div className="text-sm text-yellow-600">
                Sisa pembayaran: {formatCurrency(remainingPayment)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
