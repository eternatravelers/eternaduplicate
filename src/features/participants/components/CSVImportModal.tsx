import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileSpreadsheet, Upload, Download, AlertCircle, CheckCircle, X, Users } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface CSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (participants: any[]) => Promise<void>
  trips: any[]
  sales: any[]
  importing: boolean
  parentParticipantId?: string | null
}

interface ParsedParticipant {
  full_name: string
  email: string
  phone: string
  address: string
  participant_count: number
  package_price: number
  dp_amount: number
  trip_id?: string
  sales_id?: string
  trip_name?: string
  sales_name?: string
  additional_requests?: string
  errors: string[]
}

export function CSVImportModal({
  isOpen,
  onClose,
  onImport,
  trips,
  sales,
  importing,
  parentParticipantId
}: CSVImportModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedParticipant[]>([])
  const [defaultTripId, setDefaultTripId] = useState('')
  const [defaultSalesId, setDefaultSalesId] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'preview' | 'mapping'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        setParseError('File harus berformat CSV')
        return
      }
      setCsvFile(file)
      parseCSV(file)
    }
  }

  const parseCSV = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string
        const lines = text.split('\n').filter(line => line.trim())
        
        if (lines.length < 2) {
          setParseError('File CSV harus memiliki header dan minimal 1 baris data')
          return
        }

        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
        const dataLines = lines.slice(1)

        const parsed: ParsedParticipant[] = dataLines.map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
          const participant: ParsedParticipant = {
            full_name: '',
            email: '',
            phone: '',
            address: '',
            participant_count: 1,
            package_price: 0,
            dp_amount: 0,
            errors: []
          }

          // Map CSV columns to participant fields
          headers.forEach((header, i) => {
            const value = values[i] || ''
            
            switch (header.toLowerCase()) {
              case 'nama_lengkap':
              case 'full_name':
              case 'nama':
                participant.full_name = value
                break
              case 'email':
                participant.email = value
                break
              case 'telepon':
              case 'phone':
              case 'no_hp':
                participant.phone = value
                break
              case 'alamat':
              case 'address':
                participant.address = value
                break
              case 'jumlah_peserta':
              case 'participant_count':
              case 'jumlah':
                const count = parseInt(value)
                participant.participant_count = isNaN(count) ? 1 : count
                break
              case 'harga_paket':
              case 'package_price':
              case 'harga':
                if (!parentParticipantId) { // Only set price for non-group members
                  const price = parseFloat(value)
                  participant.package_price = isNaN(price) ? 0 : price
                }
                break
              case 'dp_amount':
              case 'dp':
              case 'uang_muka':
                if (!parentParticipantId) { // Only set DP for non-group members
                  const dp = parseFloat(value)
                  participant.dp_amount = isNaN(dp) ? 0 : dp
                }
                break
              case 'permintaan_tambahan':
              case 'additional_requests':
              case 'catatan':
                participant.additional_requests = value
                break
              case 'nama_trip':
              case 'trip_name':
                // Store trip name for later matching
                participant.trip_name = value
                break
              case 'nama_sales':
              case 'sales_name':
                // Store sales name for later matching
                participant.sales_name = value
                break
            }
          })

          // Validate required fields
          if (!participant.full_name) participant.errors.push('Nama lengkap wajib diisi')
          if (!participant.email) participant.errors.push('Email wajib diisi')
          if (!participant.phone) participant.errors.push('Telepon wajib diisi')
          if (!participant.address) participant.errors.push('Alamat wajib diisi')
          
          // Only validate price for non-group members
          if (!parentParticipantId) {
            if (participant.package_price <= 0) participant.errors.push('Harga paket harus lebih dari 0')
            if (participant.dp_amount < 0) participant.errors.push('DP tidak boleh negatif')
          }

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (participant.email && !emailRegex.test(participant.email)) {
            participant.errors.push('Format email tidak valid')
          }

          return participant
        })

        // Match trip and sales names to IDs
        const processedParsed = parsed.map(participant => {
          // Find trip by name
          if (participant.trip_name) {
            const matchedTrip = trips.find(trip => 
              trip.name.toLowerCase().includes(participant.trip_name.toLowerCase()) ||
              participant.trip_name.toLowerCase().includes(trip.name.toLowerCase())
            )
            if (matchedTrip) {
              participant.trip_id = matchedTrip.id
            } else {
              participant.errors.push(`Trip "${participant.trip_name}" tidak ditemukan`)
            }
          }

          // Find sales by name
          if (participant.sales_name) {
            const matchedSales = sales.find(sale => 
              sale.name.toLowerCase().includes(participant.sales_name.toLowerCase()) ||
              participant.sales_name.toLowerCase().includes(sale.name.toLowerCase())
            )
            if (matchedSales) {
              participant.sales_id = matchedSales.id
            } else {
              participant.errors.push(`Sales "${participant.sales_name}" tidak ditemukan`)
            }
          }

          return participant
        })

        setParsedData(processedParsed)
        setParseError(null)
        setStep('preview')
      } catch (error) {
        setParseError('Gagal membaca file CSV. Pastikan format file benar.')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    const validParticipants = parsedData.filter(p => p.errors.length === 0)
    
    if (validParticipants.length === 0) {
      setParseError('Tidak ada data valid untuk diimpor')
      return
    }

    const participantsToImport = validParticipants.map(({ errors, ...p }) => ({
      ...p,
      trip_id: defaultTripId || null,
      sales_id: defaultSalesId || null,
      dp_transfer_date: new Date().toISOString().split('T')[0],
      status: 'pending',
      parent_participant_id: parentParticipantId || null,
      // Override values for group members
      ...(parentParticipantId && {
        participant_count: 1, // Each member is 1 person
        package_price: 0, // Payment is consolidated at group leader level
        dp_amount: 0 // Payment is consolidated at group leader level
      })
    }))

    try {
      await onImport(participantsToImport)
      handleClose()
    } catch (error) {
      setParseError('Gagal mengimpor data peserta')
    }
  }

  const handleClose = () => {
    setCsvFile(null)
    setParsedData([])
    setDefaultTripId('')
    setDefaultSalesId('')
    setParseError(null)
    setStep('upload')
    onClose()
  }

  const downloadTemplate = () => {
    const template = [
      'nama_lengkap,email,telepon,alamat,jumlah_peserta,harga_paket,dp_amount,nama_trip,nama_sales,permintaan_tambahan',
      'John Doe,john@example.com,08123456789,"Jl. Sudirman No. 123, Jakarta",2,1500000,500000,"Bali Adventure 3D2N","Ahmad Wijaya","Makanan vegetarian"',
      'Jane Smith,jane@example.com,08198765432,"Jl. Thamrin No. 456, Jakarta",1,1500000,500000,"Yogyakarta Cultural Tour","Siti Nurhaliza",""',
      'Bob Wilson,bob@example.com,08111222333,"Jl. Gatot Subroto No. 789, Jakarta",3,1500000,500000,"Lombok Beach Holiday","Ahmad Wijaya","Kursi roda untuk lansia"'
    ].join('\n')

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template-import-peserta.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const validCount = parsedData.filter(p => p.errors.length === 0).length
  const errorCount = parsedData.filter(p => p.errors.length > 0).length

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>
              {parentParticipantId ? 'Import Anggota Grup dari CSV' : 'Import Peserta dari CSV'}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {parentParticipantId && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertDescription>
                Peserta yang diimpor akan ditambahkan sebagai anggota grup dengan pembayaran nol. 
                Pembayaran sudah dikonsolidasi melalui ketua grup.
              </AlertDescription>
            </Alert>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-800 mb-2">Panduan Import CSV</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• File harus berformat CSV dengan encoding UTF-8</li>
                  <li>• Kolom yang wajib: nama_lengkap, email, telepon, alamat, harga_paket</li>
                  <li>• Kolom opsional: {parentParticipantId ? '' : 'jumlah_peserta, harga_paket, dp_amount, nama_trip, nama_sales, '}permintaan_tambahan</li>
                  <li>• Gunakan template yang disediakan untuk memastikan format yang benar</li>
                  {!parentParticipantId && <li>• Nama trip dan sales akan dicocokkan otomatis dengan data yang ada</li>}
                  {parentParticipantId && <li>• Semua peserta akan ditambahkan ke grup dengan pembayaran nol (konsolidasi di ketua grup)</li>}
                </ul>
              </div>

              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={downloadTemplate}
                  className="flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>Download Template CSV</span>
                </Button>
                <span className="text-gray-500">atau</span>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Upload File CSV</span>
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />

              {csvFile && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <FileSpreadsheet className="h-4 w-4 text-green-600" />
                    <span className="font-medium text-green-800">{csvFile.name}</span>
                    <Badge className="bg-green-100 text-green-800">
                      {(csvFile.size / 1024).toFixed(1)} KB
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preview and Mapping */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview Data Import</h3>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-green-100 text-green-800">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {validCount} Valid
                  </Badge>
                  {errorCount > 0 && (
                    <Badge variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errorCount} Error
                    </Badge>
                  )}
                </div>
              </div>

              {/* Default Trip and Sales Selection */}
              {!parentParticipantId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="default_trip">Trip Default (Opsional)</Label>
                  <Select value={defaultTripId} onValueChange={setDefaultTripId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih trip default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-trip">Tidak ada trip</SelectItem>
                      {trips.map(trip => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="default_sales">Sales Default (Opsional)</Label>
                  <Select value={defaultSalesId} onValueChange={setDefaultSalesId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih sales default" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-sales">Tidak ada sales</SelectItem>
                      {sales.map(sale => (
                        <SelectItem key={sale.id} value={sale.id}>
                          {sale.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              )}

              {/* Preview Table */}
              <div className="border rounded-lg max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Telepon</TableHead>
                      <TableHead>Alamat</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Harga</TableHead>
                      <TableHead>DP</TableHead>
                      <TableHead>Catatan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((participant, index) => (
                      <TableRow key={index} className={participant.errors.length > 0 ? 'bg-red-50' : 'bg-green-50'}>
                        <TableCell>
                          {participant.errors.length === 0 ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Error
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div>
                            {participant.full_name || <span className="text-gray-400">-</span>}
                            {participant.errors.length > 0 && (
                              <div className="text-xs text-red-600 mt-1">
                                {participant.errors.join(', ')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{participant.email || <span className="text-gray-400">-</span>}</TableCell>
                        <TableCell>{participant.phone || <span className="text-gray-400">-</span>}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {participant.address || <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell>{participant.participant_count}</TableCell>
                        <TableCell>{formatCurrency(participant.package_price)}</TableCell>
                        <TableCell>{formatCurrency(participant.dp_amount)}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {participant.additional_requests || <span className="text-gray-400">-</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2">Ringkasan Import</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Total Baris:</span>
                    <div className="font-bold">{parsedData.length}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Data Valid:</span>
                    <div className="font-bold text-green-600">{validCount}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Data Error:</span>
                    <div className="font-bold text-red-600">{errorCount}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Total Revenue:</span>
                    <div className="font-bold text-blue-600">
                      {formatCurrency(parsedData.reduce((sum, p) => sum + (p.package_price * p.participant_count), 0))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {importing ? 'Mengimpor...' : `Import ${validCount} Peserta Valid`}
                </Button>
                <Button variant="outline" onClick={() => setStep('upload')}>
                  Kembali
                </Button>
                <Button variant="outline" onClick={handleClose}>
                  Batal
                </Button>
              </div>
            </div>
          )}

          {parseError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{parseError}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}