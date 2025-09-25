import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Trip = Database['public']['Tables']['trips']['Row'] & {
  destinations?: Database['public']['Tables']['destinations']['Row'][]
  cost_plans?: Database['public']['Tables']['cost_plans']['Row']
  tour_leaders?: Database['public']['Tables']['tour_leaders']['Row'][]
  buses?: Database['public']['Tables']['buses']['Row'][]
  drivers?: Database['public']['Tables']['drivers']['Row'][]
  participant_count?: number
}

export function useTrips() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTrips = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('trips')
        .select(`
          id,
          name,
          trip_type,
          departure_date,
          return_date,
          meeting_point,
          quota,
          price,
          additional_facilities,
          tour_leader,
          status,
          created_at,
          updated_at,
          pricing_type,
          cost_plan_id,
          trip_destinations!left(
            destinations(
              id,
              name,
              location
            )
          ),
          cost_plans(
            id,
            name,
            estimated_participants,
            categories,
            total_cost,
            cost_per_person
          ),
          trip_tour_leaders!left(
            tour_leaders(
              id,
              name,
              email,
              phone,
              certification,
              specialization,
              experience_years,
              status,
              bio
            )
          ),
          trip_buses!left(
            buses(
              id,
              plate_number,
              model,
              capacity,
              status
            )
          ),
          trip_drivers!left(
            drivers(
              id,
              name,
              phone,
              license_number,
              status
            )
          ),
          participants!left(id)
        `)
        .in('status', ['active', 'completed', 'cancelled', 'draft']) // Filter out deleted trips by explicitly including active ones
        
      if (error) throw error

      // Calculate participant count for each trip and flatten destinations
      const tripsWithCount = data?.map(trip => ({
        ...trip,
        participant_count: trip.participants?.length || 0,
        destinations: trip.trip_destinations?.map(td => td.destinations).filter(Boolean) || [],
        tour_leaders: trip.trip_tour_leaders?.map(ttl => ttl.tour_leaders).filter(Boolean) || [],
        buses: trip.trip_buses?.map(tb => tb.buses).filter(Boolean) || [],
        drivers: trip.trip_drivers?.map(td => td.drivers).filter(Boolean) || []
      })) || []

      setTrips(tripsWithCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [])

  return { trips, loading, error, refetch: fetchTrips }
}

type TripInsert = Database['public']['Tables']['trips']['Insert'] & {
  destination_ids?: string[]
  tour_leader_ids?: string[]
  bus_ids?: string[]
  driver_ids?: string[]
}

type TripUpdate = Database['public']['Tables']['trips']['Update'] & {
  destination_ids?: string[]
  tour_leader_ids?: string[]
  bus_ids?: string[]
  driver_ids?: string[]
}

