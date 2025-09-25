import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Users, MapPin, DollarSign, Percent } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface AnalyticsStatsCardsProps {
  stats: {
    totalRevenue: number
    totalExpense: number
    profitMargin: number
    totalTrips: number
    totalParticipants: number
    avgRevenuePerTrip: number
    avgParticipantsPerTrip: number
    growthRate: number
  }
}

export function AnalyticsStatsCards({ stats }: AnalyticsStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Revenue
          </CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(stats.totalRevenue)}
          </div>
          <p className="text-xs text-gray-500">
            Total pemasukan
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Profit Margin
          </CardTitle>
          <Percent className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.profitMargin.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500">
            Margin keuntungan
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Avg Revenue/Trip
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {formatCurrency(stats.avgRevenuePerTrip)}
          </div>
          <p className="text-xs text-gray-500">
            Rata-rata per trip
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Avg Participants/Trip
          </CardTitle>
          <Users className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {stats.avgParticipantsPerTrip.toFixed(1)}
          </div>
          <p className="text-xs text-gray-500">
            Rata-rata peserta
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Trips
          </CardTitle>
          <MapPin className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalTrips}
          </div>
          <p className="text-xs text-gray-500">
            Trip terdaftar
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Participants
          </CardTitle>
          <Users className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {stats.totalParticipants}
          </div>
          <p className="text-xs text-gray-500">
            Peserta terdaftar
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Growth Rate
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {stats.growthRate >= 0 ? '+' : ''}{stats.growthRate.toFixed(1)}%
          </div>
          <p className="text-xs text-gray-500">
            Pertumbuhan bulanan
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Expense
          </CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(stats.totalExpense)}
          </div>
          <p className="text-xs text-gray-500">
            Total pengeluaran
          </p>
        </CardContent>
      </Card>
    </div>
  )
}