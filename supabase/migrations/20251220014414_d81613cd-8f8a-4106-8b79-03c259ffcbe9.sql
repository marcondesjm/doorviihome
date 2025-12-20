-- Allow anyone to upload audio messages (for visitor responses)
CREATE POLICY "Anyone can upload audio messages"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'audio-messages');

-- Allow anyone to view audio messages (for playback)
CREATE POLICY "Anyone can view audio messages"
ON storage.objects
FOR SELECT
USING (bucket_id = 'audio-messages');