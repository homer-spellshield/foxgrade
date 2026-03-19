-- Add a URL-friendly slug field for subdomain routing
ALTER TABLE public.organisations ADD COLUMN slug text;

-- Generate an initial slug based on the name for existing rows
UPDATE public.organisations 
SET slug = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'));

-- Enforce uniqueness 
ALTER TABLE public.organisations ADD CONSTRAINT unique_slug UNIQUE (slug);
