-- Add order column to delivery_icons table
ALTER TABLE public.delivery_icons 
ADD COLUMN display_order INTEGER DEFAULT 0;

-- Update existing icons with sequential order based on created_at
WITH ordered_icons AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at) - 1 as new_order
  FROM public.delivery_icons
)
UPDATE public.delivery_icons 
SET display_order = ordered_icons.new_order
FROM ordered_icons
WHERE public.delivery_icons.id = ordered_icons.id;