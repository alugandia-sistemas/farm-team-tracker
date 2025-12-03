-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view work zones" ON public.work_zones;

-- Create a permissive SELECT policy
CREATE POLICY "Authenticated users can view work zones"
ON public.work_zones
FOR SELECT
TO authenticated
USING (true);