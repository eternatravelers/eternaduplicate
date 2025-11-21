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
  meeting_point_ids?: string[]
  primary_meeting_point_id?: string
  meeting_point_assignment_count?: number
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
          confirmed_participant_count,
          pending_participant_count,
          available_quota,
          readiness_score,
          can_accept_registrations,
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
          participants!left(id),
          trip_meeting_points!left(
            meeting_point_id,
            is_primary
          )
        `)
        .in('status', ['active', 'completed', 'cancelled', 'draft', 'open', 'confirmed', 'ongoing'])
        
      if (error) throw error

      // Calculate participant count and assignment count for each trip
      const tripsWithCount = await Promise.all(
        (data || []).map(async trip => {
          const meetingPoints = trip.trip_meeting_points || []
          const primaryMeetingPoint = meetingPoints.find((mp: any) => mp.is_primary)

          // Get assignment count for this trip
          const { count: assignmentCount } = await supabase
            .from('meeting_point_assignments')
            .select('*', { count: 'exact', head: true })
            .eq('trip_id', trip.id)

          // Get resource schedules for this trip
          const { data: schedules } = await supabase
            .from('resource_schedules')
            .select(`
              bus_id,
              driver_id,
              tour_leader_id,
              buses:bus_id(id, bus_number, plate_number, type, model, capacity, status),
              drivers:driver_id(id, name, phone, license_number, license_type, status),
              tour_leaders:tour_leader_id(id, name, email, phone, certification, specialization, experience_years, status, bio)
            `)
            .eq('trip_id', trip.id)

          // Extract unique resources
          const busesMap = new Map()
          const driversMap = new Map()
          const tourLeadersMap = new Map()

          schedules?.forEach(schedule => {
            if (schedule.bus_id && schedule.buses) {
              busesMap.set(schedule.bus_id, schedule.buses)
            }
            if (schedule.driver_id && schedule.drivers) {
              driversMap.set(schedule.driver_id, schedule.drivers)
            }
            if (schedule.tour_leader_id && schedule.tour_leaders) {
              tourLeadersMap.set(schedule.tour_leader_id, schedule.tour_leaders)
            }
          })

          return {
            ...trip,
            participant_count: trip.participants?.length || 0,
            destinations: trip.trip_destinations?.map(td => td.destinations).filter(Boolean) || [],
            tour_leaders: Array.from(tourLeadersMap.values()),
            buses: Array.from(busesMap.values()),
            drivers: Array.from(driversMap.values()),
            meeting_point_ids: meetingPoints.map((mp: any) => mp.meeting_point_id),
            primary_meeting_point_id: primaryMeetingPoint?.meeting_point_id,
            meeting_point_assignment_count: assignmentCount || 0
          }
        })
      )

      setTrips(tripsWithCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()

    // Re-fetch when window regains focus (user returns to tab)
    const handleFocus = () => {
      fetchTrips()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  return { trips, loading, error, refetch: fetchTrips }
}

type TripInsert = Database['public']['Tables']['trips']['Insert'] & {
  destination_ids?: string[]
  tour_leader_ids?: string[]
  bus_ids?: string[]
  driver_ids?: string[]
  meeting_point_ids?: string[]
  primary_meeting_point_id?: string
}

type TripUpdate = Database['public']['Tables']['trips']['Update'] & {
  destination_ids?: string[]
  tour_leader_ids?: string[]
  bus_ids?: string[]
  driver_ids?: string[]
  meeting_point_ids?: string[]
  primary_meeting_point_id?: string
}

export function useCreateTrip() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTrip = async (tripData: TripInsert) => {
    try {
      setLoading(true)
      setError(null)

      const { destination_ids, tour_leader_ids, bus_ids, driver_ids, meeting_point_ids, primary_meeting_point_id, ...restTripData } = tripData

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

      // Insert meeting points
      if (newTrip && meeting_point_ids && meeting_point_ids.length > 0) {
        const tripMeetingPointsToInsert = meeting_point_ids.map(mpId => ({
          trip_id: newTrip.id,
          meeting_point_id: mpId,
          is_primary: mpId === primary_meeting_point_id
        }))
        const { error: tmpError } = await supabase
          .from('trip_meeting_points')
          .insert(tripMeetingPointsToInsert)

        if (tmpError) throw tmpError
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

      const { destination_ids, tour_leader_ids, bus_ids, driver_ids, meeting_point_ids, primary_meeting_point_id, ...restTripData } = tripData

      // Convert empty string cost_plan_id to null
      if (restTripData.cost_plan_id === '') {
        restTripData.cost_plan_id = null
      }

      let updatedTrip: any = { id }

      // Only update the trip itself if there are actual fields to update
      if (Object.keys(restTripData).length > 0) {
        const { data: tripUpdateResult, error: tripError } = await supabase
          .from('trips')
          .update(restTripData)
          .eq('id', id)
          .select()
          .single()

        if (tripError) {
          if (tripError.code === 'PGRST116') {
            throw new Error('Trip not found or you do not have permission to update this trip')
          }
          throw tripError
        }

        updatedTrip = tripUpdateResult
      }

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

        // Handle trip_meeting_points updates
        const { error: deleteTMPError } = await supabase
          .from('trip_meeting_points')
          .delete()
          .eq('trip_id', id)

        if (deleteTMPError) throw deleteTMPError

        if (meeting_point_ids && meeting_point_ids.length > 0) {
          const tripMeetingPointsToInsert = meeting_point_ids.map(mpId => ({
            trip_id: id,
            meeting_point_id: mpId,
            is_primary: mpId === primary_meeting_point_id
          }))
          const { error: insertTMPError } = await supabase
            .from('trip_meeting_points')
            .insert(tripMeetingPointsToInsert)

          if (insertTMPError) throw insertTMPError
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