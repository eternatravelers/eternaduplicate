import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, DollarSign, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface FinancialSummaryCardsProps {
  summaryData: {
    totalIncome: number
    totalExpense: number
    totalParticipants: number
    totalRevenue: number
  }
  profit: number
}

export function FinancialSummaryCards({ summaryData, profit }: FinancialSummaryCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Pemasukan
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summaryData.totalIncome)}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Pengeluaran
          </CardTitle>
          <DollarSign className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(summaryData.totalExpense)}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Profit
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(profit)}
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Peserta
          </CardTitle>
          <Users className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {summaryData.totalParticipants}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}