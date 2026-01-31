import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, AlertCircle, History } from 'lucide-react'
import { PaymentSummaryCard } from './PaymentSummaryCard'
import { PaymentHistoryTable } from './PaymentHistoryTable'
import { PaymentInstallmentModal } from './PaymentInstallmentModal'
import {
  usePaymentInstallments,
  usePaymentSummary,
  useCreatePaymentInstallment,
  useDeletePaymentInstallment
} from '@/hooks/usePaymentInstallments'

interface PaymentManagementModalProps {
  isOpen: boolean
  onClose: () => void
  participant: any
  onRefresh?: () => void
}

export function PaymentManagementModal({
  isOpen,
  onClose,
  participant,
  onRefresh
}: PaymentManagementModalProps) {
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [error, setError] = useState('')

  const participantId = participant?.id || null
  const { installments, loading: loadingInstallments, refetch: refetchInstallments } = usePaymentInstallments(participantId)
  const { summary, loading: loadingSummary, refetch: refetchSummary } = usePaymentSummary(participantId)
  const { createInstallment, loading: creating } = useCreatePaymentInstallment()
  const { deleteInstallment, loading: deleting } = useDeletePaymentInstallment()

  const handleAddPayment = async (data: any) => {
    setError('')
    const { error: createError } = await createInstallment(data)

    if (createError) {
      setError(createError)
      return
    }

    setShowAddPayment(false)
    refetchInstallments()
    refetchSummary()
    if (onRefresh) onRefresh()
  }

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus pembayaran ini?')) {
      return
    }

    setError('')
    const { error: deleteError } = await deleteInstallment(id)

    if (deleteError) {
      setError(deleteError)
      return
    }

    refetchInstallments()
    refetchSummary()
    if (onRefresh) onRefresh()
  }

  if (!isOpen || !participant?.id) {
    return null
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Kelola Pembayaran Peserta</DialogTitle>
            <div className="text-sm text-gray-600 mt-2">
              {participant.full_name} - {participant.email}
            </div>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {loadingSummary ? (
              <div className="animate-pulse">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
              </div>
            ) : (
              <PaymentSummaryCard
                packagePrice={summary.packagePrice}
                totalPaid={summary.totalPaid}
                remainingPayment={summary.remainingPayment}
                paymentStatus={summary.paymentStatus}
                paymentPercentage={summary.paymentPercentage}
                installmentCount={summary.installmentCount}
              />
            )}

            <Tabs defaultValue="history" className="w-full">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="history">
                    <History className="h-4 w-4 mr-2" />
                    Riwayat Pembayaran
                  </TabsTrigger>
                </TabsList>

                {summary.remainingPayment > 0 && (
                  <Button
                    onClick={() => setShowAddPayment(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Pembayaran
                  </Button>
                )}
              </div>

              <TabsContent value="history">
                {loadingInstallments ? (
                  <div className="animate-pulse">
                    <div className="h-48 bg-gray-200 rounded-lg"></div>
                  </div>
                ) : (
                  <PaymentHistoryTable
                    installments={installments}
                    onDelete={handleDeletePayment}
                    deleting={deleting}
                    showActions={true}
                  />
                )}
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <PaymentInstallmentModal
        isOpen={showAddPayment}
        onClose={() => setShowAddPayment(false)}
        onSubmit={handleAddPayment}
        participant={participant}
        remainingAmount={summary.remainingPayment}
        loading={creating}
      />
    </>
  )
}
