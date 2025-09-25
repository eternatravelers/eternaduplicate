import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { FileText, Plus, Download, Eye, Upload, Trash2, File, Image, FileSpreadsheet } from 'lucide-react'
import { formatShortDate } from '@/lib/utils'
import { useDocuments, useCreateDocument, useDeleteDocument } from '@/hooks/useDocuments'
import { useAuth } from '@/hooks/useAuth'

interface DocumentManagerProps {
  tripId?: string
  tripName?: string
}

export function DocumentManager({ tripId, tripName }: DocumentManagerProps) {
  const { documents, loading, refetch } = useDocuments(tripId)
  const { createDocument, loading: creating } = useCreateDocument()
  const { deleteDocument, loading: deleting } = useDeleteDocument()
  const { user } = useAuth()

  const [showUploadForm, setShowUploadForm] = useState(false)
  const [uploadData, setUploadData] = useState({
    name: '',
    type: 'other' as 'itinerary' | 'participant_list' | 'emergency_contact' | 'insurance' | 'permit' | 'other',
    notes: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Ukuran file maksimal 10MB')
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedFile) {
      alert('Pilih file terlebih dahulu')
      return
    }

    const documentData = {
      name: uploadData.name,
      type: uploadData.type,
      uploaded_by: user?.email || 'Unknown User',
      trip_id: tripId,
      notes: uploadData.notes
    }

    const { error } = await createDocument(documentData, selectedFile)

    if (!error) {
      // Reset form
      setUploadData({
        name: '',
        type: 'other',
        notes: ''
      })
      setSelectedFile(null)
      setShowUploadForm(false)
      refetch()
    }
  }

  const handleDelete = async (id: string, fileUrl: string) => {
    const { error } = await deleteDocument(id, fileUrl)
    if (!error) {
      refetch()
    }
  }

  const getDocumentIcon = (fileType: string) => {
    if (fileType.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-600" />
    } else if (fileType.includes('image')) {
      return <Image className="h-4 w-4 text-blue-600" />
    } else if (fileType.includes('spreadsheet') || fileType.includes('excel')) {
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />
    } else {
      return <File className="h-4 w-4 text-gray-600" />
    }
  }

  const getTypeBadge = (type: 'itinerary' | 'participant_list' | 'emergency_contact' | 'insurance' | 'permit' | 'other') => {
    const typeLabels = {
      itinerary: 'Itinerary',
      participant_list: 'Daftar Peserta',
      emergency_contact: 'Kontak Darurat',
      insurance: 'Asuransi',
      permit: 'Izin',
      other: 'Lainnya'
    }

    const typeColors = {
      itinerary: 'bg-blue-100 text-blue-800',
      participant_list: 'bg-green-100 text-green-800',
      emergency_contact: 'bg-red-100 text-red-800',
      insurance: 'bg-purple-100 text-purple-800',
      permit: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge className={typeColors[type]}>
        {typeLabels[type]}
      </Badge>
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Manajemen Dokumen</h2>
          <p className="text-gray-600">
            {tripName ? `Dokumen untuk ${tripName}` : 'Kelola dokumen operasional'}
          </p>
        </div>
        <Dialog open={showUploadForm} onOpenChange={setShowUploadForm}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Upload Dokumen
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5" />
                <span>Upload Dokumen Baru</span>
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="document_name">Nama Dokumen</Label>
                  <Input
                    id="document_name"
                    value={uploadData.name}
                    onChange={(e) => setUploadData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contoh: Itinerary Trip Bali"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_type">Tipe Dokumen</Label>
                  <select
                    id="document_type"
                    value={uploadData.type}
                    onChange={(e) => setUploadData(prev => ({ ...prev, type: e.target.value as 'itinerary' | 'participant_list' | 'emergency_contact' | 'insurance' | 'permit' | 'other' }))}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="itinerary">Itinerary</option>
                    <option value="participant_list">Daftar Peserta</option>
                    <option value="emergency_contact">Kontak Darurat</option>
                    <option value="insurance">Asuransi</option>
                    <option value="permit">Izin/Permit</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_file">File</Label>
                  <Input
                    id="document_file"
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                    required
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500">
                    Format yang didukung: PDF, DOC, XLS, JPG, PNG. Maksimal 10MB.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="document_notes">Catatan</Label>
                  <Input
                    id="document_notes"
                    value={uploadData.notes}
                    onChange={(e) => setUploadData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Catatan opsional tentang dokumen..."
                  />
                </div>

                {selectedFile && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {getDocumentIcon(selectedFile.type)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{selectedFile.name}</div>
                        <div className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button type="submit" disabled={!selectedFile}>
                  {creating ? 'Mengupload...' : 'Upload Dokumen'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowUploadForm(false)
                    setUploadData({ name: '', type: 'other', notes: '' })
                    setSelectedFile(null)
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading && (
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      )}

      {/* Documents Table */}
      {!loading && (
        <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Daftar Dokumen</span>
            <Badge variant="outline">{documents.length} dokumen</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <h3 className="text-lg font-medium mb-2">Belum ada dokumen</h3>
              <p className="text-sm mb-4">Upload dokumen pertama untuk trip ini</p>
              <Button onClick={() => setShowUploadForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Dokumen
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Dokumen</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead>Ukuran</TableHead>
                  <TableHead>Upload Oleh</TableHead>
                  <TableHead>Tanggal Upload</TableHead>
                  <TableHead>Catatan</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getDocumentIcon(document.file_type)}
                        <div>
                          <div className="font-medium">{document.name}</div>
                          <div className="text-xs text-gray-500">{document.file_type}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getTypeBadge(document.type)}</TableCell>
                    <TableCell>{formatFileSize(document.file_size)}</TableCell>
                    <TableCell>{document.uploaded_by}</TableCell>
                    <TableCell>{formatShortDate(document.uploaded_at)}</TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm text-gray-600">
                        {document.notes || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => window.open(document.file_url, '_blank')}
                          title="Lihat dokumen"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = document.file_url
                            link.download = document.name
                            link.click()
                          }}
                          title="Download dokumen"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(document.id)}
                          title="Hapus dokumen"
                          disabled={deleting}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      )}

      {/* Document Templates */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">Template Dokumen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="text-center">
                <div className="font-medium">Template Itinerary</div>
                <div className="text-xs text-gray-500">Download template itinerary</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <div className="text-center">
                <div className="font-medium">Template Daftar Peserta</div>
                <div className="text-xs text-gray-500">Download template Excel</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
              <FileText className="h-8 w-8 text-red-600" />
              <div className="text-center">
                <div className="font-medium">Template Kontak Darurat</div>
                <div className="text-xs text-gray-500">Download template PDF</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}