-- Add RLS policy to allow anyone to read access codes by code value
CREATE POLICY "Anyone can read access codes by code value" 
ON public.access_codes 
FOR SELECT 
USING (true);