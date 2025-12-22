-- Add visitor_always_connected column to properties table
ALTER TABLE public.properties
ADD COLUMN visitor_always_connected boolean DEFAULT false;