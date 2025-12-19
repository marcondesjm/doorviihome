-- Add DELETE policy for video_calls table so users can delete their own calls
CREATE POLICY "Owners can delete their calls" 
ON public.video_calls 
FOR DELETE 
USING (auth.uid() = owner_id);

-- Add DELETE policy for activity_logs table so users can delete their own logs
CREATE POLICY "Users can delete their own activity logs" 
ON public.activity_logs 
FOR DELETE 
USING (auth.uid() = user_id);