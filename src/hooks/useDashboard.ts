import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useDashboard() {
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalParticipants: 0,
    totalRevenue: 0,
    activeTrips: 0,
    profitMargin: 0
  })
  const [recentTransactions, setRecentTransactions] = useState([])
  const [upcomingTrips, setUpcomingTrips] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Fetch all required data
      const [
        { data: participants },
        { data: transactions },
        { data: trips }
      ] = await Promise.all([
        supabase.from('participants').select('*'),
        supabase.from('transactions').select('*').eq('status', 'active'),
        supabase
          .from('trips')
          .select('id,name,departure_date,quota,status')
          .eq('status', 'active')
      ])

      // Calculate income and expenses
      const totalIncome = transactions?.filter(t => t.transaction_type === 'Pemasukan')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0
      const totalExpense = transactions?.filter(t => t.transaction_type === 'Pengeluaran')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0
      
      // Calculate stats
      const totalTrips = trips?.length || 0
      const totalParticipants = participants?.length || 0
      const totalRevenue = totalIncome // Omset is total income
      const activeTrips = trips?.filter(trip => trip.status === 'active').length || 0
      const profitMargin = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0

      setStats({
        totalTrips,
        totalParticipants,
        totalRevenue,
        activeTrips,
        profitMargin
      })

      // Set recent transactions (last 10)
      const sortedTransactions = transactions?.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, 10) || []
      setRecentTransactions(sortedTransactions)

      // Set upcoming trips
      const today = new Date().toISOString().split('T')[0]
      const upcoming = trips?.filter(trip => trip.departure_date >= today)
        .sort((a, b) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime())
        .slice(0, 5) || []
      setUpcomingTrips(upcoming)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    stats,
    recentTransactions,
    upcomingTrips,
    loading,
    refetch: fetchDashboardData
  }
}