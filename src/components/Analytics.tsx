import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Award, 
  MapPin, 
  Star, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Filter, 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  DollarSign, 
  Target, 
  Activity, 
  BarChart3, 
  GitCompare 
} from 'lucide-react'
import { useParticipants } from '@/hooks/useParticipants'
import { useTransactions, useTransactionSummary } from '@/hooks/useTransactions'
import { useSales } from '@/hooks/useSales'
import { useDestinations } from '@/hooks/useDestinations'
import { formatCurrency } from '@/lib/utils'
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  startOfYear, 
  endOfYear, 
  subMonths, 
  subYears,
  addMonths,
  addYears,
  parseISO,
  eachMonthOfInterval,
  eachYearOfInterval
} from 'date-fns'

type TimeFilter = 'monthly' | 'yearly' | 'all'
type ComparisonMode = 'auto' | 'custom'

interface PeriodDates {
  currentPeriod: {
    startDate: string
    endDate: string
    label: string
  }
  previousPeriod: {
    startDate: string
    endDate: string
    label: string
  }
}

interface CustomPeriod {
  startDate: string
  endDate: string
  label: string
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function Analytics() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly')
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('auto')
  
  // Custom comparison states
  const [customPeriod1, setCustomPeriod1] = useState<CustomPeriod>({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    label: 'Periode 1'
  })
  
