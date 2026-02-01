import React, { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Download,
  Database,
  FileSpreadsheet,
  FileJson,
  HardDrive,
  RefreshCw,
  AlertCircle,
  Shield,
  Info,
  Loader2
} from 'lucide-react'
import { useBackup } from '@/hooks/useBackup'
import { formatNumber } from '@/lib/utils'

export function BackupDataPage() {
  const {
    loading,
    exportingTable,
    error,
    stats,
    tables,
    fetchStats,
    exportTableToCSV,
    exportTableToJSON,
    exportAllToCSV,
    exportAllToJSON
  } = useBackup()

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const getTableCount = (tableName: string): number => {
    if (!stats) return 0
    const table = stats.tables.find(t => t.name === tableName)
    return table?.count || 0
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backup Data</h1>
          <p className="text-gray-600 mt-2">
            Download semua data sistem dalam format CSV atau JSON
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchStats}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Tabel
            </CardTitle>
            <Database className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {loading ? '-' : stats?.totalTables || 0}
            </div>
            <p className="text-xs text-gray-500">Tabel tersedia untuk backup</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Records
            </CardTitle>
            <HardDrive className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {loading ? '-' : formatNumber(stats?.totalRecords || 0)}
            </div>
            <p className="text-xs text-gray-500">Data yang akan di-backup</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Tanggal Hari Ini
            </CardTitle>
            <Shield className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {new Date().toLocaleDateString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
              })}
            </div>
            <p className="text-xs text-gray-500">Tanggal backup</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Download Semua Data
          </CardTitle>
          <CardDescription>
            Download semua data dalam satu file atau multiple file
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={exportAllToCSV}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4 mr-2" />
              )}
              Download Semua (CSV)
            </Button>
            <Button
              onClick={exportAllToJSON}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileJson className="h-4 w-4 mr-2" />
              )}
              Download Semua (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Download Per Kategori
          </CardTitle>
          <CardDescription>
            Pilih kategori data yang ingin di-download
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tables.map((table) => {
                const count = getTableCount(table.name)
                const isExporting = exportingTable === table.name

                return (
                  <div
                    key={table.name}
                    className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900">{table.label}</h3>
                        <p className="text-sm text-gray-500">{table.description}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {formatNumber(count)} rows
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportTableToCSV(table.name, table.label)}
                        disabled={isExporting || count === 0}
                        className="flex-1"
                      >
                        {isExporting ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <FileSpreadsheet className="h-3 w-3 mr-1" />
                        )}
                        CSV
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => exportTableToJSON(table.name, table.label)}
                        disabled={isExporting || count === 0}
                        className="flex-1"
                      >
                        {isExporting ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <FileJson className="h-3 w-3 mr-1" />
                        )}
                        JSON
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-2">Informasi Backup Data:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>
                  <strong>CSV</strong> - Format spreadsheet yang kompatibel dengan Excel dan Google Sheets
                </li>
                <li>
                  <strong>JSON</strong> - Format data terstruktur yang cocok untuk import ke sistem lain
                </li>
                <li>Data yang di-download tidak menyertakan password atau informasi sensitif</li>
                <li>Simpan backup di tempat yang aman dan terenkripsi</li>
                <li>Disarankan melakukan backup secara berkala (minimal seminggu sekali)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
