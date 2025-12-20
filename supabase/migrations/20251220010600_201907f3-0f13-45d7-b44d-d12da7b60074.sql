-- Create storage bucket for audio messages
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-messages', 'audio-messages', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy for authenticated users to upload
CREATE POLICY "Users can upload audio messages"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'audio-messages' AND auth.role() = 'authenticated');

-- Create policy for public read access
CREATE POLICY "Anyone can read audio messages"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audio-messages');

-- Add audio_message_url column to video_calls
ALTER TABLE public.video_calls
ADD COLUMN IF NOT EXISTS audio_message_url TEXT;