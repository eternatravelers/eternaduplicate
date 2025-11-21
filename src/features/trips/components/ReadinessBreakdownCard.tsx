import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertCircle, Bus, User, MapPin, DollarSign, ClipboardList } from 'lucide-react'

interface ReadinessBreakdownCardProps {
  category: 'bus' | 'driver' | 'tourLeader' | 'costPlan' | 'meetingPoints' | 'checklist'
  data: {
    score: number
    status: 'complete' | 'partial' | 'incomplete'
    points: number
    completed?: number
    total?: number
  }
  details?: any[]
  detailType?: 'bus' | 'driver' | 'tourLeader' | 'costPlan' | 'meetingPoint' | 'checklist'
  onAction?: () => void
}

const categoryConfig = {
  bus: {
    title: 'Bus Assignment',
    icon: Bus,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  },
  driver: {
    title: 'Driver Assignment',
    icon: User,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  tourLeader: {
    title: 'Tour Leader Assignment',
    icon: User,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  costPlan: {
    title: 'Cost Plan',
    icon: DollarSign,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  meetingPoints: {
    title: 'Meeting Points',
    icon: MapPin,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  checklist: {
    title: 'Operational Checklist',
    icon: ClipboardList,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200'
  }
}

export function ReadinessBreakdownCard({
  category,
  data,
  details = [],
  detailType,
  onAction
}: ReadinessBreakdownCardProps) {
  const config = categoryConfig[category]
  const Icon = config.icon

  const getStatusIcon = () => {
    if (data.status === 'complete') return <CheckCircle2 className="h-5 w-5 text-green-600" />
    if (data.status === 'partial') return <AlertCircle className="h-5 w-5 text-orange-600" />
    return <XCircle className="h-5 w-5 text-red-600" />
  }

  const getStatusBadge = () => {
    if (data.status === 'complete') return <Badge className="bg-green-100 text-green-800">Complete</Badge>
    if (data.status === 'partial') return <Badge className="bg-orange-100 text-orange-800">In Progress</Badge>
    return <Badge className="bg-red-100 text-red-800">Not Started</Badge>
  }

  const renderDetails = () => {
    if (!details || details.length === 0) {
      return (
        <div className="text-sm text-gray-500 italic">
          No {config.title.toLowerCase()} assigned yet
        </div>
      )
    }

    switch (detailType) {
      case 'bus':
        return details.map((bus: any) => (
          <div key={bus.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div>
              <div className="font-medium">{bus.bus_number}</div>
              <div className="text-xs text-gray-600">{bus.plate_number} • {bus.type}</div>
              <div className="text-xs text-gray-500">Capacity: {bus.capacity} passengers</div>
            </div>
            <Badge variant="outline">{bus.status}</Badge>
          </div>
        ))

      case 'driver':
        return details.map((driver: any) => (
          <div key={driver.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div>
              <div className="font-medium">{driver.name}</div>
              <div className="text-xs text-gray-600">{driver.phone}</div>
              <div className="text-xs text-gray-500">License: {driver.license_type} • {driver.license_number}</div>
            </div>
            <Badge variant="outline">{driver.status}</Badge>
          </div>
        ))

      case 'tourLeader':
        return details.map((tl: any) => (
          <div key={tl.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div>
              <div className="font-medium">{tl.name}</div>
              <div className="text-xs text-gray-600">{tl.phone}</div>
              <div className="text-xs text-gray-500">
                {tl.certification} • {tl.experience_years}y exp
              </div>
            </div>
            <Badge variant="outline">{tl.status}</Badge>
          </div>
        ))

      case 'costPlan':
        return details.map((cp: any) => (
          <div key={cp.id} className="p-2 bg-gray-50 rounded">
            <div className="font-medium">{cp.name}</div>
            <div className="text-xs text-gray-600 mt-1">
              Estimated Participants: {cp.estimated_participants}
            </div>
            <div className="text-xs text-gray-600">
              Cost per Person: Rp {cp.cost_per_person?.toLocaleString('id-ID')}
            </div>
            <div className="text-xs font-semibold text-gray-700 mt-1">
              Total Cost: Rp {cp.total_cost?.toLocaleString('id-ID')}
            </div>
          </div>
        ))

      case 'meetingPoint':
        return details.map((mp: any) => (
          <div key={mp.id} className="p-2 bg-gray-50 rounded">
            <div className="flex items-center gap-2">
              <div className="font-medium">{mp.name}</div>
              {mp.is_primary && (
                <Badge className="bg-blue-100 text-blue-800 text-xs">Primary</Badge>
              )}
            </div>
            <div className="text-xs text-gray-600 mt-1">{mp.address}</div>
            <div className="text-xs text-gray-500">{mp.city}, {mp.province}</div>
          </div>
        ))

      default:
        return null
    }
  }

  return (
    <Card className={`${config.borderColor} border-2`}>
      <CardHeader className={`${config.bgColor} pb-3`}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${config.color}`} />
            <span className="text-base">{config.title}</span>
          </div>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            {getStatusBadge()}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-2xl font-bold">{data.score} / {data.points}</div>
            <div className="text-xs text-gray-600">
              {data.status === 'complete' ? 'All requirements met' :
               data.status === 'partial' ? 'Some items completed' :
               'Action required'}
            </div>
          </div>
          {category === 'checklist' && data.total !== undefined && (
            <div className="text-right">
              <div className="text-lg font-semibold">{data.completed} / {data.total}</div>
              <div className="text-xs text-gray-600">Items completed</div>
            </div>
          )}
        </div>

        <div className="space-y-2 mb-4">
          {renderDetails()}
        </div>

        {data.status !== 'complete' && onAction && (
          <Button
            onClick={onAction}
            variant="outline"
            className="w-full"
            size="sm"
          >
            {data.status === 'incomplete' ? 'Add' : 'Manage'} {config.title}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