  const [customPeriod2, setCustomPeriod2] = useState<CustomPeriod>({
    startDate: format(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    label: 'Periode 2'
  })

  // Helper function to get period dates
  const getPeriodDates = (filter: TimeFilter, date: Date): PeriodDates => {
    if (filter === 'monthly') {
      const currentStart = startOfMonth(date)
      const currentEnd = endOfMonth(date)
      const previousStart = startOfMonth(subMonths(date, 1))
      const previousEnd = endOfMonth(subMonths(date, 1))

      return {
        currentPeriod: {
          startDate: format(currentStart, 'yyyy-MM-dd'),
          endDate: format(currentEnd, 'yyyy-MM-dd'),
          label: format(date, 'MMMM yyyy')
        },
        previousPeriod: {
          startDate: format(previousStart, 'yyyy-MM-dd'),
          endDate: format(previousEnd, 'yyyy-MM-dd'),
          label: format(subMonths(date, 1), 'MMMM yyyy')
        }
      }
    } else if (filter === 'yearly') {
      const currentStart = startOfYear(date)
      const currentEnd = endOfYear(date)
      const previousStart = startOfYear(subYears(date, 1))
      const previousEnd = endOfYear(subYears(date, 1))

      return {
        currentPeriod: {
          startDate: format(currentStart, 'yyyy-MM-dd'),
          endDate: format(currentEnd, 'yyyy-MM-dd'),
          label: format(date, 'yyyy')
        },
        previousPeriod: {
          startDate: format(previousStart, 'yyyy-MM-dd'),
          endDate: format(previousEnd, 'yyyy-MM-dd'),
          label: format(subYears(date, 1), 'yyyy')
        }
      }
    } else {
      // All time - no date filters
      return {
        currentPeriod: {
          startDate: '',
          endDate: '',
          label: 'Semua Waktu'
        },
        previousPeriod: {
          startDate: '',
          endDate: '',
          label: ''
        }
      }
    }
  }

  const periodDates = useMemo(() => {
    if (comparisonMode === 'custom') {
      return {
        currentPeriod: customPeriod1,
        previousPeriod: customPeriod2
      }
    }
    return getPeriodDates(timeFilter, selectedDate)
  }, [timeFilter, selectedDate, comparisonMode, customPeriod1, customPeriod2])

  // Fetch data for current period
  const currentFilters = (timeFilter === 'all' && comparisonMode === 'auto') 
    ? {}
    : {
        startDate: periodDates.currentPeriod.startDate,
        endDate: periodDates.currentPeriod.endDate
      }

  // Fetch data for previous period (for comparison)
  const previousFilters = (timeFilter === 'all' && comparisonMode === 'auto') 
    ? undefined
    : {
        startDate: periodDates.previousPeriod.startDate,
        endDate: periodDates.previousPeriod.endDate
      }

  const { participants: currentParticipants, loading: participantsLoading } = useParticipants(currentFilters)
  const { participants: previousParticipants } = useParticipants(previousFilters)
  const { transactions: currentTransactions, loading: transactionsLoading } = useTransactions(currentFilters)
  const { transactions: previousTransactions } = useTransactions(previousFilters)
  const currentSummary = useTransactionSummary(currentFilters)
  const previousSummary = useTransactionSummary(previousFilters)
  const { sales, loading: salesLoading } = useSales()
  const { destinations, loading: destinationsLoading } = useDestinations()

  // Navigation functions
  const navigatePeriod = (direction: 'prev' | 'next') => {
    if (timeFilter === 'monthly') {
      setSelectedDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1))
    } else if (timeFilter === 'yearly') {
      setSelectedDate(prev => direction === 'prev' ? subYears(prev, 1) : addYears(prev, 1))
    }
  }

  // Calculate percentage change
  const calculateChange = (current: number, previous: number): { percentage: number, direction: 'up' | 'down' | 'same' } => {
    if (previous === 0) {
      return { percentage: current > 0 ? 100 : 0, direction: current > 0 ? 'up' : 'same' }
    }
    const change = ((current - previous) / previous) * 100
    return {
      percentage: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'same'
    }
  }

  // Prepare chart data for financial trends
  const chartData = useMemo(() => {
    if (comparisonMode === 'custom') {
      // For custom comparison, show bar chart comparing the two periods
      return [
        {
          period: periodDates.currentPeriod.label,
          income: currentSummary.totalIncome,
          expense: currentSummary.totalExpense,
          profit: currentSummary.totalIncome - currentSummary.totalExpense
        },
        {
          period: periodDates.previousPeriod.label,
          income: previousSummary.totalIncome,
          expense: previousSummary.totalExpense,
          profit: previousSummary.totalIncome - previousSummary.totalExpense
        }
      ]
    }

    if (timeFilter === 'all') {
      // For all time, group by month for the last 12 months
      const endDate = new Date()
      const startDate = subMonths(endDate, 11)
      const months = eachMonthOfInterval({ start: startDate, end: endDate })
      
      return months.map(month => {
        const monthStart = format(startOfMonth(month), 'yyyy-MM-dd')
        const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd')
        
        const monthTransactions = currentTransactions.filter(t => 
          t.transaction_date >= monthStart && t.transaction_date <= monthEnd
        )
        
        const income = monthTransactions
          .filter(t => t.transaction_type === 'Pemasukan')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const expense = monthTransactions
          .filter(t => t.transaction_type === 'Pengeluaran')
          .reduce((sum, t) => sum + t.amount, 0)
        
        return {
          period: format(month, 'MMM yyyy'),
          income,
          expense,
          profit: income - expense
        }
      })
    } else if (timeFilter === 'yearly') {
      // For yearly, show last 5 years
      const endDate = new Date()
      const startDate = subYears(endDate, 4)
      const years = eachYearOfInterval({ start: startDate, end: endDate })
      
      return years.map(year => {
        const yearStart = format(startOfYear(year), 'yyyy-MM-dd')
        const yearEnd = format(endOfYear(year), 'yyyy-MM-dd')
        
        const yearTransactions = currentTransactions.filter(t => 
          t.transaction_date >= yearStart && t.transaction_date <= yearEnd
        )
        
        const income = yearTransactions
          .filter(t => t.transaction_type === 'Pemasukan')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const expense = yearTransactions
          .filter(t => t.transaction_type === 'Pengeluaran')
          .reduce((sum, t) => sum + t.amount, 0)
        
        return {
          period: format(year, 'yyyy'),
          income,
          expense,
          profit: income - expense
        }
      })
    } else {
      // For monthly, show last 12 months
      const months = eachMonthOfInterval({ 
        start: subMonths(selectedDate, 11), 
        end: selectedDate 
      })
      
      return months.map(month => {
        const monthStart = format(startOfMonth(month), 'yyyy-MM-dd')
        const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd')
        
        const monthTransactions = currentTransactions.filter(t => 
          t.transaction_date >= monthStart && t.transaction_date <= monthEnd
        )
        
        const income = monthTransactions
          .filter(t => t.transaction_type === 'Pemasukan')
          .reduce((sum, t) => sum + t.amount, 0)
        
        const expense = monthTransactions
          .filter(t => t.transaction_type === 'Pengeluaran')
          .reduce((sum, t) => sum + t.amount, 0)
        
        return {
          period: format(month, 'MMM yyyy'),
          income,
          expense,
          profit: income - expense
        }
      })
    }
  }, [currentTransactions, timeFilter, selectedDate, comparisonMode, currentSummary, previousSummary, periodDates])

  // Prepare trip type distribution data for both periods (based on revenue)
  const tripTypeData = useMemo(() => {
    const currentTripTypeRevenue = currentParticipants.reduce((acc, participant) => {
      const tripType = participant.trips?.trip_type || 'Belum Ditentukan'
      acc[tripType] = (acc[tripType] || 0) + (participant.package_price * participant.participant_count)
      return acc
    }, {} as Record<string, number>)

    const previousTripTypeRevenue = previousParticipants.reduce((acc, participant) => {
      const tripType = participant.trips?.trip_type || 'Belum Ditentukan'
      acc[tripType] = (acc[tripType] || 0) + (participant.package_price * participant.participant_count)
      return acc
    }, {} as Record<string, number>)

    if (comparisonMode === 'custom') {
      // For custom comparison, show comparison data
      const allTripTypes = new Set([...Object.keys(currentTripTypeRevenue), ...Object.keys(previousTripTypeRevenue)])
      
      return Array.from(allTripTypes).map(type => ({
        name: type,
        current: currentTripTypeRevenue[type] || 0,
        previous: previousTripTypeRevenue[type] || 0
      }))
    }

    // For regular mode, show current period data
    const totalRevenue = Object.values(currentTripTypeRevenue).reduce((sum, revenue) => sum + revenue, 0)
    
    return Object.entries(currentTripTypeRevenue).map(([type, revenue]) => ({
      name: type,
      value: revenue,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0
    }))
  }, [currentParticipants, previousParticipants, comparisonMode])

  // Calculate sales performance with trip type breakdown
  const salesPerformance = sales.map(sale => {
    const saleParticipants = currentParticipants.filter(p => p.sales_id === sale.id)
    const totalRevenue = saleParticipants.reduce((sum, p) => sum + (p.package_price * p.participant_count), 0)
    const conversionRate = saleParticipants.length > 0 ? Math.min((saleParticipants.length / 10) * 100, 100) : 0 // Mock conversion rate
    
    // Group by trip type
    const tripTypeBreakdown = saleParticipants.reduce((acc, p) => {
      const tripType = p.trips?.trip_type || 'Belum Ditentukan'
      if (!acc[tripType]) {
        acc[tripType] = { count: 0, revenue: 0 }
      }
      acc[tripType].count += p.participant_count
      acc[tripType].revenue += (p.package_price * p.participant_count)
      return acc
    }, {} as Record<string, { count: number, revenue: number }>)
    
    return {
      ...sale,
      participantCount: saleParticipants.reduce((sum, p) => sum + p.participant_count, 0),
      totalRevenue,
      conversionRate,
      tripTypeBreakdown
    }
  }).sort((a, b) => b.totalRevenue - a.totalRevenue)

  // Calculate destination popularity with trip type breakdown
  const destinationStats = destinations.map(destination => {
    const destinationParticipants = currentParticipants.filter(p => 
      p.trips?.destinations?.some(d => d.id === destination.id)
    )
    
    // Group by trip type
    const tripTypeBreakdown = destinationParticipants.reduce((acc, p) => {
      const tripType = p.trips?.trip_type || 'Belum Ditentukan'
      if (!acc[tripType]) {
        acc[tripType] = { count: 0, revenue: 0 }
      }
      acc[tripType].count += p.participant_count
      acc[tripType].revenue += (p.package_price * p.participant_count)
      return acc
    }, {} as Record<string, { count: number, revenue: number }>)
    
    return {
      ...destination,
      participantCount: destinationParticipants.reduce((sum, p) => sum + p.participant_count, 0),
      revenue: destinationParticipants.reduce((sum, p) => sum + (p.package_price * p.participant_count), 0),
      tripTypeBreakdown
    }
  }).sort((a, b) => b.participantCount - a.participantCount)

  // Key metrics with comparison
  const metrics = {
    participants: {
      current: currentParticipants.reduce((sum, p) => sum + p.participant_count, 0),
      previous: previousParticipants.reduce((sum, p) => sum + p.participant_count, 0),
      change: calculateChange(
        currentParticipants.reduce((sum, p) => sum + p.participant_count, 0),
        previousParticipants.reduce((sum, p) => sum + p.participant_count, 0)
      )
    },
    revenue: {
      current: currentSummary.totalIncome,
      previous: previousSummary.totalIncome,
      change: calculateChange(currentSummary.totalIncome, previousSummary.totalIncome)
    },
    profitMargin: {
      current: currentSummary.totalIncome > 0 ? ((currentSummary.totalIncome - currentSummary.totalExpense) / currentSummary.totalIncome) * 100 : 0,
      previous: previousSummary.totalIncome > 0 ? ((previousSummary.totalIncome - previousSummary.totalExpense) / previousSummary.totalIncome) * 100 : 0,
      change: calculateChange(
        currentSummary.totalIncome > 0 ? ((currentSummary.totalIncome - currentSummary.totalExpense) / currentSummary.totalIncome) * 100 : 0,
        previousSummary.totalIncome > 0 ? ((previousSummary.totalIncome - previousSummary.totalExpense) / previousSummary.totalIncome) * 100 : 0
      )
    },
    avgPerTrip: {
      current: currentParticipants.length > 0 ? currentParticipants.reduce((sum, p) => sum + p.participant_count, 0) / Math.max(destinationStats.filter(d => d.participantCount > 0).length, 1) : 0,
      previous: previousParticipants.length > 0 ? previousParticipants.reduce((sum, p) => sum + p.participant_count, 0) / Math.max(destinationStats.filter(d => d.participantCount > 0).length, 1) : 0,
      change: calculateChange(
        currentParticipants.length > 0 ? currentParticipants.reduce((sum, p) => sum + p.participant_count, 0) / Math.max(destinationStats.filter(d => d.participantCount > 0).length, 1) : 0,
        previousParticipants.length > 0 ? previousParticipants.reduce((sum, p) => sum + p.participant_count, 0) / Math.max(destinationStats.filter(d => d.participantCount > 0).length, 1) : 0
      )
    }
  }

  const getChangeIcon = (direction: 'up' | 'down' | 'same') => {
    switch (direction) {
      case 'up':
        return <ArrowUp className="h-3 w-3 text-green-600" />
      case 'down':
        return <ArrowDown className="h-3 w-3 text-red-600" />
      default:
        return <Minus className="h-3 w-3 text-gray-400" />
    }
  }

  const getChangeColor = (direction: 'up' | 'down' | 'same') => {
    switch (direction) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-400'
    }
  }

  const getComparisonLabel = () => {
    if (comparisonMode === 'custom') {
      return `vs ${periodDates.previousPeriod.label}`
    }
    if (timeFilter === 'monthly') return 'vs bulan lalu'
    if (timeFilter === 'yearly') return 'vs tahun lalu'
    return ''
  }

  // Update custom period labels when dates change
  const updateCustomPeriodLabel = (period: 'period1' | 'period2', startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    // Generate smart label based on date range
    let label = ''
    if (format(start, 'yyyy-MM') === format(end, 'yyyy-MM')) {
      // Same month
      label = format(start, 'MMMM yyyy')
    } else if (format(start, 'yyyy') === format(end, 'yyyy')) {
      // Same year
      label = `${format(start, 'MMM')} - ${format(end, 'MMM yyyy')}`
    } else {
      // Different years
      label = `${format(start, 'MMM yyyy')} - ${format(end, 'MMM yyyy')}`
    }

    if (period === 'period1') {
      setCustomPeriod1(prev => ({ ...prev, label }))
    } else {
      setCustomPeriod2(prev => ({ ...prev, label }))
    }
  }

  if (participantsLoading || transactionsLoading || salesLoading || destinationsLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analisis & Performance</h1>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analisis & Performance</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>Data real-time</span>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Analisis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Comparison Mode Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Mode Perbandingan</Label>
                <Select value={comparisonMode} onValueChange={(value: ComparisonMode) => setComparisonMode(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Perbandingan Otomatis</SelectItem>
                    <SelectItem value="custom">Perbandingan Kustom</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500">
                  {comparisonMode === 'auto' 
                    ? 'Bandingkan dengan periode sebelumnya secara otomatis'
                    : 'Pilih dua periode kustom untuk dibandingkan'
                  }
                </p>
              </div>

              {comparisonMode === 'auto' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Periode Waktu</Label>
                  <Select value={timeFilter} onValueChange={(value: TimeFilter) => setTimeFilter(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Bulanan</SelectItem>
                      <SelectItem value="yearly">Tahunan</SelectItem>
                      <SelectItem value="all">Semua Waktu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Auto Mode Navigation */}
            {comparisonMode === 'auto' && timeFilter !== 'all' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Navigasi Periode</Label>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigatePeriod('prev')}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 text-center text-sm font-medium">
                    {periodDates.currentPeriod.label}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigatePeriod('next')}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Custom Mode Date Pickers */}
            {comparisonMode === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 border rounded-lg bg-blue-50">
                <div className="space-y-3">
                  <Label className="text-base font-semibold text-blue-800 flex items-center space-x-2">
                    <GitCompare className="h-4 w-4" />
                    <span>Periode 1</span>
                  </Label>
                  <div className="space-y-2">
                    <Label className="text-sm">Tanggal Mulai</Label>
                    <Input
                      type="date"
                      value={customPeriod1.startDate}
                      onChange={(e) => {
                        const newStartDate = e.target.value
                        setCustomPeriod1(prev => ({ ...prev, startDate: newStartDate }))
                        updateCustomPeriodLabel('period1', newStartDate, customPeriod1.endDate)
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Tanggal Selesai</Label>
                    <Input
                      type="date"
                      value={customPeriod1.endDate}
                      onChange={(e) => {
                        const newEndDate = e.target.value
                        setCustomPeriod1(prev => ({ ...prev, endDate: newEndDate }))
                        updateCustomPeriodLabel('period1', customPeriod1.startDate, newEndDate)
                      }}
                    />
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <div className="text-xs text-gray-600">Label:</div>
                    <div className="font-medium text-blue-700">{customPeriod1.label}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold text-blue-800 flex items-center space-x-2">
                    <GitCompare className="h-4 w-4" />
                    <span>Periode 2</span>
                  </Label>
                  <div className="space-y-2">
                    <Label className="text-sm">Tanggal Mulai</Label>
                    <Input
                      type="date"
                      value={customPeriod2.startDate}
                      onChange={(e) => {
                        const newStartDate = e.target.value
                        setCustomPeriod2(prev => ({ ...prev, startDate: newStartDate }))
                        updateCustomPeriodLabel('period2', newStartDate, customPeriod2.endDate)
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Tanggal Selesai</Label>
                    <Input
                      type="date"
                      value={customPeriod2.endDate}
                      onChange={(e) => {
                        const newEndDate = e.target.value
                        setCustomPeriod2(prev => ({ ...prev, endDate: newEndDate }))
                        updateCustomPeriodLabel('period2', customPeriod2.startDate, newEndDate)
                      }}
                    />
                  </div>
                  <div className="p-2 bg-white rounded border">
                    <div className="text-xs text-gray-600">Label:</div>
                    <div className="font-medium text-blue-700">{customPeriod2.label}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics with Comparison */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Peserta
            </CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.participants.current}</div>
            {(timeFilter !== 'all' || comparisonMode === 'custom') && (
              <div className={`flex items-center space-x-1 text-xs ${getChangeColor(metrics.participants.change.direction)}`}>
                {getChangeIcon(metrics.participants.change.direction)}
                <span>{metrics.participants.change.percentage.toFixed(1)}% {getComparisonLabel()}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Peserta terdaftar
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.revenue.current)}</div>
            {(timeFilter !== 'all' || comparisonMode === 'custom') && (
              <div className={`flex items-center space-x-1 text-xs ${getChangeColor(metrics.revenue.change.direction)}`}>
                {getChangeIcon(metrics.revenue.change.direction)}
                <span>{metrics.revenue.change.percentage.toFixed(1)}% {getComparisonLabel()}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Total pemasukan
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Profit Margin
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.profitMargin.current.toFixed(1)}%</div>
            {(timeFilter !== 'all' || comparisonMode === 'custom') && (
              <div className={`flex items-center space-x-1 text-xs ${getChangeColor(metrics.profitMargin.change.direction)}`}>
                {getChangeIcon(metrics.profitMargin.change.direction)}
                <span>{metrics.profitMargin.change.percentage.toFixed(1)}% {getComparisonLabel()}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Margin keuntungan
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Avg per Trip
            </CardTitle>
            <Target className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(metrics.avgPerTrip.current)}
            </div>
            {(timeFilter !== 'all' || comparisonMode === 'custom') && (
              <div className={`flex items-center space-x-1 text-xs ${getChangeColor(metrics.avgPerTrip.change.direction)}`}>
                {getChangeIcon(metrics.avgPerTrip.change.direction)}
                <span>{metrics.avgPerTrip.change.percentage.toFixed(1)}% {getComparisonLabel()}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Peserta per trip
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Financial Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {comparisonMode === 'custom' ? <BarChart3 className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
              <span>
                {comparisonMode === 'custom' ? 'Perbandingan Keuangan' : 'Trend Keuangan'}
              </span>
              {comparisonMode === 'auto' && timeFilter !== 'all' && (
                <Badge variant="outline" className="ml-2">
                  {timeFilter === 'monthly' ? 'Bulanan' : 'Tahunan'}
                </Badge>
              )}
              {comparisonMode === 'custom' && (
                <Badge variant="outline" className="ml-2">
                  Perbandingan Kustom
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {comparisonMode === 'custom' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `Periode: ${label}`}
                  />
                  <Legend />
                  <Bar dataKey="income" fill="#10B981" name="Pemasukan" />
                  <Bar dataKey="expense" fill="#EF4444" name="Pengeluaran" />
                  <Bar dataKey="profit" fill="#3B82F6" name="Profit" />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis tickFormatter={(value) => formatCurrency(value)} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), '']}
                    labelFormatter={(label) => `Periode: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="income" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    name="Pemasukan"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="expense" 
                    stroke="#EF4444" 
                    strokeWidth={2}
                    name="Pengeluaran"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    name="Profit"
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Trip Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Distribusi Revenue per Jenis Trip</span>
              {comparisonMode === 'auto' && timeFilter !== 'all' && (
                <Badge variant="outline" className="ml-2">
                  {periodDates.currentPeriod.label}
                </Badge>
              )}
              {comparisonMode === 'custom' && (
                <Badge variant="outline" className="ml-2">
                  Perbandingan
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {tripTypeData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada data peserta untuk periode ini</p>
              </div>
            ) : (
              <div className="space-y-4">
                {comparisonMode === 'custom' ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={tripTypeData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                      <Legend />
                      <Bar dataKey="current" fill="#3B82F6" name={periodDates.currentPeriod.label} />
                      <Bar dataKey="previous" fill="#10B981" name={periodDates.previousPeriod.label} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={tripTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {tripTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => [formatCurrency(value), '']} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
                
                <div className="grid grid-cols-1 gap-2">
                  {comparisonMode === 'custom' ? (
                    tripTypeData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(item.current)} vs {formatCurrency(item.previous)}
                        </div>
                      </div>
                    ))
                  ) : (
                    tripTypeData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {formatCurrency(item.value)} ({item.percentage.toFixed(1)}%)
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Period Comparison Summary */}
      {(timeFilter !== 'all' || comparisonMode === 'custom') && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800 flex items-center space-x-2">
              <GitCompare className="h-5 w-5" />
              <span>
                Perbandingan Periode: {periodDates.currentPeriod.label} vs {periodDates.previousPeriod.label}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-600">Peserta</div>
                <div className="font-semibold">{metrics.participants.current} vs {metrics.participants.previous}</div>
                <div className={`text-xs ${getChangeColor(metrics.participants.change.direction)}`}>
                  {metrics.participants.change.direction === 'up' ? '+' : metrics.participants.change.direction === 'down' ? '-' : ''}
                  {metrics.participants.change.percentage.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-gray-600">Revenue</div>
                <div className="font-semibold">{formatCurrency(metrics.revenue.current)} vs {formatCurrency(metrics.revenue.previous)}</div>
                <div className={`text-xs ${getChangeColor(metrics.revenue.change.direction)}`}>
                  {metrics.revenue.change.direction === 'up' ? '+' : metrics.revenue.change.direction === 'down' ? '-' : ''}
                  {metrics.revenue.change.percentage.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-gray-600">Profit Margin</div>
                <div className="font-semibold">{metrics.profitMargin.current.toFixed(1)}% vs {metrics.profitMargin.previous.toFixed(1)}%</div>
                <div className={`text-xs ${getChangeColor(metrics.profitMargin.change.direction)}`}>
                  {metrics.profitMargin.change.direction === 'up' ? '+' : metrics.profitMargin.change.direction === 'down' ? '-' : ''}
                  {metrics.profitMargin.change.percentage.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-gray-600">Jenis Trip Terpopuler</div>
                <div className="font-semibold">
                  {comparisonMode === 'custom' 
                    ? (tripTypeData.length > 0 ? tripTypeData.reduce((max, item) => item.current > max.current ? item : max, tripTypeData[0]).name : 'N/A')
                    : (tripTypeData.length > 0 ? tripTypeData[0].name : 'N/A')
                  }
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Performance with Trip Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Performance Sales</span>
              {(timeFilter !== 'all' || comparisonMode === 'custom') && (
                <Badge variant="outline" className="ml-2">
                  {periodDates.currentPeriod.label}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {salesPerformance.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada data sales untuk periode ini</p>
              </div>
            ) : (
              <div className="space-y-4">
                {salesPerformance.slice(0, 5).map((sale, index) => (
                  <div key={sale.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{sale.name}</span>
                        {index === 0 && <Star className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <div className="text-sm text-gray-500">
                        {sale.participantCount} peserta
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Revenue: {formatCurrency(sale.totalRevenue)}</span>
                        <span>Conversion: {sale.conversionRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={sale.conversionRate} className="h-2" />
                      
                      {/* Trip Type Breakdown */}
                      {Object.keys(sale.tripTypeBreakdown).length > 0 && (
                        <div className="mt-3 pt-2 border-t">
                          <div className="text-xs text-gray-600 mb-2">Breakdown Jenis Trip:</div>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(sale.tripTypeBreakdown).map(([tripType, data]) => (
                              <Badge key={tripType} variant="outline" className="text-xs">
                                {tripType}: {formatCurrency(data.revenue)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Popular Destinations with Trip Type Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span>Destinasi Populer</span>
              {(timeFilter !== 'all' || comparisonMode === 'custom') && (
                <Badge variant="outline" className="ml-2">
                  {periodDates.currentPeriod.label}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {destinationStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada data destinasi untuk periode ini</p>
              </div>
            ) : (
              <div className="space-y-4">
                {destinationStats.slice(0, 5).map((destination, index) => {
                  const maxParticipants = Math.max(...destinationStats.map(d => d.participantCount))
                  const progressPercentage = maxParticipants > 0 ? (destination.participantCount / maxParticipants) * 100 : 0
                  
                  return (
                    <div key={destination.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant={index === 0 ? "default" : "secondary"}>
                            #{index + 1}
                          </Badge>
                          <span className="font-medium">{destination.name}</span>
                          {index === 0 && <Star className="h-4 w-4 text-yellow-500" />}
                        </div>
                        <div className="text-sm text-gray-500">
                          {destination.participantCount} peserta
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Revenue: {formatCurrency(destination.revenue)}</span>
                          <span>{progressPercentage.toFixed(0)}% dari total</span>
                        </div>
                        <Progress value={progressPercentage} className="h-2" />
                        
                        {/* Trip Type Breakdown */}
                        {Object.keys(destination.tripTypeBreakdown).length > 0 && (
                          <div className="mt-3 pt-2 border-t">
                            <div className="text-xs text-gray-600 mb-2">Breakdown Jenis Trip:</div>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(destination.tripTypeBreakdown).map(([tripType, data]) => (
                                <Badge key={tripType} variant="outline" className="text-xs">
                                  {tripType}: {formatCurrency(data.revenue)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievement Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Achievement & Milestones</span>
            {(timeFilter !== 'all' || comparisonMode === 'custom') && (
              <Badge variant="outline" className="ml-2">
                {periodDates.currentPeriod.label}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 border rounded-lg text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <div className="font-semibold">Top Performer</div>
              <div className="text-sm text-gray-500">
                {salesPerformance[0]?.name || 'Belum ada'}
              </div>
            </div>
            
            <div className="p-4 border rounded-lg text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <div className="font-semibold">Most Popular</div>
              <div className="text-sm text-gray-500">
                {destinationStats[0]?.name || 'Belum ada'}
              </div>
            </div>
            
            <div className="p-4 border rounded-lg text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <div className="font-semibold">Best Margin</div>
              <div className="text-sm text-gray-500">
                {metrics.profitMargin.current.toFixed(1)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}