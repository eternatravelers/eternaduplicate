import React, { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { FileSpreadsheet, Upload, Download, AlertCircle, CheckCircle, X } from 'lucide-react'

interface GroupMembersCSVImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (members: any[]) => Promise<void>
  groupParticipant: any
  importing: boolean
}

interface ParsedMember {
  full_name: string
  email: string
  phone: string
  address: string
  additional_requests?: string
  errors: string[]
}

export function GroupMembersCSVImportModal({
  isOpen,
  onClose,
  onImport,
  groupParticipant,
  importing
}: GroupMembersCSVImportModalProps) {
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [parsedData, setParsedData] = useState<ParsedMember[]>([])
  const [parseError, setParseError] = useState<string | null>(null)
  const [step, setStep] = useState<'upload' | 'preview'>('upload')
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

        const parsed: ParsedMember[] = dataLines.map((line, index) => {
          const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
          const member: ParsedMember = {
            full_name: '',
            email: '',
            phone: '',
            address: '',
            additional_requests: '',
            errors: []
          }

          // Map CSV columns to member fields
          headers.forEach((header, i) => {
            const value = values[i] || ''
            
            switch (header.toLowerCase()) {
              case 'nama_lengkap':
              case 'full_name':
              case 'nama':
                member.full_name = value
                break
              case 'email':
                member.email = value
                break
              case 'telepon':
              case 'phone':
              case 'no_hp':
                member.phone = value
                break
              case 'alamat':
              case 'address':
                member.address = value
                break
              case 'permintaan_tambahan':
              case 'additional_requests':
              case 'catatan':
                member.additional_requests = value
                break
            }
          })

          // Validate required fields
          if (!member.full_name) member.errors.push('Nama lengkap wajib diisi')
          if (!member.email) member.errors.push('Email wajib diisi')
          if (!member.phone) member.errors.push('Telepon wajib diisi')
          if (!member.address) member.errors.push('Alamat wajib diisi')

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (member.email && !emailRegex.test(member.email)) {
            member.errors.push('Format email tidak valid')
          }

          return member
        })

        setParsedData(parsed)
        setParseError(null)
        setStep('preview')
      } catch (error) {
        setParseError('Gagal membaca file CSV. Pastikan format file benar.')
      }
    }
    reader.readAsText(file)
  }

  const handleImport = async () => {
    const validMembers = parsedData.filter(m => m.errors.length === 0)

    if (validMembers.length === 0) {
      setParseError('Tidak ada data valid untuk diimpor')
      return
    }

    if (!groupParticipant) {
      setParseError('Data grup tidak ditemukan')
      return
    }

    // Validate group capacity
    // We need to fetch current group members to check available slots
    // Note: This is a simplified check. In production, you'd want to fetch actual member count
    const expectedMembers = groupParticipant.participant_count
    const currentMembersCount = 1 // 1 for group leader. In production, fetch actual count from DB
    const availableSlots = expectedMembers - currentMembersCount

    if (validMembers.length > availableSlots) {
      setParseError(`Jumlah anggota yang diimpor (${validMembers.length}) melebihi kapasitas grup yang tersedia (${availableSlots} slot tersisa)`)
      return
    }

    // Convert to participant format
    const membersToImport = validMembers.map(({ errors, ...member }) => ({
      trip_id: groupParticipant.trip_id,
      sales_id: groupParticipant.sales_id,
      full_name: member.full_name,
      email: member.email,
      phone: member.phone,
      address: member.address,
      participant_count: 1, // Always 1 for individual group members
      package_price: 0, // No additional payment - covered by group leader
      dp_amount: 0, // No additional DP - covered by group leader
      dp_transfer_date: groupParticipant.dp_transfer_date,
      additional_requests: member.additional_requests || '',
      meeting_point_details: groupParticipant.meeting_point_details,
      status: groupParticipant.status,
      parent_participant_id: groupParticipant.id, // Link to group leader
      proof_of_transfer_url: null // Group members don't need separate proof
    }))

    try {
      await onImport(membersToImport)
      handleClose()
    } catch (error) {
      setParseError('Gagal mengimpor data anggota grup')
    }
  }

  const handleClose = () => {
    setCsvFile(null)
    setParsedData([])
    setParseError(null)
    setStep('upload')
    onClose()
  }

  const downloadTemplate = () => {
    const template = [
      'nama_lengkap,email,telepon,alamat,permintaan_tambahan',
      'John Doe,john@example.com,08123456789,"Jl. Sudirman No. 123, Jakarta","Makanan vegetarian"',
      'Jane Smith,jane@example.com,08198765432,"Jl. Thamrin No. 456, Jakarta",""',
      'Bob Wilson,bob@example.com,08111222333,"Jl. Gatot Subroto No. 789, Jakarta","Kursi roda untuk lansia"'
    ].join('\n')

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template-anggota-grup.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const validCount = parsedData.filter(m => m.errors.length === 0).length
  const errorCount = parsedData.filter(m => m.errors.length > 0).length

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileSpreadsheet className="h-5 w-5" />
            <span>Import Anggota Grup dari CSV</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Group Info */}
          {groupParticipant && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-blue-800 mb-2">Informasi Grup</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Nama Grup:</span>
                  <div className="font-medium">{groupParticipant.full_name}</div>
                </div>
                <div>
                  <span className="text-gray-600">Trip:</span>
                  <div className="font-medium">{groupParticipant.trips?.name || 'N/A'}</div>
                </div>
                <div>
                  <span className="text-gray-600">Target Peserta:</span>
                  <div className="font-medium">{groupParticipant.participant_count} orang</div>
                </div>
                <div>
                  <span className="text-gray-600">Sales:</span>
                  <div className="font-medium">{groupParticipant.sales?.name || 'N/A'}</div>
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <h3 className="font-semibold text-green-800 mb-2">Panduan Import CSV Anggota Grup</h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• File harus berformat CSV dengan encoding UTF-8</li>
                  <li>• Kolom yang wajib: nama_lengkap, email, telepon, alamat</li>
                  <li>• Kolom opsional: permintaan_tambahan</li>
                  <li>• Anggota grup otomatis terhubung dengan ketua grup</li>
                  <li>• Tidak perlu kolom pembayaran (sudah ditangani ketua grup)</li>
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

          {/* Step 2: Preview */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Preview Anggota Grup</h3>
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
                      <TableHead>Permintaan Khusus</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((member, index) => (
                      <TableRow key={index} className={member.errors.length > 0 ? 'bg-red-50' : 'bg-green-50'}>
                        <TableCell>
                          {member.errors.length === 0 ? (
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
                            {member.full_name || <span className="text-gray-400">-</span>}
                            {member.errors.length > 0 && (
                              <div className="text-xs text-red-600 mt-1">
                                {member.errors.join(', ')}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{member.email || <span className="text-gray-400">-</span>}</TableCell>
                        <TableCell>{member.phone || <span className="text-gray-400">-</span>}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {member.address || <span className="text-gray-400">-</span>}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {member.additional_requests || <span className="text-gray-400">-</span>}
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
                    <span className="text-gray-600">Akan Ditambahkan:</span>
                    <div className="font-bold text-blue-600">{validCount} anggota</div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={handleImport}
                  disabled={validCount === 0 || importing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {importing ? 'Mengimpor...' : `Import ${validCount} Anggota Valid`}
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