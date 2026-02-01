import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface TableInfo {
  name: string
  label: string
  description: string
}

const BACKUP_TABLES: TableInfo[] = [
  { name: 'participants', label: 'Peserta', description: 'Data pendaftaran peserta' },
  { name: 'trips', label: 'Trip', description: 'Data perjalanan wisata' },
  { name: 'transactions', label: 'Transaksi', description: 'Data transaksi keuangan' },
  { name: 'payment_installments', label: 'Cicilan Pembayaran', description: 'Data cicilan pembayaran peserta' },
  { name: 'sales', label: 'Sales', description: 'Data sales/agen' },
  { name: 'tour_leaders', label: 'Tour Leader', description: 'Data pemandu wisata' },
  { name: 'buses', label: 'Bus', description: 'Data armada bus' },
  { name: 'drivers', label: 'Driver', description: 'Data pengemudi' },
  { name: 'destinations', label: 'Destinasi', description: 'Data destinasi wisata' },
  { name: 'meeting_points', label: 'Meeting Points', description: 'Data titik kumpul' },
  { name: 'cost_plans', label: 'Rencana Biaya', description: 'Data rencana biaya perjalanan' },
  { name: 'checklists', label: 'Checklist', description: 'Data checklist operasional' },
  { name: 'checklist_templates', label: 'Template Checklist', description: 'Template checklist' },
  { name: 'user_profiles', label: 'Profil Pengguna', description: 'Data profil pengguna sistem' },
  { name: 'trip_types', label: 'Jenis Trip', description: 'Data jenis/kategori trip' },
  { name: 'resource_schedules', label: 'Jadwal Resources', description: 'Data jadwal sumber daya' },
]

interface BackupData {
  tableName: string
  label: string
  data: any[]
  count: number
}

interface BackupStats {
  totalTables: number
  totalRecords: number
  tables: { name: string; label: string; count: number }[]
}

export function useBackup() {
  const [loading, setLoading] = useState(false)
  const [exportingTable, setExportingTable] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<BackupStats | null>(null)

  const fetchTableData = async (tableName: string): Promise<any[]> => {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(`Error fetching ${tableName}:`, error)
      return []
    }

    return data || []
  }

  const fetchStats = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const tableStats: { name: string; label: string; count: number }[] = []
      let totalRecords = 0

      for (const table of BACKUP_TABLES) {
        const { count, error } = await supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })

        if (!error && count !== null) {
          tableStats.push({
            name: table.name,
            label: table.label,
            count
          })
          totalRecords += count
        }
      }

      setStats({
        totalTables: tableStats.length,
        totalRecords,
        tables: tableStats
      })
    } catch (err) {
      setError('Gagal mengambil statistik data')
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const convertToCSV = (data: any[], tableName: string): string => {
    if (!data || data.length === 0) {
      return ''
    }

    const headers = Object.keys(data[0])
    const csvRows: string[] = []

    csvRows.push(headers.join(','))

    for (const row of data) {
      const values = headers.map(header => {
        let value = row[header]

        if (value === null || value === undefined) {
          return ''
        }

        if (typeof value === 'object') {
          value = JSON.stringify(value)
        }

        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }

        return stringValue
      })
      csvRows.push(values.join(','))
    }

    return csvRows.join('\n')
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const exportTableToCSV = useCallback(async (tableName: string, label: string) => {
    setExportingTable(tableName)
    setError(null)

    try {
      const data = await fetchTableData(tableName)

      if (data.length === 0) {
        setError(`Tidak ada data di tabel ${label}`)
        return
      }

      const csv = convertToCSV(data, tableName)
      const date = new Date().toISOString().split('T')[0]
      downloadFile(csv, `backup_${tableName}_${date}.csv`, 'text/csv;charset=utf-8;')
    } catch (err) {
      setError(`Gagal mengekspor ${label}`)
      console.error('Export error:', err)
    } finally {
      setExportingTable(null)
    }
  }, [])

  const exportTableToJSON = useCallback(async (tableName: string, label: string) => {
    setExportingTable(tableName)
    setError(null)

    try {
      const data = await fetchTableData(tableName)

      if (data.length === 0) {
        setError(`Tidak ada data di tabel ${label}`)
        return
      }

      const json = JSON.stringify(data, null, 2)
      const date = new Date().toISOString().split('T')[0]
      downloadFile(json, `backup_${tableName}_${date}.json`, 'application/json')
    } catch (err) {
      setError(`Gagal mengekspor ${label}`)
      console.error('Export error:', err)
    } finally {
      setExportingTable(null)
    }
  }, [])

  const exportAllToCSV = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const allData: BackupData[] = []

      for (const table of BACKUP_TABLES) {
        const data = await fetchTableData(table.name)
        if (data.length > 0) {
          allData.push({
            tableName: table.name,
            label: table.label,
            data,
            count: data.length
          })
        }
      }

      const date = new Date().toISOString().split('T')[0]

      for (const tableData of allData) {
        const csv = convertToCSV(tableData.data, tableData.tableName)
        downloadFile(csv, `backup_${tableData.tableName}_${date}.csv`, 'text/csv;charset=utf-8;')
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (err) {
      setError('Gagal mengekspor semua data')
      console.error('Export all error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  const exportAllToJSON = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const allData: Record<string, any[]> = {}

      for (const table of BACKUP_TABLES) {
        const data = await fetchTableData(table.name)
        if (data.length > 0) {
          allData[table.name] = data
        }
      }

      const date = new Date().toISOString().split('T')[0]
      const json = JSON.stringify({
        exportDate: new Date().toISOString(),
        tables: allData
      }, null, 2)

      downloadFile(json, `backup_wisatamanager_${date}.json`, 'application/json')
    } catch (err) {
      setError('Gagal mengekspor semua data')
      console.error('Export all error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    exportingTable,
    error,
    stats,
    tables: BACKUP_TABLES,
    fetchStats,
    exportTableToCSV,
    exportTableToJSON,
    exportAllToCSV,
    exportAllToJSON,
  }
}
