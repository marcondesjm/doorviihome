-- Create table to store VAPID keys
CREATE TABLE public.vapid_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  public_key TEXT NOT NULL,
  private_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vapid_keys ENABLE ROW LEVEL SECURITY;

-- Only service role can access (for edge functions)
CREATE POLICY "Service role only" 
ON public.vapid_keys 
FOR ALL 
USING (false)
WITH CHECK (false);