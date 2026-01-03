-- Add text message column to video_calls table
ALTER TABLE public.video_calls 
ADD COLUMN visitor_text_message TEXT;