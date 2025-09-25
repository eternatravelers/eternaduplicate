import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { CheckSquare, Clock, AlertTriangle, CheckCircle } from 'lucide-react'
import { useChecklists, useUpdateChecklist, useInitializeDefaultChecklist } from '@/hooks/useChecklists'

interface ChecklistManagerProps {
  tripId: string
  tripName: string
}

export function ChecklistManager({ tripId, tripName }: ChecklistManagerProps) {
  const { checklists, loading, refetch } = useChecklists(tripId)
  const { toggleChecklistItem, loading: updating } = useUpdateChecklist()
  const { initializeDefaultChecklist, loading: initializing } = useInitializeDefaultChecklist()

  const handleToggleItem = async (id: string, completed: boolean) => {
    const { error } = await toggleChecklistItem(id, !completed)
    if (!error) {
      refetch()
    }
  }

  const handleInitializeChecklist = async () => {
    const { error } = await initializeDefaultChecklist(tripId)
    if (!error) {
      refetch()
    }
  }

  const getChecklistByCategory = (category: 'pre-departure' | 'during-trip' | 'post-trip') => {
    return checklists.filter(item => item.category === category)
  }

  const getCompletionStats = (category: 'pre-departure' | 'during-trip' | 'post-trip') => {
    const items = getChecklistByCategory(category)
    const completed = items.filter(item => item.completed).length
    const total = items.length
    const percentage = total > 0 ? (completed / total) * 100 : 0
    
    return { completed, total, percentage }
  }

  const getPriorityBadge = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-800">Tinggi</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Sedang</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Rendah</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  const renderChecklistSection = (category: 'pre-departure' | 'during-trip' | 'post-trip', title: string, icon: any) => {
    const items = getChecklistByCategory(category)
    const stats = getCompletionStats(category)
    const Icon = icon

    if (items.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-gray-500">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Belum ada checklist</h3>
              <p className="text-sm mb-4">
                Inisialisasi checklist default untuk trip ini
              </p>
              <Button 
                onClick={handleInitializeChecklist}
                disabled={initializing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {initializing ? 'Menginisialisasi...' : 'Inisialisasi Checklist'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Icon className="h-5 w-5" />
              <span>{title}</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {stats.completed}/{stats.total}
              </Badge>
              <div className="text-sm text-gray-600">
                {stats.percentage.toFixed(0)}%
              </div>
            </div>
          </div>
          <Progress value={stats.percentage} className="mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50">
                <Checkbox
                  checked={item.completed}
                  onCheckedChange={() => handleToggleItem(item.id, item.completed)}
                  disabled={updating}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {item.title}
                    </h4>
                    {getPriorityBadge(item.priority)}
                  </div>
                  <p className={`text-sm ${item.completed ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-4"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <CheckSquare className="h-5 w-5" />
            <span>Checklist Operasional - {tripName}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-700">
                {getCompletionStats('pre-departure').percentage.toFixed(0)}%
              </div>
              <div className="text-blue-600">Pre-Departure</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-700">
                {getCompletionStats('during-trip').percentage.toFixed(0)}%
              </div>
              <div className="text-green-600">During Trip</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-700">
                {getCompletionStats('post-trip').percentage.toFixed(0)}%
              </div>
              <div className="text-purple-600">Post-Trip</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="pre-departure" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pre-departure">Pre-Departure</TabsTrigger>
          <TabsTrigger value="during-trip">During Trip</TabsTrigger>
          <TabsTrigger value="post-trip">Post-Trip</TabsTrigger>
        </TabsList>

        <TabsContent value="pre-departure">
          {renderChecklistSection('pre-departure', 'Persiapan Sebelum Keberangkatan', Clock)}
        </TabsContent>

        <TabsContent value="during-trip">
          {renderChecklistSection('during-trip', 'Selama Perjalanan', CheckCircle)}
        </TabsContent>

        <TabsContent value="post-trip">
          {renderChecklistSection('post-trip', 'Setelah Trip Selesai', CheckSquare)}
        </TabsContent>
      </Tabs>
    </div>
  )
}