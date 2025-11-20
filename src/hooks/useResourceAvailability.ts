import { useState } from 'react'
import { supabase } from '@/lib/supabase'

interface ConflictingTrip {
  trip_id: string
  trip_name: string
  departure_date: string
  return_date: string
  status: string
}

interface ResourceConflict {
  hasConflict: boolean
  conflicts: ConflictingTrip[]
}

export function useResourceAvailability() {
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const checkBusAvailability = async (
    busId: string,
    departureDate: string,
    returnDate: string,
    excludeTripId?: string
  ): Promise<ResourceConflict> => {
    try {
      setChecking(true)
      setError(null)

      const { data: isAvailable, error: availError } = await supabase.rpc(
        'check_bus_availability',
        {
          bus_id_param: busId,
          departure_date_param: departureDate,
          return_date_param: returnDate,
          exclude_trip_id_param: excludeTripId || null
        }
      )

      if (availError) throw availError

      if (!isAvailable) {
        const { data: conflicts, error: conflictError } = await supabase.rpc(
          'get_conflicting_trips_for_bus',
          {
            bus_id_param: busId,
            departure_date_param: departureDate,
            return_date_param: returnDate,
            exclude_trip_id_param: excludeTripId || null
          }
        )

        if (conflictError) throw conflictError

        return {
          hasConflict: true,
          conflicts: conflicts || []
        }
      }

      return {
        hasConflict: false,
        conflicts: []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return {
        hasConflict: false,
        conflicts: []
      }
    } finally {
      setChecking(false)
    }
  }

  const checkDriverAvailability = async (
    driverId: string,
    departureDate: string,
    returnDate: string,
    excludeTripId?: string
  ): Promise<ResourceConflict> => {
    try {
      setChecking(true)
      setError(null)

      const { data: isAvailable, error: availError } = await supabase.rpc(
        'check_driver_availability',
        {
          driver_id_param: driverId,
          departure_date_param: departureDate,
          return_date_param: returnDate,
          exclude_trip_id_param: excludeTripId || null
        }
      )

      if (availError) throw availError

      if (!isAvailable) {
        const { data: conflicts, error: conflictError } = await supabase.rpc(
          'get_conflicting_trips_for_driver',
          {
            driver_id_param: driverId,
            departure_date_param: departureDate,
            return_date_param: returnDate,
            exclude_trip_id_param: excludeTripId || null
          }
        )

        if (conflictError) throw conflictError

        return {
          hasConflict: true,
          conflicts: conflicts || []
        }
      }

      return {
        hasConflict: false,
        conflicts: []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return {
        hasConflict: false,
        conflicts: []
      }
    } finally {
      setChecking(false)
    }
  }

  const checkTourLeaderAvailability = async (
    tourLeaderId: string,
    departureDate: string,
    returnDate: string,
    excludeTripId?: string
  ): Promise<ResourceConflict> => {
    try {
      setChecking(true)
      setError(null)

      const { data: isAvailable, error: availError } = await supabase.rpc(
        'check_tour_leader_availability',
        {
          tour_leader_id_param: tourLeaderId,
          departure_date_param: departureDate,
          return_date_param: returnDate,
          exclude_trip_id_param: excludeTripId || null
        }
      )

      if (availError) throw availError

      if (!isAvailable) {
        const { data: conflicts, error: conflictError } = await supabase.rpc(
          'get_conflicting_trips_for_tour_leader',
          {
            tour_leader_id_param: tourLeaderId,
            departure_date_param: departureDate,
            return_date_param: returnDate,
            exclude_trip_id_param: excludeTripId || null
          }
        )

        if (conflictError) throw conflictError

        return {
          hasConflict: true,
          conflicts: conflicts || []
        }
      }

      return {
        hasConflict: false,
        conflicts: []
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return {
        hasConflict: false,
        conflicts: []
      }
    } finally {
      setChecking(false)
    }
  }

  return {
    checkBusAvailability,
    checkDriverAvailability,
    checkTourLeaderAvailability,
    checking,
    error
  }
}
