-- Add columns for media URLs in activity logs
ALTER TABLE public.activity_logs 
ADD COLUMN IF NOT EXISTS media_url text,
ADD COLUMN IF NOT EXISTS media_type text;

-- Add comment for documentation
COMMENT ON COLUMN public.activity_logs.media_url IS 'URL of audio/video recording associated with this activity';
COMMENT ON COLUMN public.activity_logs.media_type IS 'Type of media: audio, video, or null';