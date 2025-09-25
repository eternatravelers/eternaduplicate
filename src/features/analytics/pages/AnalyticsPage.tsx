import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Activity, Download, RefreshCw, BarChart3, TrendingUp, PieChart } from 'lucide-react'
import { AnalyticsStatsCards } from '../components/AnalyticsStatsCards'
import { RevenueChart } from '../components/RevenueChart'
import { TripPerformanceChart } from '../components/TripPerformanceChart'
import { ExpenseCategoryChart } from '../components/ExpenseCategoryChart'
import { SalesPerformanceChart } from '../components/SalesPerformanceChart'
import { useAnalytics } from '@/hooks/useAnalytics'
import { useTrips } from '@/hooks/useTrips'

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const { analyticsData, loading } = useAnalytics()
  const { trips } = useTrips()

  const handleExport = () => {
    // Export functionality would be implemented here
    alert('Export functionality akan diimplementasikan')
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Analisis & Performance</h1>
        <div className="animate-pulse">
          <div className="grid gap-6 md:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analisis & Performance</h1>
          <p className="text-gray-600 mt-2">Analisis mendalam performa bisnis travel Anda</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Activity className="h-4 w-4" />
            <span>Data real-time</span>
          </div>
        </div>
      </div>

      <AnalyticsStatsCards stats={analyticsData.stats} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="financial">Financial</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="sales">Sales</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <RevenueChart data={analyticsData.revenueChart} />
            <TripPerformanceChart data={analyticsData.tripPerformance} />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <ExpenseCategoryChart data={analyticsData.expenseCategories} />
            <SalesPerformanceChart data={analyticsData.salesPerformance} />
          </div>
        </TabsContent>

        <TabsContent value="financial" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1">
            <RevenueChart data={analyticsData.revenueChart} />
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <ExpenseCategoryChart data={analyticsData.expenseCategories} />
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <span>Financial Insights</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Profit Analysis</h4>
                    <p className="text-sm text-green-700">
                      Margin keuntungan saat ini: <strong>{analyticsData.stats.profitMargin.toFixed(1)}%</strong>
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {analyticsData.stats.profitMargin >= 20 
                        ? 'Margin keuntungan sangat baik!' 
                        : analyticsData.stats.profitMargin >= 10 
                        ? 'Margin keuntungan cukup baik' 
                        : 'Perlu optimasi untuk meningkatkan margin'}
                    </p>
                  </div>
                  
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Revenue Insights</h4>
                    <p className="text-sm text-blue-700">
                      Rata-rata revenue per trip: <strong>{analyticsData.stats.avgRevenuePerTrip.toLocaleString('id-ID')}</strong>
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Growth rate: {analyticsData.stats.growthRate >= 0 ? '+' : ''}{analyticsData.stats.growthRate.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1">
            <TripPerformanceChart data={analyticsData.tripPerformance} />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                <span>Operational Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Trip Efficiency</h4>
                  <p className="text-sm text-blue-700">
                    Rata-rata peserta per trip: <strong>{analyticsData.stats.avgParticipantsPerTrip.toFixed(1)} orang</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    {analyticsData.stats.avgParticipantsPerTrip >= 20 
                      ? 'Efisiensi trip sangat baik!' 
                      : analyticsData.stats.avgParticipantsPerTrip >= 10 
                      ? 'Efisiensi trip cukup baik' 
                      : 'Perlu strategi untuk meningkatkan partisipasi'}
                  </p>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-purple-800 mb-2">Trip Portfolio</h4>
                  <p className="text-sm text-purple-700">
                    Total trip aktif: <strong>{trips.filter(t => t.status === 'active').length}</strong>
                  </p>
                  <p className="text-xs text-purple-600 mt-1">
                    Diversifikasi trip membantu mengurangi risiko bisnis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1">
            <SalesPerformanceChart data={analyticsData.salesPerformance} />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <PieChart className="h-5 w-5 text-purple-600" />
                <span>Sales Insights</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {analyticsData.salesPerformance.slice(0, 2).map((sale, index) => (
                  <div key={sale.name} className={`p-4 rounded-lg ${index === 0 ? 'bg-yellow-50' : 'bg-green-50'}`}>
                    <h4 className={`font-semibold mb-2 ${index === 0 ? 'text-yellow-800' : 'text-green-800'}`}>
                      {index === 0 ? '🏆 Top Performer' : '🥈 Runner Up'}
                    </h4>
                    <p className={`text-sm ${index === 0 ? 'text-yellow-700' : 'text-green-700'}`}>
                      <strong>{sale.name}</strong>
                    </p>
                    <p className={`text-xs mt-1 ${index === 0 ? 'text-yellow-600' : 'text-green-600'}`}>
                      Revenue: {analyticsData.stats.totalRevenue > 0 ? formatCurrency(sale.revenue) : 'Rp 0'} | 
                      Deals: {sale.deals} | 
                      Participants: {sale.participants}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}