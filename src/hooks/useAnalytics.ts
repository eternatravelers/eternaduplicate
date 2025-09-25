import { useState, useEffect } from 'react'
import { useTransactions } from './useTransactions'
import { useParticipants } from './useParticipants'
import { useTrips } from './useTrips'
import { useSales } from './useSales'

export function useAnalytics() {
  const [loading, setLoading] = useState(true)
  const { transactions } = useTransactions()
  const { participants } = useParticipants()
  const { trips } = useTrips()
  const { sales } = useSales()

  const [analyticsData, setAnalyticsData] = useState({
    revenueChart: [] as Array<{
      month: string
      income: number
      expense: number
      profit: number
    }>,
    tripPerformance: [] as Array<{
      name: string
      participants: number
      revenue: number
      quota: number
    }>,
    expenseCategories: [] as Array<{
      name: string
      value: number
      color: string
    }>,
    salesPerformance: [] as Array<{
      name: string
      revenue: number
      deals: number
      participants: number
    }>,
    stats: {
      totalRevenue: 0,
      totalExpense: 0,
      profitMargin: 0,
      totalTrips: 0,
      totalParticipants: 0,
      avgRevenuePerTrip: 0,
      avgParticipantsPerTrip: 0,
      growthRate: 0
    }
  })

  useEffect(() => {
    const processAnalyticsData = () => {
      setLoading(true)

      // Calculate basic stats
      const totalRevenue = transactions
        .filter(t => t.transaction_type === 'Pemasukan')
        .reduce((sum, t) => sum + t.amount, 0)
      
      const totalExpense = transactions
        .filter(t => t.transaction_type === 'Pengeluaran')
        .reduce((sum, t) => sum + t.amount, 0)

      const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalExpense) / totalRevenue) * 100 : 0
      const totalTrips = trips.length
      const totalParticipants = participants.length
      const avgRevenuePerTrip = totalTrips > 0 ? totalRevenue / totalTrips : 0
      const avgParticipantsPerTrip = totalTrips > 0 ? totalParticipants / totalTrips : 0

      // Calculate growth rate (simplified - comparing last 2 months)
      const now = new Date()
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1)

      const lastMonthRevenue = transactions
        .filter(t => {
          const date = new Date(t.transaction_date)
          return t.transaction_type === 'Pemasukan' && date >= lastMonth && date < now
        })
        .reduce((sum, t) => sum + t.amount, 0)

      const twoMonthsAgoRevenue = transactions
        .filter(t => {
          const date = new Date(t.transaction_date)
          return t.transaction_type === 'Pemasukan' && date >= twoMonthsAgo && date < lastMonth
        })
        .reduce((sum, t) => sum + t.amount, 0)

      const growthRate = twoMonthsAgoRevenue > 0 
        ? ((lastMonthRevenue - twoMonthsAgoRevenue) / twoMonthsAgoRevenue) * 100 
        : 0

      // Generate revenue chart data (last 6 months)
      const revenueChart = []
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const nextDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
        
        const monthTransactions = transactions.filter(t => {
          const tDate = new Date(t.transaction_date)
          return tDate >= date && tDate < nextDate
        })

        const income = monthTransactions
          .filter(t => t.transaction_type === 'Pemasukan')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const expense = monthTransactions
          .filter(t => t.transaction_type === 'Pengeluaran')
          .reduce((sum, t) => sum + t.amount, 0)

        revenueChart.push({
          month: date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
          income,
          expense,
          profit: income - expense
        })
      }

      // Generate trip performance data
      const tripPerformance = trips.map(trip => {
        const tripParticipants = participants.filter(p => p.trip_id === trip.id)
        const tripRevenue = tripParticipants.reduce((sum, p) => sum + p.package_price, 0)
        const participantCount = tripParticipants.reduce((sum, p) => sum + p.participant_count, 0)

        return {
          name: trip.name.length > 20 ? trip.name.substring(0, 20) + '...' : trip.name,
          participants: participantCount,
          revenue: tripRevenue,
          quota: trip.quota || 0
        }
      }).sort((a, b) => b.revenue - a.revenue).slice(0, 10)

      // Generate expense categories data
      const expenseByCategory = transactions
        .filter(t => t.transaction_type === 'Pengeluaran')
        .reduce((acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + t.amount
          return acc
        }, {} as Record<string, number>)

      const expenseCategories = Object.entries(expenseByCategory)
        .map(([name, value], index) => ({
          name,
          value,
          color: `hsl(${index * 45}, 70%, 50%)`
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

      // Generate sales performance data
      const salesPerformance = sales.map(sale => {
        const saleParticipants = participants.filter(p => p.sales_id === sale.id)
        const revenue = saleParticipants.reduce((sum, p) => sum + p.package_price, 0)
        const participantCount = saleParticipants.reduce((sum, p) => sum + p.participant_count, 0)

        return {
          name: sale.name,
          revenue,
          deals: saleParticipants.length,
          participants: participantCount
        }
      }).sort((a, b) => b.revenue - a.revenue)

      setAnalyticsData({
        revenueChart,
        tripPerformance,
        expenseCategories,
        salesPerformance,
        stats: {
          totalRevenue,
          totalExpense,
          profitMargin,
          totalTrips,
          totalParticipants,
          avgRevenuePerTrip,
          avgParticipantsPerTrip,
          growthRate
        }
      })

      setLoading(false)
    }

    processAnalyticsData()
  }, [transactions, participants, trips, sales])

  return { analyticsData, loading }
}