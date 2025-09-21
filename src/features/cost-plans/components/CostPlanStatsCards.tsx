import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, DollarSign, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CostPlanStatsCardsProps {
  costPlans: any[]
}

export function CostPlanStatsCards({ costPlans }: CostPlanStatsCardsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Total Template
          </CardTitle>
          <Calculator className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{costPlans.length}</div>
          <p className="text-xs text-gray-500">
            Template biaya tersedia
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Rata-rata Biaya
          </CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {costPlans.length > 0 
              ? formatCurrency(costPlans.reduce((sum, plan) => sum + (plan.total_cost || 0), 0) / costPlans.length)
              : formatCurrency(0)
            }
          </div>
          <p className="text-xs text-gray-500">
            Per template
          </p>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">
            Rata-rata per Orang
          </CardTitle>
          <Users className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {costPlans.length > 0 
              ? formatCurrency(costPlans.reduce((sum, plan) => sum + (plan.cost_per_person || 0), 0) / costPlans.length)
              : formatCurrency(0)
            }
          </div>
          <p className="text-xs text-gray-500">
            Biaya per peserta
          </p>
        </CardContent>
      </Card>
    </div>
  )
}