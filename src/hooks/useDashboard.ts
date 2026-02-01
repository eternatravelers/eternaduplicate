import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Trip = Database['public']['Tables']['trips']['Row'] & {
  destinations?: Database['public']['Tables']['destinations']['Row'][]
  participant_count?: number
}

export function useDashboard() {
  const [stats, setStats] = useState({
    totalTrips: 0,
    totalParticipants: 0,
    totalRevenue: 0,
    activeTrips: 0,
    profitMargin: 0
  })
  const [recentTransactions, setRecentTransactions] = useState([])
  const [upcomingTrips, setUpcomingTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      const today = new Date().toISOString().split('T')[0]

      // Fetch all required data - optimized queries
      const [
        { data: participants },
        { data: transactions },
        { data: trips }
      ] = await Promise.all([
        supabase.from('participants').select('id', { count: 'exact', head: true }),
        supabase.from('transactions').select('amount, transaction_type').eq('status', 'active'),
        supabase
          .from('trips')
          .select(`
            id,
            name,
            departure_date,
            quota,
            status,
            participants!left(id),
            trip_destinations!left(
              destinations(
                id,
                name
              )
            )
          `)
          .in('status', ['active', 'open', 'confirmed'])
          .gte('departure_date', today)
          .order('departure_date', { ascending: true })
          .limit(5)
      ])

      // Calculate income and expenses
      const totalIncome = transactions?.filter(t => t.transaction_type === 'Pemasukan')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0
      const totalExpense = transactions?.filter(t => t.transaction_type === 'Pengeluaran')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0
      
      // Get total counts more efficiently
      const { count: totalParticipantCount } = await supabase
        .from('participants')
        .select('*', { count: 'exact', head: true })

      const { count: totalTripCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })

      const { count: activeTripCount } = await supabase
        .from('trips')
        .select('*', { count: 'exact', head: true })
        .in('status', ['active', 'open', 'confirmed'])
        .gte('departure_date', today)

      // Calculate stats
      const totalTrips = totalTripCount || 0
      const totalParticipants = totalParticipantCount || 0
      const totalRevenue = totalIncome
      const activeTrips = activeTripCount || 0
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

      // Process trips data with proper structure
      const processedTrips = trips?.map(trip => ({
        ...trip,
        participant_count: trip.participants?.length || 0,
        destinations: trip.trip_destinations?.map(td => td.destinations).filter(Boolean) || []
      })) || []

      setUpcomingTrips(processedTrips)

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