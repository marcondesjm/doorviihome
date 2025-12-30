-- Add UPDATE policy for delivery_icons
CREATE POLICY "Users can update their own delivery icons" 
ON public.delivery_icons 
FOR UPDATE 
USING (auth.uid() = user_id);