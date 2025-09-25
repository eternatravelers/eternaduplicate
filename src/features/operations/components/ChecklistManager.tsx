import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { CheckSquare, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

interface ChecklistItem {
  id: string
  title: string
  description: string
  completed: boolean
  priority: 'high' | 'medium' | 'low'
  category: 'pre-departure' | 'during-trip' | 'post-trip'
}

interface ChecklistManagerProps {
  tripId: string
  tripName: string
}

export function ChecklistManager({ tripId, tripName }: ChecklistManagerProps) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([
    // Pre-departure checklist
    {
      id: '1',
      title: 'Konfirmasi Peserta',
      description: 'Pastikan semua peserta sudah dikonfirmasi dan melunasi pembayaran',
      completed: false,
      priority: 'high',
      category: 'pre-departure'
    },
    {
      id: '2',
      title: 'Persiapan Kendaraan',
      description: 'Cek kondisi bus, bahan bakar, dan kelengkapan kendaraan',
      completed: false,
      priority: 'high',
      category: 'pre-departure'
    },
    {
      id: '3',
      title: 'Briefing Tour Leader',
      description: 'Briefing tour leader tentang itinerary dan informasi penting',
      completed: false,
      priority: 'high',
      category: 'pre-departure'
    },
    {
      id: '4',
      title: 'Persiapan Dokumen',
      description: 'Siapkan dokumen trip, daftar peserta, dan kontak darurat',
      completed: false,
      priority: 'medium',
      category: 'pre-departure'
    },
    {
      id: '5',
      title: 'Konfirmasi Akomodasi',
      description: 'Konfirmasi booking hotel dan fasilitas akomodasi',
      completed: false,
      priority: 'medium',
      category: 'pre-departure'
    },
    
    // During trip checklist
    {
      id: '6',
      title: 'Absensi Keberangkatan',
      description: 'Cek kehadiran semua peserta di titik kumpul',
      completed: false,
      priority: 'high',
      category: 'during-trip'
    },
    {
      id: '7',
      title: 'Safety Briefing',
      description: 'Berikan safety briefing kepada semua peserta',
      completed: false,
      priority: 'high',
      category: 'during-trip'
    },
    {
      id: '8',
      title: 'Update Progress',
      description: 'Update progress trip secara berkala',
      completed: false,
      priority: 'medium',
      category: 'during-trip'
    },
    {
      id: '9',
      title: 'Dokumentasi',
      description: 'Ambil foto dan video untuk dokumentasi trip',
      completed: false,
      priority: 'low',
      category: 'during-trip'
    },
    
    // Post-trip checklist
    {
      id: '10',
      title: 'Absensi Kepulangan',
      description: 'Pastikan semua peserta kembali dengan selamat',
      completed: false,
      priority: 'high',
      category: 'post-trip'
    },
    {
      id: '11',
      title: 'Evaluasi Trip',
      description: 'Kumpulkan feedback dari peserta dan tour leader',
      completed: false,
      priority: 'medium',
      category: 'post-trip'
    },
    {
      id: '12',
      title: 'Laporan Keuangan',
      description: 'Buat laporan keuangan trip dan rekonsiliasi',
      completed: false,
      priority: 'medium',
      category: 'post-trip'
    }
  ])

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ))
  }

  const getChecklistByCategory = (category: ChecklistItem['category']) => {
    return checklist.filter(item => item.category === category)
  }

  const getCompletionStats = (category: ChecklistItem['category']) => {
    const items = getChecklistByCategory(category)
    const completed = items.filter(item => item.completed).length
    const total = items.length
    const percentage = total > 0 ? (completed / total) * 100 : 0
    
    return { completed, total, percentage }
  }

  const getPriorityBadge = (priority: ChecklistItem['priority']) => {
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

  const renderChecklistSection = (category: ChecklistItem['category'], title: string, icon: any) => {
    const items = getChecklistByCategory(category)
    const stats = getCompletionStats(category)
    const Icon = icon

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
                  onCheckedChange={() => toggleChecklistItem(item.id)}
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