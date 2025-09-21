import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, TrendingUp, Award } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SalesOverviewCardsProps {
  salesCount: number
  totalSalesRevenue: number
  totalDeals: number
}

export function SalesOverviewCards({ salesCount, totalSalesRevenue, totalDeals }: SalesOverviewCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Sales
          </CardTitle>
          <Users className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{salesCount}</div>
          <p className="text-xs text-gray-500">
            Anggota tim sales
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Revenue
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(totalSalesRevenue)}
          </div>
          <p className="text-xs text-gray-500">
            Revenue dari sales
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Deals
          </CardTitle>
          <Award className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalDeals}</div>
          <p className="text-xs text-gray-500">
            Transaksi berhasil
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Avg Deal Size
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {totalDeals > 0 ? formatCurrency(totalSalesRevenue / totalDeals) : formatCurrency(0)}
          </div>
          <p className="text-xs text-gray-500">
            Rata-rata per deal
          </p>
        </CardContent>
      </Card>
    </div>
  )
}