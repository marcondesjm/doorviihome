-- Add column for owner's text response to visitor
ALTER TABLE public.video_calls 
ADD COLUMN owner_text_message text;