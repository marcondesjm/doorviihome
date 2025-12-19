-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Members can view properties they belong to" ON public.properties;

-- Recreate the policy without causing recursion by using a simpler approach
-- The policy will check if the user is a member directly without subquery that causes recursion
CREATE POLICY "Members can view properties they belong to" 
ON public.properties 
FOR SELECT 
USING (
  user_id = auth.uid() 
  OR 
  id IN (
    SELECT pm.property_id 
    FROM public.property_members pm 
    WHERE pm.user_id = auth.uid() 
    AND pm.status = 'active'
  )
);