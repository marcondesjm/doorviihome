-- Add owner_status_message column to video_calls for real-time status updates
ALTER TABLE public.video_calls 
ADD COLUMN owner_status_message text DEFAULT 'Aguarde, estou indo até você';