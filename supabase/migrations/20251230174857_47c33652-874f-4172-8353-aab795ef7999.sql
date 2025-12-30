-- Allow anyone (including unauthenticated visitors) to create video calls
-- This is needed because visitors scanning the QR code need to create a call entry
CREATE POLICY "Anyone can create calls for properties"
ON public.video_calls
FOR INSERT
WITH CHECK (true);