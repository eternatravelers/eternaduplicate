/*
  # Cleanup Duplicate Trips Policies
  
  Remove old duplicate policies to avoid conflicts
*/

DROP POLICY IF EXISTS "Only admins can delete trips" ON public.trips;
DROP POLICY IF EXISTS "Only admins can insert trips" ON public.trips;
DROP POLICY IF EXISTS "Users can view all trips" ON public.trips;
DROP POLICY IF EXISTS "Only admins can update trips" ON public.trips;
