import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface StatusTransitionResult {
  isValid: boolean
  errorMessage?: string
}

export function useTripStatusValidation() {
  const [validating, setValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateStatusTransition = async (
    tripId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<StatusTransitionResult> => {
    try {
      setValidating(true)
      setError(null)

      const { data, error: validationError } = await supabase.rpc(
        'validate_trip_status_transition',
        {
          trip_id_param: tripId,
          old_status: oldStatus,
          new_status: newStatus
        }
      )

      if (validationError) throw validationError

      if (data && data.length > 0) {
        const result = data[0]
        return {
          isValid: result.is_valid,
          errorMessage: result.error_message
        }
      }

      return {
        isValid: false,
        errorMessage: 'Validation result not found'
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return {
        isValid: false,
        errorMessage
      }
    } finally {
      setValidating(false)
    }
  }

  const canAcceptRegistrations = async (tripId: string): Promise<boolean> => {
    try {
      const { data, error: checkError } = await supabase.rpc(
        'check_trip_can_accept_registrations',
        {
          trip_id_param: tripId
        }
      )

      if (checkError) throw checkError

      return data || false
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return false
    }
  }

  const calculateReadinessScore = async (tripId: string): Promise<number> => {
    try {
      const { data, error: scoreError } = await supabase.rpc(
        'calculate_trip_readiness_score',
        {
          trip_id_param: tripId
        }
      )

      if (scoreError) throw scoreError

      return data || 0
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return 0
    }
  }

  return {
    validateStatusTransition,
    canAcceptRegistrations,
    calculateReadinessScore,
    validating,
    error
  }
}
