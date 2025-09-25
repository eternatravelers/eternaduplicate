```tsx
import React, { useState, useEffect } from 'react'
import { ParticipantForm } from '../components/ParticipantForm'
import { useParticipants, useCreateParticipant, useUpdateParticipant } from '@/hooks/useParticipants'
import { useTrips } from '@/hooks/useTrips'
import { useSales } from '@/hooks/useSales'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface IndividualRegistrationPageProps {
  editingParticipantId: string | null
  onCancelEdit: () => void
  onParticipantSaved: () => void
}

export function IndividualRegistrationPage({
  editingParticipantId,
  onCancelEdit,
  onParticipantSaved
}: IndividualRegistrationPageProps) {
  const { participants } = useParticipants()
  const { trips } = useTrips()
  const { sales } = useSales()
  const { createParticipant, loading: creating } = useCreateParticipant()
  const { updateParticipant, loading: updating } = useUpdateParticipant()

  const [initialFormData, setInitialFormData] = useState<any>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (editingParticipantId) {
      const participantToEdit = participants.find(p => p.id === editingParticipantId)
      if (participantToEdit) {
        setInitialFormData({
          trip_id: participantToEdit.trip_id || '',
          sales_id: participantToEdit.sales_id || '',
          full_name: participantToEdit.full_name,
          email: participantToEdit.email,
          phone: participantToEdit.phone,
          address: participantToEdit.address,
          participant_count: participantToEdit.participant_count || '',
          package_price: participantToEdit.package_price || '',
          dp_amount: participantToEdit.dp_amount || '',
          dp_transfer_date: participantToEdit.dp_transfer_date,
          additional_requests: participantToEdit.additional_requests || '',
          meeting_point_details: participantToEdit.meeting_point_details || '',
          status: participantToEdit.status
        })
      }
    } else {
      setInitialFormData(undefined)
    }
  }, [editingParticipantId, participants])

  const handleSubmit = async (data: any) => {
    setError(null)
    try {
      const { error: submitError } = editingParticipantId
        ? await updateParticipant(editingParticipantId, data)
        : await createParticipant(data)

      if (submitError) {
        setError(submitError)
        return
      }
      onParticipantSaved()
      onCancelEdit() // Clear editing state after save
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan peserta.')
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <ParticipantForm
        initialData={initialFormData}
        onSubmit={handleSubmit}
        onCancel={onCancelEdit}
        trips={trips}
        sales={sales}
        creating={creating}
        updating={updating}
        editingParticipant={editingParticipantId}
      />
    </div>
  )
}
```