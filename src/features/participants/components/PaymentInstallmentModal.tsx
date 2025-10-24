import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CreditCard, AlertCircle, Link as LinkIcon, ExternalLink, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PaymentInstallmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  participant: any
  remainingAmount: number
  loading: boolean
}

export function PaymentInstallmentModal({
  isOpen,
  onClose,
  onSubmit,
  participant,
  remainingAmount,
  loading
}: PaymentInstallmentModalProps) {
  const [formData, setFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
    amount: '' as number | '',
    payment_method: 'transfer',
    proof_of_transfer_url: '',
    notes: ''
  })

  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setFormData({
        payment_date: new Date().toISOString().split('T')[0],
        amount: '',
        payment_method: 'transfer',
        proof_of_transfer_url: '',
        notes: ''
      })
      setError('')
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const amount = Number(formData.amount)

    if (amount <= 0) {
      setError('Jumlah pembayaran harus lebih dari 0')
      return
    }

    if (amount > remainingAmount) {
      setError(`Jumlah pembayaran tidak boleh melebihi sisa pembayaran (${formatCurrency(remainingAmount)})`)
      return
    }

    const submitData = {
      participant_id: participant.id,
      payment_date: formData.payment_date,
      amount: amount,
      payment_method: formData.payment_method,
      proof_of_transfer_url: formData.proof_of_transfer_url || null,
      notes: formData.notes || null,
      payment_type: 'installment',
      status: 'verified'
    }

    await onSubmit(submitData)
  }

  const handleQuickAmount = (percentage: number) => {
    const quickAmount = Math.round(remainingAmount * percentage)
    setFormData(prev => ({ ...prev, amount: quickAmount }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-xl">
            <CreditCard className="h-6 w-6 text-green-600" />
            <span>Tambah Pembayaran Cicilan</span>
          </DialogTitle>
        </DialogHeader>

        {participant && (
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="font-semibold text-lg">{participant.full_name}</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Total Harga:</span>
                <span className="font-medium ml-2">{formatCurrency(participant.package_price || 0)}</span>
              </div>
              <div>
                <span className="text-gray-600">Sudah Dibayar:</span>
                <span className="font-medium ml-2 text-green-600">{formatCurrency(participant.total_paid || 0)}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">Sisa Pembayaran:</span>
                <span className="font-bold ml-2 text-red-600 text-lg">{formatCurrency(remainingAmount)}</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment_date">
              Tanggal Pembayaran <span className="text-red-500">*</span>
            </Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) => setFormData(prev => ({ ...prev, payment_date: e.target.value }))}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">
              Jumlah Pembayaran (Rp) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={remainingAmount}
              value={formData.amount}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                setFormData(prev => ({ ...prev, amount: isNaN(val) ? '' : val }))
              }}
              placeholder="Masukkan jumlah pembayaran"
              required
            />
            <div className="flex gap-2 flex-wrap">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleQuickAmount(0.25)}
              >
                25%
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleQuickAmount(0.5)}
              >
                50%
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleQuickAmount(0.75)}
              >
                75%
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => handleQuickAmount(1)}
              >
                Lunas
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Metode Pembayaran</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) => setFormData(prev => ({ ...prev, payment_method: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih metode pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transfer">Transfer Bank</SelectItem>
                <SelectItem value="cash">Tunai</SelectItem>
                <SelectItem value="ewallet">E-Wallet</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <Label className="text-base font-semibold flex items-center space-x-2">
              <LinkIcon className="h-5 w-5" />
              <span>Bukti Transfer (Opsional)</span>
            </Label>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="proof_of_transfer_url" className="text-sm font-medium">
                  URL Google Drive
                </Label>
                <Input
                  id="proof_of_transfer_url"
                  type="url"
                  value={formData.proof_of_transfer_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, proof_of_transfer_url: e.target.value }))}
                  placeholder="https://drive.google.com/file/d/..."
                />
              </div>

              <div className="text-xs text-gray-500 space-y-1">
                <p><strong>Cara mendapatkan URL Google Drive:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Upload bukti transfer ke Google Drive</li>
                  <li>Klik kanan pada file → "Get link" atau "Dapatkan link"</li>
                  <li>Pastikan pengaturan: "Anyone with the link can view"</li>
                  <li>Copy URL dan paste di kolom di atas</li>
                </ol>
              </div>

              {formData.proof_of_transfer_url && (
                <div className="p-3 bg-white border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <LinkIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">Google Drive File</div>
                        <div className="text-xs text-gray-500 truncate">{formData.proof_of_transfer_url}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(formData.proof_of_transfer_url, '_blank')}
                        className="h-8 px-2"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => setFormData(prev => ({ ...prev, proof_of_transfer_url: '' }))}
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

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Catatan tambahan (opsional)..."
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4 border-t">
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Batal
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
