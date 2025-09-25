import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, DollarSign, TrendingUp, Trash2, AlertTriangle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ParticipantStatsCardsProps {
  totalParticipants: number
  totalRevenue: number
  totalDP: number
  deletedCount: number
  showDeletedStats?: boolean
}

export function ParticipantStatsCards({ 
  totalParticipants, 
  totalRevenue, 
  totalDP,
  deletedCount,
  showDeletedStats = false
}: ParticipantStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-4">
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

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total DP
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(totalDP)}
          </div>
          <p className="text-xs text-gray-500">
            DP terkumpul
          </p>
        </CardContent>
      </Card>

      <Card className={`hover:shadow-lg transition-shadow ${showDeletedStats ? 'border-red-200 bg-red-50' : ''}`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            {showDeletedStats ? 'Peserta Dihapus' : 'Sisa Pembayaran'}
          </CardTitle>
          {showDeletedStats ? (
            <Trash2 className="h-4 w-4 text-red-600" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          )}
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${showDeletedStats ? 'text-red-600' : 'text-orange-600'}`}>
            {showDeletedStats ? deletedCount : formatCurrency(totalRevenue - totalDP)}
          </div>
          <p className="text-xs text-gray-500">
            {showDeletedStats ? 'Di sampah' : 'Belum dibayar'}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}