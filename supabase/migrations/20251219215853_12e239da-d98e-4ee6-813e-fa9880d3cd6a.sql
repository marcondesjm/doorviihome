-- Create table for delivery icons
CREATE TABLE public.delivery_icons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.delivery_icons ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own delivery icons" 
ON public.delivery_icons 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own delivery icons" 
ON public.delivery_icons 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own delivery icons" 
ON public.delivery_icons 
FOR DELETE 
USING (auth.uid() = user_id);