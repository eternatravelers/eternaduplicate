```tsx
import React, { useState } from 'react'
import { GroupRegistrationForm } from '../components/GroupRegistrationForm'
import { useCreateParticipant } from '@/hooks/useParticipants'
import { useTrips } from '@/hooks/useTrips'
import { useSales } from '@/hooks/useSales'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface GroupRegistrationPageProps {
  onGroupSaved: () => void
}

export function GroupRegistrationPage({ onGroupSaved }: GroupRegistrationPageProps) {
  const { trips } = useTrips()
  const { sales } = useSales()
  const { createParticipant, loading: creating } = useCreateParticipant()
  const [error, setError] = useState<string | null>(null)

  const handleGroupSubmit = async (data: any): Promise<any> => {
    setError(null)
    try {
      const { data: newParticipant, error: submitError } = await createParticipant(data)
      if (submitError) {
        setError(submitError)
        return null
      }
      onGroupSaved()
      return newParticipant
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan grup.')
      return null
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
      <GroupRegistrationForm
        onSubmit={handleGroupSubmit}
        trips={trips}
        sales={sales}
        creating={creating}
      />
    </div>
  )
}
```