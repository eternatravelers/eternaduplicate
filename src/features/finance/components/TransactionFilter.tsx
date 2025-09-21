import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Filter, Calendar, Search } from 'lucide-react'

interface TransactionFilterProps {
  dateFrom: string
  setDateFrom: (date: string) => void
  dateTo: string
  setDateTo: (date: string) => void
  reportType?: string
  setReportType?: (type: string) => void
  searchTerm?: string
  setSearchTerm?: (term: string) => void
  filterType?: string
  setFilterType?: (type: string) => void
  onReset?: () => void
  showReportType?: boolean
  showSearch?: boolean
}

export function TransactionFilter({
  dateFrom,
  setDateFrom,
  dateTo,
  setDateTo,
  reportType,
  setReportType,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  onReset,
  showReportType = true,
  showSearch = false
}: TransactionFilterProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>Filter {showSearch ? 'Transaksi' : 'Laporan'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_from">Tanggal Dari</Label>
            <Input
              id="date_from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date_to">Tanggal Sampai</Label>
            <Input
              id="date_to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
          
          {showReportType && reportType !== undefined && setReportType && (
            <div className="space-y-2">
              <Label htmlFor="report_type">Jenis Laporan</Label>
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Transaksi</SelectItem>
                  <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                  <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {showSearch && searchTerm !== undefined && setSearchTerm && (
            <div className="space-y-2">
              <Label htmlFor="search">Cari Transaksi</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Cari kategori, keterangan, atau trip..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          )}

          {filterType !== undefined && setFilterType && (
            <div className="space-y-2">
              <Label htmlFor="filter_type">Jenis Transaksi</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                  <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {onReset && (
            <div className="flex items-end">
              <Button variant="outline" className="w-full" onClick={onReset}>
                <Calendar className="h-4 w-4 mr-2" />
                Reset Filter
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}