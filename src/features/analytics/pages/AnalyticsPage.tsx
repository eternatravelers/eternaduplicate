import React, { useState } from 'react'
import { Activity } from 'lucide-react'

export function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Analisis & Performance</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="h-4 w-4" />
          <span>Data real-time</span>
        </div>
      </div>

      {/* Analytics components will be implemented later */}
      <div className="text-center py-8 text-gray-500">
        Analytics components coming soon...
      </div>
    </div>
  )
}