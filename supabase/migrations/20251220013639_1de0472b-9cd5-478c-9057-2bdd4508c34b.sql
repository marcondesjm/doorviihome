-- Add visitor audio response column to video_calls table
ALTER TABLE public.video_calls 
ADD COLUMN IF NOT EXISTS visitor_audio_url TEXT;