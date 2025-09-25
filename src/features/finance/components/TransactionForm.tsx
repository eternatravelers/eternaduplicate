import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { DollarSign, Upload } from 'lucide-react'

interface TransactionFormProps {
  initialData?: any
  onSubmit: (data: any, file?: File | null) => Promise<void>
  onCancel: () => void
  trips: any[]
  destinations: any[]
  creating: boolean
  updating: boolean
  editingTransaction: string | null
}

export function TransactionForm({
  initialData,
  onSubmit,
  onCancel,
  trips,
  destinations,
  creating,
  updating,
  editingTransaction
}: TransactionFormProps) {
  const [formData, setFormData] = useState({
    transaction_date: '',
    transaction_type: '',
    category: '',
    amount: '' as number | '',
    description: '',
    trip_id: '',
    destination_id: '',
    trip_type: ''
  })

  const [proofUrl, setProofUrl] = useState<string>('')

  useEffect(() => {
    if (initialData) {
      setFormData({
        transaction_date: initialData.transaction_date || '',
        transaction_type: initialData.transaction_type || '',
        category: initialData.category || '',
        amount: initialData.amount || '',
        description: initialData.description || '',
        trip_id: initialData.trip_id || '',
        destination_id: initialData.destination_id || '',
        trip_type: initialData.trip_type || ''
      })
      setProofUrl(initialData.proof_url || '')
    } else {
      // Set default date to today
      setFormData(prev => ({
        ...prev,
        transaction_date: new Date().toISOString().split('T')[0]
      }))
    }
  }, [initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      amount: formData.amount === '' ? 0 : Number(formData.amount),
      trip_id: formData.trip_id === "" || formData.trip_id === "no-trip" ? null : formData.trip_id,
      destination_id: formData.destination_id === "" || formData.destination_id === "no-destination" ? null : formData.destination_id,
      proof_url: proofUrl || null
    }

    await onSubmit(submitData, null)
    
    // Reset form after successful submission if not editing
    if (!editingTransaction) {
      setFormData({
        transaction_date: new Date().toISOString().split('T')[0],
        transaction_type: '',
        category: '',
        amount: '',
        description: '',
        trip_id: '',
        destination_id: '',
        trip_type: ''
      })
      setProofUrl('')
    }
  }


  // Common transaction categories
  const incomeCategories = [
    'Pembayaran DP',
    'Pelunasan',
    'Biaya Tambahan',
    'Komisi',
    'Lain-lain'
  ]

  const expenseCategories = [
    'Transportasi',
    'Akomodasi',
    'Konsumsi',
    'Tiket Masuk',
    'Tour Guide',
    'Dokumentasi',
    'Operasional',
    'Marketing',
    'Administrasi',
    'Lain-lain'
  ]

  const categories = formData.transaction_type === 'Pemasukan' ? incomeCategories : expenseCategories

  return (
    <Card className="border-green-200 shadow-lg">
      <CardHeader className="bg-green-50">
        <CardTitle className="flex items-center space-x-2 text-green-800">
          <DollarSign className="h-5 w-5" />
          <span>{editingTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="transaction_date" className="text-sm font-medium">
                Tanggal Transaksi <span className="text-red-500">*</span>
              </Label>
              <Input
                id="transaction_date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData(prev => ({ ...prev, transaction_date: e.target.value }))}
                required
                className="focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="transaction_type" className="text-sm font-medium">
                Jenis Transaksi <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.transaction_type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, transaction_type: value, category: '' }))}
              >
                <SelectTrigger className="focus:ring-green-500 focus:border-green-500">
                  <SelectValue placeholder="Pilih jenis transaksi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pemasukan">Pemasukan</SelectItem>
                  <SelectItem value="Pengeluaran">Pengeluaran</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">
                Kategori <span className="text-red-500">*</span>
              </Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                disabled={!formData.transaction_type}
              >
                <SelectTrigger className="focus:ring-green-500 focus:border-green-500">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-sm font-medium">
                Jumlah (Rp) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                min="0"
                value={formData.amount}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                  setFormData(prev => ({ ...prev, amount: isNaN(val) ? '' : val }))
                }}
                placeholder="0"
                required
                className="focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trip_id" className="text-sm font-medium">
                Trip Terkait (Opsional)
              </Label>
              <Select 
                value={formData.trip_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, trip_id: value === "no-trip" ? "" : value }))}
              >
                <SelectTrigger className="focus:ring-green-500 focus:border-green-500">
                  <SelectValue placeholder="Pilih trip" />
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
              <Label htmlFor="destination_id" className="text-sm font-medium">
                Destinasi Terkait (Opsional)
              </Label>
              <Select 
                value={formData.destination_id} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, destination_id: value === "no-destination" ? "" : value }))}
              >
                <SelectTrigger className="focus:ring-green-500 focus:border-green-500">
                  <SelectValue placeholder="Pilih destinasi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-destination">Tidak ada destinasi</SelectItem>
                  {destinations.map(destination => (
                    <SelectItem key={destination.id} value={destination.id}>
                      {destination.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Keterangan
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Deskripsi detail transaksi..."
              rows={3}
              className="focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Proof Upload Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <Label className="text-base font-semibold flex items-center space-x-2">
              <Link className="h-5 w-5" />
              <span>Bukti Transaksi (Opsional)</span>
            </Label>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="proof_url" className="text-sm font-medium">
                  URL Google Drive
                </Label>
                <Input
                  id="proof_url"
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://drive.google.com/file/d/..."
                  className="focus:ring-green-500 focus:border-green-500"
                />
              </div>
              
              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Cara mendapatkan URL Google Drive:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Upload file bukti transaksi ke Google Drive</li>
                  <li>Klik kanan pada file → "Get link" atau "Dapatkan link"</li>
                  <li>Pastikan pengaturan: "Anyone with the link can view"</li>
                  <li>Copy URL dan paste di kolom di atas</li>
                </ol>
              </div>
              
              {proofUrl && (
                <div className="p-3 bg-white border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <Link className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">Google Drive File</div>
                        <div className="text-xs text-gray-500 truncate">{proofUrl}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(proofUrl, '_blank')}
                        className="h-8 px-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setProofUrl('')}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <Button 
              type="submit" 
              disabled={creating || updating}
              className="bg-green-600 hover:bg-green-700"
            >
              {creating || updating ? 'Menyimpan...' : editingTransaction ? 'Update Transaksi' : 'Simpan Transaksi'}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="border-gray-300"
            >
              Batal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}