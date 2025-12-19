-- Create table for property memberships
CREATE TABLE public.property_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invited_by UUID NOT NULL,
  UNIQUE(property_id, user_id)
);

-- Create table for invite codes
CREATE TABLE public.property_invite_codes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  max_uses INTEGER DEFAULT 1,
  uses_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.property_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_invite_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_members
CREATE POLICY "Property owners can view members" 
ON public.property_members 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Members can view their own memberships" 
ON public.property_members 
FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Property owners can add members" 
ON public.property_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND user_id = auth.uid()
  )
  OR invited_by = auth.uid()
);

CREATE POLICY "Property owners can remove members" 
ON public.property_members 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Members can leave properties" 
ON public.property_members 
FOR DELETE 
USING (user_id = auth.uid());

-- RLS Policies for property_invite_codes
CREATE POLICY "Property owners can view their invite codes" 
ON public.property_invite_codes 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Property owners can create invite codes" 
ON public.property_invite_codes 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Property owners can update invite codes" 
ON public.property_invite_codes 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can read active codes by code value" 
ON public.property_invite_codes 
FOR SELECT 
USING (is_active = true AND expires_at > now());

CREATE POLICY "Property owners can delete invite codes" 
ON public.property_invite_codes 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.properties 
    WHERE id = property_id AND user_id = auth.uid()
  )
);

-- Update video_calls RLS to allow members to view and participate
CREATE POLICY "Members can view calls for their properties" 
ON public.video_calls 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.property_members 
    WHERE property_id = video_calls.property_id 
    AND user_id = auth.uid() 
    AND status = 'active'
  )
);

CREATE POLICY "Members can update calls for their properties" 
ON public.video_calls 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.property_members 
    WHERE property_id = video_calls.property_id 
    AND user_id = auth.uid() 
    AND status = 'active'
  )
);

-- Update properties RLS to allow members to view properties they're members of
CREATE POLICY "Members can view properties they belong to" 
ON public.properties 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.property_members 
    WHERE property_id = properties.id 
    AND user_id = auth.uid() 
    AND status = 'active'
  )
);