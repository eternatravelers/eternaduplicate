import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, ArrowRight, TrendingUp } from 'lucide-react'

interface ActionItem {
  id: string
  title: string
  priority: 'high' | 'medium' | 'low'
  impact: number
  action: string
  category: string
}

interface ActionItemsListProps {
  items: ActionItem[]
  onActionClick: (action: string) => void
}

export function ActionItemsList({ items, onActionClick }: ActionItemsListProps) {
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return {
          badge: 'bg-red-100 text-red-800',
          border: 'border-red-200',
          bg: 'bg-red-50',
          icon: '🔴'
        }
      case 'medium':
        return {
          badge: 'bg-orange-100 text-orange-800',
          border: 'border-orange-200',
          bg: 'bg-orange-50',
          icon: '🟠'
        }
      case 'low':
        return {
          badge: 'bg-yellow-100 text-yellow-800',
          border: 'border-yellow-200',
          bg: 'bg-yellow-50',
          icon: '🟡'
        }
      default:
        return {
          badge: 'bg-gray-100 text-gray-800',
          border: 'border-gray-200',
          bg: 'bg-gray-50',
          icon: '⚪'
        }
    }
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Action Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-green-600 text-5xl mb-3">✓</div>
            <div className="text-lg font-semibold text-green-700">All Set!</div>
            <div className="text-sm text-gray-600 mt-1">
              Your trip is fully prepared and ready to go.
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-600" />
          Recommended Actions
          <Badge variant="outline" className="ml-auto">
            {items.length} item{items.length > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => {
          const config = getPriorityConfig(item.priority)
          return (
            <div
              key={item.id}
              className={`p-4 border-2 ${config.border} ${config.bg} rounded-lg`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{config.icon}</span>
                    <Badge className={config.badge}>
                      {item.priority.toUpperCase()} PRIORITY
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="font-medium text-gray-900 mb-1">{item.title}</div>
                  <div className="flex items-center gap-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-600">
                      Impact: <span className="font-semibold">+{item.impact}%</span> readiness score
                    </span>
                  </div>
                </div>
                <Button
                  onClick={() => onActionClick(item.action)}
                  size="sm"
                  variant={item.priority === 'high' ? 'default' : 'outline'}
                  className="whitespace-nowrap"
                >
                  {['assign-bus', 'assign-driver', 'assign-tour-leader'].includes(item.action)
                    ? 'Go to Scheduling'
                    : 'Take Action'}
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
