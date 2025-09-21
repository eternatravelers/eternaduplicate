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
      console.time('fetchDashboardData')
      setLoading(true)
      
      // Fetch all required data
      console.time('fetchParticipants')
      const [
        { data: participants },
      ] = await Promise.all([
        supabase.from('participants').select('*')
      ])
      console.timeEnd('fetchParticipants')
      
      console.time('fetchTransactions')
      const [
        { data: transactions },
      ] = await Promise.all([
        supabase.from('transactions').select('*').eq('status', 'active')
      ])
      console.timeEnd('fetchTransactions')
      
      console.time('fetchTrips')
      const [
        { data: trips }
      ] = await Promise.all([
        supabase
          .from('trips')
          .select(`
            id,
            name,
            departure_date,
            return_date,
            quota,
            status,
            meeting_point,
            price,
            participants!left(id),
            trip_destinations!left(
              destinations(
                id,
                name
              )
            )
          `)
          .eq('status', 'active')
      ])
      console.timeEnd('fetchTrips')

      console.time('processData')
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

      // Process trips data with proper structure
      const processedTrips = trips?.map(trip => ({
        ...trip,
        participant_count: trip.participants?.length || 0,
        destinations: trip.trip_destinations?.map(td => td.destinations).filter(Boolean) || []
      })) || []

      // Set upcoming trips
      const today = new Date().toISOString().split('T')[0]
      const upcoming = processedTrips
        .filter(trip => trip.departure_date >= today)
        .sort((a, b) => new Date(a.departure_date).getTime() - new Date(b.departure_date).getTime())
        .slice(0, 5)
      
      setUpcomingTrips(upcoming)
      console.timeEnd('processData')

      console.log('Dashboard data loaded:', {
        participantsCount: participants?.length || 0,
        transactionsCount: transactions?.length || 0,
        tripsCount: trips?.length || 0,
        stats,
        upcomingTripsCount: upcoming.length
      })

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      console.timeEnd('fetchDashboardData')
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