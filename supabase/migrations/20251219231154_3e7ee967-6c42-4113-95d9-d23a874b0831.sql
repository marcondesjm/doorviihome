-- Drop all problematic policies first
DROP POLICY IF EXISTS "Members can view properties they belong to" ON public.properties;
DROP POLICY IF EXISTS "Users can view their own properties" ON public.properties;
DROP POLICY IF EXISTS "Property owners can view members" ON public.property_members;
DROP POLICY IF EXISTS "Property owners can add members" ON public.property_members;
DROP POLICY IF EXISTS "Property owners can remove members" ON public.property_members;

-- Create security definer function to check if user owns a property
CREATE OR REPLACE FUNCTION public.is_property_owner(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.properties
    WHERE id = _property_id
      AND user_id = _user_id
  )
$$;

-- Create security definer function to check if user is a member of a property
CREATE OR REPLACE FUNCTION public.is_property_member(_user_id uuid, _property_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.property_members
    WHERE property_id = _property_id
      AND user_id = _user_id
      AND status = 'active'
  )
$$;

-- Recreate properties policies without recursion
CREATE POLICY "Users can view their own properties" 
ON public.properties 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Members can view properties they belong to" 
ON public.properties 
FOR SELECT 
USING (public.is_property_member(auth.uid(), id));

-- Recreate property_members policies without recursion
CREATE POLICY "Property owners can view members" 
ON public.property_members 
FOR SELECT 
USING (public.is_property_owner(auth.uid(), property_id));

CREATE POLICY "Property owners can add members" 
ON public.property_members 
FOR INSERT 
WITH CHECK (
  public.is_property_owner(auth.uid(), property_id) 
  OR invited_by = auth.uid()
);

CREATE POLICY "Property owners can remove members" 
ON public.property_members 
FOR DELETE 
USING (public.is_property_owner(auth.uid(), property_id));