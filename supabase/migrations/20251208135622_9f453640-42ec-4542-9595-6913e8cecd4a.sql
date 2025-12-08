-- Change quantity column from integer to numeric to support decimal values
ALTER TABLE public.requirement_items 
ALTER COLUMN quantity TYPE numeric USING quantity::numeric;