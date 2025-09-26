import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, TrendingDown, Users, DollarSign } from 'lucide-react'
import { formatCurrency, formatShortDate } from '@/lib/utils'

interface ParticipantDeletionSummaryProps {
  deletedParticipants: any[]
}

export function ParticipantDeletionSummary({ deletedParticipants }: ParticipantDeletionSummaryProps) {
  // Calculate impact metrics
  const totalDeletedParticipants = deletedParticipants.reduce((sum, p) => sum + (p.participant_count || 1), 0)
  const totalLostRevenue = deletedParticipants.reduce((sum, p) => sum + (p.package_price || 0), 0)
  const totalLostDP = deletedParticipants.reduce((sum, p) => sum + (p.dp_amount || 0), 0)

  // Group by deletion reason
  const deletionsByMonth = deletedParticipants.reduce((acc, p) => {
    const month = new Date(p.deleted_at).toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long' 
    })
    acc[month] = (acc[month] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (deletedParticipants.length === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-green-800 mb-2">Tidak Ada Penghapusan</h3>
            <p className="text-sm text-green-700">
              Belum ada peserta yang dihapus dari sistem
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Impact Summary Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Registrasi Dihapus
            </CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{deletedParticipants.length}</div>
            <p className="text-xs text-red-600">
              Registrasi
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Peserta Dihapus
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{totalDeletedParticipants}</div>
            <p className="text-xs text-red-600">
              Orang
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700">
              Revenue Hilang
            </CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(totalLostRevenue)}
            </div>
            <p className="text-xs text-red-600">
              Potensi hilang
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700">
              DP Terpengaruh
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {formatCurrency(totalLostDP)}
            </div>
            <p className="text-xs text-orange-600">
              DP yang hilang
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Deletion Analysis */}
      <div className="grid gap-6 md:grid-cols-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Penghapusan per Bulan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(deletionsByMonth).map(([month, count]) => (
                <div key={month} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-700">{month}</span>
                  <Badge variant="outline">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warning Box */}
      <Card className="border-yellow-200 bg-yellow-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium mb-1">Informasi Penting:</p>
              <ul className="list-disc list-inside space-y-1 text-yellow-700">
                <li>Peserta yang dihapus sementara dapat dipulihkan kapan saja</li>
                <li>Penghapusan permanen akan menghilangkan data selamanya</li>
                <li>Revenue dan DP yang hilang tidak mempengaruhi laporan keuangan aktif</li>
                <li>Semua aktivitas penghapusan tercatat dalam audit log</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}