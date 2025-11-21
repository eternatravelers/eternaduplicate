import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

interface TripReadinessDetails {
  trip: any
  buses: any[]
  drivers: any[]
  tourLeaders: any[]
  meetingPoints: any[]
  checklists: any[]
  costPlan: any | null
  readinessBreakdown: {
    bus: { score: number; status: 'complete' | 'incomplete'; points: number }
    driver: { score: number; status: 'complete' | 'incomplete'; points: number }
    tourLeader: { score: number; status: 'complete' | 'incomplete'; points: number }
    costPlan: { score: number; status: 'complete' | 'incomplete'; points: number }
    meetingPoints: { score: number; status: 'complete' | 'incomplete'; points: number }
    checklist: { score: number; status: 'complete' | 'partial' | 'incomplete'; points: number; completed: number; total: number }
  }
  actionItems: Array<{
    id: string
    title: string
    priority: 'high' | 'medium' | 'low'
    impact: number
    action: string
    category: string
  }>
}

export function useTripReadiness(tripId: string) {
  const [data, setData] = useState<TripReadinessDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchReadinessData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch trip with all related data
      const { data: trip, error: tripError } = await supabase
        .from('trips')
        .select(`
          *,
          cost_plans(
            id,
            name,
            estimated_participants,
            total_cost,
            cost_per_person
          )
        `)
        .eq('id', tripId)
        .single()

      if (tripError) throw tripError

      // Fetch buses
      const { data: busesData, error: busesError } = await supabase
        .from('trip_buses')
        .select(`
          buses(
            id,
            bus_number,
            plate_number,
            type,
            model,
            capacity,
            status
          )
        `)
        .eq('trip_id', tripId)

      if (busesError) throw busesError
      const buses = busesData?.map(tb => tb.buses).filter(Boolean) || []

      // Fetch drivers
      const { data: driversData, error: driversError } = await supabase
        .from('trip_drivers')
        .select(`
          drivers(
            id,
            name,
            phone,
            license_number,
            license_type,
            status
          )
        `)
        .eq('trip_id', tripId)

      if (driversError) throw driversError
      const drivers = driversData?.map(td => td.drivers).filter(Boolean) || []

      // Fetch tour leaders
      const { data: tourLeadersData, error: tourLeadersError } = await supabase
        .from('trip_tour_leaders')
        .select(`
          tour_leaders(
            id,
            name,
            email,
            phone,
            certification,
            specialization,
            experience_years,
            status
          )
        `)
        .eq('trip_id', tripId)

      if (tourLeadersError) throw tourLeadersError
      const tourLeaders = tourLeadersData?.map(ttl => ttl.tour_leaders).filter(Boolean) || []

      // Fetch meeting points
      const { data: meetingPointsData, error: meetingPointsError } = await supabase
        .from('trip_meeting_points')
        .select(`
          meeting_point_id,
          is_primary,
          meeting_points(
            id,
            name,
            address,
            description
          )
        `)
        .eq('trip_id', tripId)

      if (meetingPointsError) throw meetingPointsError
      const meetingPoints = meetingPointsData?.map(tmp => ({
        ...tmp.meeting_points,
        is_primary: tmp.is_primary
      })).filter(Boolean) || []

      // Fetch checklists
      const { data: checklists, error: checklistsError } = await supabase
        .from('checklists')
        .select('*')
        .eq('trip_id', tripId)
        .order('completed', { ascending: true })
        .order('priority', { ascending: false })

      if (checklistsError) throw checklistsError

      // Calculate readiness breakdown
      const readinessBreakdown = {
        bus: {
          score: buses.length > 0 ? 20 : 0,
          status: buses.length > 0 ? 'complete' as const : 'incomplete' as const,
          points: 20
        },
        driver: {
          score: drivers.length > 0 ? 20 : 0,
          status: drivers.length > 0 ? 'complete' as const : 'incomplete' as const,
          points: 20
        },
        tourLeader: {
          score: tourLeaders.length > 0 ? 20 : 0,
          status: tourLeaders.length > 0 ? 'complete' as const : 'incomplete' as const,
          points: 20
        },
        costPlan: {
          score: trip.cost_plan_id ? 15 : 0,
          status: trip.cost_plan_id ? 'complete' as const : 'incomplete' as const,
          points: 15
        },
        meetingPoints: {
          score: meetingPoints.length > 0 ? 15 : 0,
          status: meetingPoints.length > 0 ? 'complete' as const : 'incomplete' as const,
          points: 15
        },
        checklist: {
          score: 0,
          status: 'incomplete' as const,
          points: 10,
          completed: 0,
          total: checklists?.length || 0
        }
      }

      // Calculate checklist score
      if (checklists && checklists.length > 0) {
        const completedCount = checklists.filter(c => c.completed).length
        readinessBreakdown.checklist.completed = completedCount
        readinessBreakdown.checklist.score = Math.round((completedCount / checklists.length) * 10)

        if (completedCount === checklists.length) {
          readinessBreakdown.checklist.status = 'complete'
        } else if (completedCount > 0) {
          readinessBreakdown.checklist.status = 'partial'
        }
      }

      // Generate action items
      const actionItems: TripReadinessDetails['actionItems'] = []

      if (buses.length === 0) {
        actionItems.push({
          id: 'assign-bus',
          title: 'Assign a bus to the trip',
          priority: 'high',
          impact: 20,
          action: 'assign-bus',
          category: 'Resources'
        })
      }

      if (drivers.length === 0) {
        actionItems.push({
          id: 'assign-driver',
          title: 'Assign a driver to the trip',
          priority: 'high',
          impact: 20,
          action: 'assign-driver',
          category: 'Resources'
        })
      }

      if (tourLeaders.length === 0) {
        actionItems.push({
          id: 'assign-tour-leader',
          title: 'Assign a tour leader to the trip',
          priority: 'high',
          impact: 20,
          action: 'assign-tour-leader',
          category: 'Resources'
        })
      }

      if (!trip.cost_plan_id) {
        actionItems.push({
          id: 'set-cost-plan',
          title: 'Set a cost plan for the trip',
          priority: 'medium',
          impact: 15,
          action: 'set-cost-plan',
          category: 'Administration'
        })
      }

      if (meetingPoints.length === 0) {
        actionItems.push({
          id: 'configure-meeting-points',
          title: 'Configure meeting points for the trip',
          priority: 'medium',
          impact: 15,
          action: 'configure-meeting-points',
          category: 'Administration'
        })
      }

      if (checklists && checklists.length > 0) {
        const pendingCount = checklists.filter(c => !c.completed).length
        if (pendingCount > 0) {
          actionItems.push({
            id: 'complete-checklists',
            title: `Complete ${pendingCount} pending checklist item${pendingCount > 1 ? 's' : ''}`,
            priority: 'low',
            impact: Math.round((pendingCount / checklists.length) * 10),
            action: 'complete-checklists',
            category: 'Operations'
          })
        }
      }

      // Sort action items by priority and impact
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      actionItems.sort((a, b) => {
        if (a.priority !== b.priority) {
          return priorityOrder[a.priority] - priorityOrder[b.priority]
        }
        return b.impact - a.impact
      })

      setData({
        trip,
        buses,
        drivers,
        tourLeaders,
        meetingPoints,
        checklists: checklists || [],
        costPlan: trip.cost_plans || null,
        readinessBreakdown,
        actionItems
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (tripId) {
      fetchReadinessData()
    }
  }, [tripId])

  return { data, loading, error, refetch: fetchReadinessData }
}
