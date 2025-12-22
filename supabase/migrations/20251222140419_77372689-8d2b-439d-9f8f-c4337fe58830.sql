-- Add meet_link column to video_calls table
ALTER TABLE public.video_calls
ADD COLUMN meet_link TEXT;

-- Add comment
COMMENT ON COLUMN public.video_calls.meet_link IS 'Google Meet link for the video call';