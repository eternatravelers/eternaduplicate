import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface TableInfo {
  name: string
  label: string
  description: string
  dateField: string
}

const BACKUP_TABLES: TableInfo[] = [
  { name: 'participants', label: 'Peserta', description: 'Data pendaftaran peserta', dateField: 'created_at' },
  { name: 'trips', label: 'Trip', description: 'Data perjalanan wisata', dateField: 'created_at' },
  { name: 'transactions', label: 'Transaksi', description: 'Data transaksi keuangan', dateField: 'transaction_date' },
  { name: 'payment_installments', label: 'Cicilan Pembayaran', description: 'Data cicilan pembayaran peserta', dateField: 'created_at' },
  { name: 'sales', label: 'Sales', description: 'Data sales/agen', dateField: 'created_at' },
  { name: 'tour_leaders', label: 'Tour Leader', description: 'Data pemandu wisata', dateField: 'created_at' },
  { name: 'buses', label: 'Bus', description: 'Data armada bus', dateField: 'created_at' },
  { name: 'drivers', label: 'Driver', description: 'Data pengemudi', dateField: 'created_at' },
  { name: 'destinations', label: 'Destinasi', description: 'Data destinasi wisata', dateField: 'created_at' },
  { name: 'meeting_points', label: 'Meeting Points', description: 'Data titik kumpul', dateField: 'created_at' },
  { name: 'cost_plans', label: 'Rencana Biaya', description: 'Data rencana biaya perjalanan', dateField: 'created_at' },
  { name: 'checklists', label: 'Checklist', description: 'Data checklist operasional', dateField: 'created_at' },
  { name: 'checklist_templates', label: 'Template Checklist', description: 'Template checklist', dateField: 'created_at' },
  { name: 'user_profiles', label: 'Profil Pengguna', description: 'Data profil pengguna sistem', dateField: 'created_at' },
  { name: 'trip_types', label: 'Jenis Trip', description: 'Data jenis/kategori trip', dateField: 'created_at' },
  { name: 'resource_schedules', label: 'Jadwal Resources', description: 'Data jadwal sumber daya', dateField: 'created_at' },
]

export interface DateFilter {
  startDate: string | null
  endDate: string | null
}

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
  const [dateFilter, setDateFilter] = useState<DateFilter>({ startDate: null, endDate: null })

  const fetchTableData = async (tableName: string): Promise<any[]> => {
    const tableInfo = BACKUP_TABLES.find(t => t.name === tableName)
    if (!tableInfo) return []

    let query = supabase
      .from(tableName)
      .select('*')

    if (dateFilter.startDate) {
      query = query.gte(tableInfo.dateField, dateFilter.startDate)
    }

    if (dateFilter.endDate) {
      const endDateWithTime = `${dateFilter.endDate}T23:59:59.999Z`
      query = query.lte(tableInfo.dateField, endDateWithTime)
    }

    query = query.order(tableInfo.dateField, { ascending: false })

    const { data, error } = await query

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
        let query = supabase
          .from(table.name)
          .select('*', { count: 'exact', head: true })

        if (dateFilter.startDate) {
          query = query.gte(table.dateField, dateFilter.startDate)
        }

        if (dateFilter.endDate) {
          const endDateWithTime = `${dateFilter.endDate}T23:59:59.999Z`
          query = query.lte(table.dateField, endDateWithTime)
        }

        const { count, error } = await query

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
  }, [dateFilter])

  const convertToCSV = (data: any[]): string => {
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

  const getFilenameWithDate = (tableName: string, extension: string): string => {
    const today = new Date().toISOString().split('T')[0]
    let filename = `backup_${tableName}`

    if (dateFilter.startDate && dateFilter.endDate) {
      filename += `_${dateFilter.startDate}_to_${dateFilter.endDate}`
    } else if (dateFilter.startDate) {
      filename += `_from_${dateFilter.startDate}`
    } else if (dateFilter.endDate) {
      filename += `_until_${dateFilter.endDate}`
    } else {
      filename += `_${today}`
    }

    return `${filename}.${extension}`
  }

  const exportTableToCSV = useCallback(async (tableName: string, label: string) => {
    setExportingTable(tableName)
    setError(null)

    try {
      const data = await fetchTableData(tableName)

      if (data.length === 0) {
        setError(`Tidak ada data di tabel ${label} untuk periode yang dipilih`)
        return
      }

      const csv = convertToCSV(data)
      downloadFile(csv, getFilenameWithDate(tableName, 'csv'), 'text/csv;charset=utf-8;')
    } catch (err) {
      setError(`Gagal mengekspor ${label}`)
      console.error('Export error:', err)
    } finally {
      setExportingTable(null)
    }
  }, [dateFilter])

  const exportTableToJSON = useCallback(async (tableName: string, label: string) => {
    setExportingTable(tableName)
    setError(null)

    try {
      const data = await fetchTableData(tableName)

      if (data.length === 0) {
        setError(`Tidak ada data di tabel ${label} untuk periode yang dipilih`)
        return
      }

      const json = JSON.stringify(data, null, 2)
      downloadFile(json, getFilenameWithDate(tableName, 'json'), 'application/json')
    } catch (err) {
      setError(`Gagal mengekspor ${label}`)
      console.error('Export error:', err)
    } finally {
      setExportingTable(null)
    }
  }, [dateFilter])

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

      if (allData.length === 0) {
        setError('Tidak ada data untuk periode yang dipilih')
        return
      }

      for (const tableData of allData) {
        const csv = convertToCSV(tableData.data)
        downloadFile(csv, getFilenameWithDate(tableData.tableName, 'csv'), 'text/csv;charset=utf-8;')
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (err) {
      setError('Gagal mengekspor semua data')
      console.error('Export all error:', err)
    } finally {
      setLoading(false)
    }
  }, [dateFilter])

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

      if (Object.keys(allData).length === 0) {
        setError('Tidak ada data untuk periode yang dipilih')
        return
      }

      const json = JSON.stringify({
        exportDate: new Date().toISOString(),
        dateFilter: dateFilter.startDate || dateFilter.endDate ? dateFilter : null,
        tables: allData
      }, null, 2)

      const today = new Date().toISOString().split('T')[0]
      let filename = 'backup_wisatamanager'

      if (dateFilter.startDate && dateFilter.endDate) {
        filename += `_${dateFilter.startDate}_to_${dateFilter.endDate}`
      } else if (dateFilter.startDate) {
        filename += `_from_${dateFilter.startDate}`
      } else if (dateFilter.endDate) {
        filename += `_until_${dateFilter.endDate}`
      } else {
        filename += `_${today}`
      }

      downloadFile(json, `${filename}.json`, 'application/json')
    } catch (err) {
      setError('Gagal mengekspor semua data')
      console.error('Export all error:', err)
    } finally {
      setLoading(false)
    }
  }, [dateFilter])

  const updateDateFilter = useCallback((filter: DateFilter) => {
    setDateFilter(filter)
  }, [])

  const clearDateFilter = useCallback(() => {
    setDateFilter({ startDate: null, endDate: null })
  }, [])

  return {
    loading,
    exportingTable,
    error,
    stats,
    tables: BACKUP_TABLES,
    dateFilter,
    fetchStats,
    exportTableToCSV,
    exportTableToJSON,
    exportAllToCSV,
    exportAllToJSON,
    updateDateFilter,
    clearDateFilter,
  }
}