export function useCreateTrip() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTrip = async (tripData: TripInsert) => {
    try {
      setLoading(true)
      setError(null)

      const { destination_ids, tour_leader_ids, bus_ids, driver_ids, ...restTripData } = tripData

      // Convert empty string cost_plan_id to null
      if (restTripData.cost_plan_id === '') {
        restTripData.cost_plan_id = null
      }

      const { data: newTrip, error: tripError } = await supabase
        .from('trips')
        .insert([restTripData])
        .select()
        .single()

      if (tripError) throw tripError

      if (newTrip && destination_ids && destination_ids.length > 0) {
        const tripDestinationsToInsert = destination_ids.map(destId => ({
          trip_id: newTrip.id,
          destination_id: destId
        }))
        const { error: tdError } = await supabase
          .from('trip_destinations')
          .insert(tripDestinationsToInsert)

        if (tdError) throw tdError
      }

      // Insert tour leaders
      if (newTrip && tour_leader_ids && tour_leader_ids.length > 0) {
        const tripTourLeadersToInsert = tour_leader_ids.map(tlId => ({
          trip_id: newTrip.id,
          tour_leader_id: tlId
        }))
        const { error: ttlError } = await supabase
          .from('trip_tour_leaders')
          .insert(tripTourLeadersToInsert)

        if (ttlError) throw ttlError
      }

      // Insert buses
      if (newTrip && bus_ids && bus_ids.length > 0) {
        const tripBusesToInsert = bus_ids.map(busId => ({
          trip_id: newTrip.id,
          bus_id: busId
        }))
        const { error: tbError } = await supabase
          .from('trip_buses')
          .insert(tripBusesToInsert)

        if (tbError) throw tbError
      }

      // Insert drivers
      if (newTrip && driver_ids && driver_ids.length > 0) {
        const tripDriversToInsert = driver_ids.map(driverId => ({
          trip_id: newTrip.id,
          driver_id: driverId
        }))
        const { error: tdError } = await supabase
          .from('trip_drivers')
          .insert(tripDriversToInsert)

        if (tdError) throw tdError
      }
      return { data: newTrip, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { createTrip, loading, error }
}

export function useUpdateTrip() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateTrip = async (id: string, tripData: TripUpdate) => {
    try {
      setLoading(true)
      setError(null)

      const { destination_ids, tour_leader_ids, bus_ids, driver_ids, ...restTripData } = tripData

      // Convert empty string cost_plan_id to null
      if (restTripData.cost_plan_id === '') {
        restTripData.cost_plan_id = null
      }

      // Update the trip itself
      const { data: updatedTrip, error: tripError } = await supabase
        .from('trips')
        .update(restTripData)
        .eq('id', id)
        .select()
        .single()

      if (tripError) throw tripError

      // Handle trip_destinations updates
      if (updatedTrip) {
        // Delete existing associations
        const { error: deleteError } = await supabase
          .from('trip_destinations')
          .delete()
          .eq('trip_id', id)

        if (deleteError) throw deleteError

        // Insert new associations if provided
        if (destination_ids && destination_ids.length > 0) {
          const tripDestinationsToInsert = destination_ids.map(destId => ({
            trip_id: id,
            destination_id: destId
          }))
          const { error: insertError } = await supabase
            .from('trip_destinations')
            .insert(tripDestinationsToInsert)

          if (insertError) throw insertError
        }

        // Handle trip_tour_leaders updates
        const { error: deleteTTLError } = await supabase
          .from('trip_tour_leaders')
          .delete()
          .eq('trip_id', id)

        if (deleteTTLError) throw deleteTTLError

        if (tour_leader_ids && tour_leader_ids.length > 0) {
          const tripTourLeadersToInsert = tour_leader_ids.map(tlId => ({
            trip_id: id,
            tour_leader_id: tlId
          }))
          const { error: insertTTLError } = await supabase
            .from('trip_tour_leaders')
            .insert(tripTourLeadersToInsert)

          if (insertTTLError) throw insertTTLError
        }

        // Handle trip_buses updates
        const { error: deleteTBError } = await supabase
          .from('trip_buses')
          .delete()
          .eq('trip_id', id)

        if (deleteTBError) throw deleteTBError

        if (bus_ids && bus_ids.length > 0) {
          const tripBusesToInsert = bus_ids.map(busId => ({
            trip_id: id,
            bus_id: busId
          }))
          const { error: insertTBError } = await supabase
            .from('trip_buses')
            .insert(tripBusesToInsert)

          if (insertTBError) throw insertTBError
        }

        // Handle trip_drivers updates
        const { error: deleteTDError } = await supabase
          .from('trip_drivers')
          .delete()
          .eq('trip_id', id)

        if (deleteTDError) throw deleteTDError

        if (driver_ids && driver_ids.length > 0) {
          const tripDriversToInsert = driver_ids.map(driverId => ({
            trip_id: id,
            driver_id: driverId
          }))
          const { error: insertTDError } = await supabase
            .from('trip_drivers')
            .insert(tripDriversToInsert)

          if (insertTDError) throw insertTDError
        }
      }

      return { data: updatedTrip, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { updateTrip, loading, error }
}

export function useDeleteTrip() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteTrip = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Perform soft delete by updating status to 'deleted'
      const { error } = await supabase
        .from('trips')
        .update({ status: 'deleted' })
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { deleteTrip, loading, error }
}