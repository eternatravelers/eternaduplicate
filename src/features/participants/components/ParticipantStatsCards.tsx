import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, TrendingUp, Trash2, AlertTriangle, CheckCircle, Wallet } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ParticipantStatsCardsProps {
  totalParticipants: number
  totalRevenue: number
  totalDP: number
  deletedCount: number
  showDeletedStats?: boolean
  totalPaid?: number
  totalRemaining?: number
  paidOffCount?: number
}

export function ParticipantStatsCards({
  totalParticipants,
  totalRevenue,
  totalDP,
  deletedCount,
  showDeletedStats = false,
  totalPaid = 0,
  totalRemaining = 0,
  paidOffCount = 0
}: ParticipantStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-4 lg:grid-cols-5">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Peserta
          </CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalParticipants}</div>
          <p className="text-xs text-gray-500">
            Peserta terdaftar
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Revenue
          </CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalRevenue)}
          </div>
          <p className="text-xs text-gray-500">
            Total pemasukan
          </p>
        </CardContent>
      </Card>

      {!showDeletedStats && (
        <>
          <Card className="hover:shadow-lg transition-shadow border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Dibayar
              </CardTitle>
              <Wallet className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(totalPaid)}
              </div>
              <p className="text-xs text-gray-500">
                Sudah terbayar
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-orange-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Outstanding
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatCurrency(totalRemaining)}
              </div>
              <p className="text-xs text-gray-500">
                Belum dibayar
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-blue-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Peserta Lunas
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {paidOffCount}
              </div>
              <p className="text-xs text-gray-500">
                Pembayaran lengkap
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {showDeletedStats && (
        <Card className="hover:shadow-lg transition-shadow border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Peserta Dihapus
            </CardTitle>
            <Trash2 className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {deletedCount}
            </div>
            <p className="text-xs text-gray-500">
              Di sampah
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}