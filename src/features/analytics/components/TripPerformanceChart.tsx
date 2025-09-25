import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { MapPin } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface TripPerformanceChartProps {
  data: Array<{
    name: string
    participants: number
    revenue: number
    quota: number
  }>
}

export function TripPerformanceChart({ data }: TripPerformanceChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0]?.payload
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-blue-600">Peserta: {data?.participants}/{data?.quota}</p>
          <p className="text-green-600">Revenue: {formatCurrency(data?.revenue || 0)}</p>
          <p className="text-purple-600">Fill Rate: {data?.quota ? ((data?.participants / data?.quota) * 100).toFixed(1) : 0}%</p>
        </div>
      )
    }
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          <span>Performa Trip</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis tickFormatter={(value) => `${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="participants" fill="#3b82f6" name="Peserta" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}